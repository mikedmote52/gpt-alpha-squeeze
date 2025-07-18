import Head from 'next/head';
import Link from 'next/link';
import ChatWidget from '../components/ChatWidget';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Squeeze Alpha - AI Trading Assistant</title>
        <meta name="description" content="Real-time AI-powered trading dashboard with portfolio analysis and intelligent recommendations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Squeeze Alpha
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            AI-powered trading assistant with real-time portfolio analysis
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/portfolio"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 View Portfolio
            </Link>
            <Link
              href="/enhanced"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              🚀 Enhanced Dashboard
            </Link>
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">🧠 AI Trading Assistant</h2>
            <p className="text-gray-600 mb-4">
              Chat with Squeeze Alpha to get real-time portfolio analysis, trading recommendations, and market insights based on your actual holdings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">💼</div>
                <div className="font-semibold text-blue-900">Real Portfolio Data</div>
                <div className="text-sm text-blue-700">Live Alpaca integration</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-semibold text-green-900">Squeeze Analysis</div>
                <div className="text-sm text-green-700">AI-powered scoring</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">🧠</div>
                <div className="font-semibold text-purple-900">Learning System</div>
                <div className="text-sm text-purple-700">Improves over time</div>
              </div>
            </div>
          </div>
          
          <ChatWidget />
        </div>
      </main>
    </div>
  );
}
