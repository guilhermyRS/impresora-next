'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { AnimatePresence } from 'framer-motion'
import { Upload, Printer, FileText, DollarSign } from 'lucide-react'
import axios from 'axios'
import Navbar from './components/Navbar'
import QRCodeModal from './components/QRCodeModal'
import SuccessAnimation from './components/SuccessAnimation'

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [printers, setPrinters] = useState([])
  const [selectedPrinter, setSelectedPrinter] = useState('')
  const [loading, setLoading] = useState(true)
  const [pixQRCode, setPixQRCode] = useState(null)
  const [paymentData, setPaymentData] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [pageCount, setPageCount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [pricePerPage, setPricePerPage] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    fetchPrinters()
    fetchPricePerPage()
  }, [])

  const fetchPricePerPage = async () => {
    try {
      const response = await axios.get('http://localhost:3001/price-per-page')
      setPricePerPage(response.data.pricePerPage)
    } catch (error) {
      toast.error('Erro ao carregar preço por página')
    }
  }

  const fetchPrinters = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:3001/printers')
      const printersList = response.data.printers || []
      setPrinters(printersList)
      if (printersList.length > 0) {
        setSelectedPrinter(printersList[0].name)
      }
    } catch (error) {
      toast.error('Erro ao carregar impressoras')
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    await processFile(file)
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    await processFile(file)
  }

  const processFile = async (file) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      const formData = new FormData()
      formData.append('pdf', file)
      try {
        const response = await axios.post(
          'http://localhost:3001/count-pages',
          formData
        )
        setPageCount(response.data.pageCount)
        setTotalPrice(response.data.totalPrice)
        toast.success(
          `Documento carregado com sucesso! ${response.data.pageCount} páginas - Total: R$ ${response.data.totalPrice.toFixed(2)}`,
          {
            theme: 'dark'
          }
        )
      } catch (error) {
        toast.error('Erro ao processar o documento', { theme: 'dark' })
        setSelectedFile(null)
      }
    } else {
      toast.error('Por favor, selecione um arquivo PDF', { theme: 'dark' })
      setSelectedFile(null)
    }
  }

  const checkPaymentStatus = async (paymentId) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/payment-status/${paymentId}`
      )
      return response.data.status
    } catch (error) {
      return null
    }
  }

  const startPaymentMonitoring = async (paymentId) => {
    setCheckingPayment(true)
    const interval = setInterval(async () => {
      const status = await checkPaymentStatus(paymentId)
      setPaymentStatus(status)
      if (status === 'approved') {
        clearInterval(interval)
        setCheckingPayment(false)
        setPixQRCode(null)
        setShowSuccess(true)
      }
    }, 3000)
  }

  const handleCreatePayment = async () => {
    if (!selectedFile || !selectedPrinter) {
      toast.warn('Selecione um arquivo e uma impressora', { theme: 'dark' })
      return
    }
    try {
      const response = await axios.post('http://localhost:3001/create-payment', {
        pageCount: pageCount,
      })
      setPaymentData(response.data)
      if (response.data.qr_code) {
        setPixQRCode(response.data)
        startPaymentMonitoring(response.data.id)
      } else {
        toast.error('Erro ao gerar QR Code Pix', { theme: 'dark' })
      }
    } catch (error) {
      toast.error('Erro ao criar pagamento', { theme: 'dark' })
    }
  }

  const handlePrintAfterPayment = async (paymentId) => {
    const formData = new FormData()
    formData.append('pdf', selectedFile)
    formData.append('printer', selectedPrinter)
    formData.append('paymentId', paymentId)
    try {
      const response = await axios.post('http://localhost:3001/print', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Documento enviado para impressão!', { theme: 'dark' })
      resetForm()
    } catch (error) {
      toast.error('Erro ao imprimir', { theme: 'dark' })
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPaymentData(null)
    setPixQRCode(null)
    setPaymentStatus(null)
    setPageCount(0)
    setTotalPrice(0)
    document.getElementById('fileInput').value = ''
  }

  const handleSuccessComplete = () => {
    setShowSuccess(false)
    handlePrintAfterPayment(paymentData.id)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="container mx-auto p-6">
        <AnimatePresence>
          {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}
          {pixQRCode && (
            <QRCodeModal
              qrCode={pixQRCode}
              onClose={() => setPixQRCode(null)}
              onCopyCode={() => {
                navigator.clipboard.writeText(pixQRCode.qr_code)
                toast.success('Código Pix copiado!', { theme: 'dark' })
              }}
              paymentStatus={paymentStatus}
            />
          )}
        </AnimatePresence>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 shadow-xl rounded-xl p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Sistema de Impressão</h2>
              <div className="flex items-center text-blue-400">
                <DollarSign size={20} className="mr-2" />
                <span>R$ {pricePerPage.toFixed(2)} /página</span>
              </div>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-colors duration-300 ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="fileInput"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="fileInput"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload
                  size={40}
                  className={`mb-4 ${
                    dragActive ? 'text-blue-400' : 'text-gray-400'
                  }`}
                />
                <span className="text-lg text-gray-300 mb-2">
                  {selectedFile
                    ? selectedFile.name
                    : 'Arraste seu arquivo PDF ou clique para selecionar'}
                </span>
                <span className="text-sm text-gray-500">
                  Apenas arquivos PDF são aceitos
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Printer size={20} className="absolute left-3 top-3 text-gray-400" />
                <select
                  id="printerSelect"
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                >
                  <option value="">Selecione uma impressora</option>
                  {printers.map((printer, index) => (
                    <option key={index} value={printer.name}>
                      {printer.displayName || printer.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFile && pageCount > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-center mb-4">
                    <FileText size={24} className="text-blue-400 mr-3" />
                    <h3 className="text-lg font-medium text-white">
                      Informações do documento
                    </h3>
                  </div>
                  <div className="space-y-2 text-gray-300">
                    <p>Número de páginas: {pageCount}</p>
                    <p className="text-lg font-semibold text-white">
                      Valor total: R$ {totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {!pixQRCode && (
                <button
                  onClick={handleCreatePayment}
                  disabled={!selectedFile || !selectedPrinter}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 
                    hover:bg-blue-600 focus:ring-4 focus:ring-blue-500/50 disabled:bg-gray-600 disabled:cursor-not-allowed
                    disabled:hover:bg-gray-600 flex items-center justify-center space-x-2"
                >
                  <DollarSign size={20} />
                  <span>Gerar QR Code Pix</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}