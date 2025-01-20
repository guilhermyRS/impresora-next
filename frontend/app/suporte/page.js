export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Suporte</h1>
      <p className="text-gray-600 text-lg mb-6 text-center max-w-2xl">
        Se você precisar de ajuda, entre em contato conosco através do formulário abaixo ou envie um e-mail para suporte@exemplo.com.
      </p>
      <form className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg">
        <label className="block mb-2 text-gray-700 font-medium">Nome</label>
        <input type="text" className="w-full p-2 border rounded-lg mb-4" placeholder="Seu nome" />
        
        <label className="block mb-2 text-gray-700 font-medium">E-mail</label>
        <input type="email" className="w-full p-2 border rounded-lg mb-4" placeholder="seuemail@exemplo.com" />
        
        <label className="block mb-2 text-gray-700 font-medium">Mensagem</label>
        <textarea className="w-full p-2 border rounded-lg mb-4" rows="4" placeholder="Escreva sua mensagem"></textarea>
        
        <button type="submit" className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg w-full hover:bg-blue-600">Enviar</button>
      </form>
    </div>
  );
}
