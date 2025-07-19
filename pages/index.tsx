import Head from 'next/head';
import Link from 'next/link';
import ChatWidget from '../components/ChatWidget';
import AIIntelligenceStatus from '../components/AIIntelligenceStatus';
import PortfolioHealthCard from '../components/PortfolioHealthCard';
import TopAIRecommendation from '../components/TopAIRecommendation';
import PatternInsightCard from '../components/PatternInsightCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Squeeze Alpha - AI Command Center</title>
        <meta name="description" content="AI-powered trading command center with real-time learning intelligence and portfolio optimization" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧠 Squeeze Alpha AI
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Artificial Intelligence Command Center
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/portfolio-v2"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center gap-1"
            >
              📊 Full Portfolio
            </Link>
            <Link
              href="/enhanced"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium inline-flex items-center gap-1"
            >
              🚀 Enhanced Dashboard
            </Link>
            <Link
              href="/performance"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium inline-flex items-center gap-1"
            >
              📈 Performance
            </Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {/* AI Intelligence Grid - Mobile First */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* AI Intelligence Status */}
            <div className="lg:col-span-2">
              <AIIntelligenceStatus />
            </div>
            
            {/* Portfolio Health */}
            <PortfolioHealthCard />
            
            {/* Top AI Recommendation */}
            <TopAIRecommendation />
            
            {/* Pattern Insights */}
            <div className="lg:col-span-2">
              <PatternInsightCard />
            </div>
          </div>

          {/* Chat Interface - Secondary but still accessible */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">💬</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Trading Assistant</h2>
                  <p className="text-sm text-gray-600">
                    Chat with the AI for detailed analysis and custom recommendations
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-medium text-blue-900 text-sm">Real Portfolio Data</div>
                  <div className="text-xs text-blue-700">Live Alpaca integration</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-medium text-green-900 text-sm">Squeeze Analysis</div>
                  <div className="text-xs text-green-700">AI-powered scoring</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="text-2xl mb-2">🧠</div>
                  <div className="font-medium text-purple-900 text-sm">Learning System</div>
                  <div className="text-xs text-purple-700">Evolves with outcomes</div>
                </div>
              </div>
            </div>
            
            <ChatWidget />
          </div>
        </div>
      </main>
    </div>
  );
}
