// app/page.tsx
export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent mb-4">
          The Current
        </h1>
        <p className="text-gray-400 mb-8">by She Is AI</p>
        <div className="space-x-4">
          <a 
            href="/landing" 
            className="bg-gradient-to-r from-pink-500 to-blue-500 px-6 py-3 rounded-lg text-white font-medium"
          >
            Explore The Current
          </a>
          <a 
            href="/admin/setup" 
            className="border border-gray-600 px-6 py-3 rounded-lg text-gray-300 font-medium"
          >
            Admin Setup
          </a>
        </div>
      </div>
    </div>
  )
}