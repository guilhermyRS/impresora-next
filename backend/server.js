require('dotenv').config()
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const printer = require('pdf-to-printer')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const axios = require('axios')
const pdf = require('pdf-page-counter')

const app = express()
app.use(cors())
app.use(express.json())

// Configuração do Mercado Pago
const MERCADO_PAGO_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN
const PRICE_PER_PAGE = Number(process.env.PRICE_PER_PAGE) || 0.50

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads')
    }
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

// Função para listar impressoras usando PowerShell (Windows)
function getWindowsPrinters() {
  return new Promise((resolve, reject) => {
    const command = 'powershell.exe "Get-Printer | Select-Object Name | Format-Table -HideTableHeaders"'
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Erro ao listar impressoras:', error)
        reject(error)
        return
      }

      try {
        const printers = stdout
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(name => ({
            name: name,
            displayName: name
          }))

        resolve(printers)
      } catch (parseError) {
        console.error('Erro ao processar lista de impressoras:', parseError)
        reject(parseError)
      }
    })
  })
}

async function createPixPayment(amount) {
  try {
    const idempotencyKey = `key-${Date.now()}`

    const response = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      {
        transaction_amount: amount,
        payment_method_id: 'pix',
        payer: {
          email: 'developerguilhermy@gmail.com',
        },
        description: 'Serviço de Impressão',
      },
      {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        }
      }
    )

    const paymentData = response.data
    if (!paymentData.point_of_interaction || !paymentData.point_of_interaction.transaction_data.qr_code) {
      throw new Error('QR Code inválido ou não gerado.')
    }

    return {
      id: paymentData.id,
      qr_code: paymentData.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: paymentData.point_of_interaction.transaction_data.qr_code_base64,
      status: paymentData.status
    }
  } catch (error) {
    console.error('Erro ao criar pagamento Pix:', error.response?.data || error)
    throw error
  }
}

async function checkPaymentStatus(paymentId) {
  try {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_TOKEN}`
        }
      }
    )
    return response.data.status
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error)
    throw error
  }
}

// Rotas da API
app.get('/price-per-page', (req, res) => {
  res.json({ pricePerPage: PRICE_PER_PAGE })
})

app.get('/printers', async (req, res) => {
  try {
    const printers = await getWindowsPrinters()
    res.json({ printers })
  } catch (error) {
    console.error('Erro ao buscar impressoras:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar impressoras', 
      printers: [] 
    })
  }
})

app.post('/count-pages', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' })
  }

  try {
    const dataBuffer = fs.readFileSync(req.file.path)
    const data = await pdf(dataBuffer)
    const pageCount = data.numpages
    
    // Calcula o preço baseado no número de páginas
    const totalPrice = pageCount * PRICE_PER_PAGE

    // Limpa o arquivo temporário
    fs.unlinkSync(req.file.path)

    res.json({ 
      pageCount, 
      totalPrice,
      pricePerPage: PRICE_PER_PAGE
    })
  } catch (error) {
    console.error('Erro ao contar páginas:', error)
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ error: 'Erro ao processar o arquivo PDF' })
  }
})

app.post('/create-payment', async (req, res) => {
  try {
    const pageCount = req.body.pageCount
    const amount = pageCount * PRICE_PER_PAGE
    
    const paymentData = await createPixPayment(amount)
    res.json(paymentData)
  } catch (error) {
    console.error('Erro ao criar pagamento:', error)
    res.status(500).json({ 
      error: 'Erro ao criar pagamento',
      details: error.response?.data || error.message
    })
  }
})

app.get('/payment-status/:paymentId', async (req, res) => {
  try {
    const status = await checkPaymentStatus(req.params.paymentId)
    res.json({ status })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar status do pagamento' })
  }
})

app.post('/print', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' })
  }

  const filePath = req.file.path
  const printerName = req.body.printer
  const paymentId = req.body.paymentId

  try {
    // Verificar status do pagamento
    const status = await checkPaymentStatus(paymentId)
    
    if (status !== 'approved') {
      fs.unlinkSync(filePath)
      return res.status(400).json({ error: 'Pagamento não aprovado' })
    }

    // Enviar para impressão
    await printer.print(filePath, {
      printer: printerName,
      paperSize: 'A4'
    })

    fs.unlinkSync(filePath)
    res.json({ message: 'Documento enviado para impressão!' })
  } catch (error) {
    console.error('Erro na impressão:', error)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    res.status(500).json({ error: 'Erro ao imprimir' })
  }
})

// Iniciar servidor
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})