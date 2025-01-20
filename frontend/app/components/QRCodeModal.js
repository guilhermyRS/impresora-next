import { motion } from 'framer-motion'
import { X, Copy, QrCode } from 'lucide-react'

const QRCodeModal = ({ qrCode, onClose, onCopyCode, paymentStatus }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 relative border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <QrCode size={24} className="text-blue-400" />
            <h3 className="text-2xl font-bold text-white">Pagamento via Pix</h3>
          </div>

          <div className="bg-white p-4 rounded-xl mb-6">
            {qrCode.qr_code_base64 ? (
              <img
                src={`data:image/png;base64,${qrCode.qr_code_base64}`}
                alt="QR Code Pix"
                className="mx-auto w-64 h-64"
              />
            ) : (
              <p className="text-red-500">Erro ao carregar QR Code</p>
            )}
          </div>

          <p className="text-gray-300 mb-6">
            Escaneie o QR Code com o aplicativo do seu banco
          </p>

          <div className="space-y-3">
            <button
              onClick={onCopyCode}
              className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Copy size={20} />
              <span>Copiar Código Pix</span>
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-700 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fechar
            </button>
          </div>

          {paymentStatus && (
            <div className={`mt-6 p-4 rounded-lg ${
              paymentStatus === 'approved' 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              <p className="font-medium">
                Status: {paymentStatus === 'approved' ? 'Aprovado' : 'Aguardando pagamento'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default QRCodeModal