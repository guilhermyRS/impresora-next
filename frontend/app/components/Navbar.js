import Link from 'next/link'
import { Home, History, LifeBuoy } from 'lucide-react'

const Navbar = () => {
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/logo-icodenew-nav-white.png" 
              alt="Logo" 
              className="h-8 w-auto" 
            />
            <span className="text-white font-bold text-xl">PrintPix</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              <Home size={18} />
              <span>Início</span>
            </Link>
            <Link 
              href="/historico" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              <History size={18} />
              <span>Histórico</span>
            </Link>
            <Link 
              href="/suporte" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              <LifeBuoy size={18} />
              <span>Suporte</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar