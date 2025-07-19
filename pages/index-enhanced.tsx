// Enhanced Landing Page with Portfolio Quick View
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ChatWidget from '../components/ChatWidget';
import { usePortfolio } from '../context/PortfolioContext';
import { PortfolioHealth, AIRecommendation } from '../types/recommendations';

export default function EnhancedHome() {
  const { } = usePortfolio();
  const holdings: any[] = [];
  const totalValue = 0;
  const [portfolioHealth, setPortfolioHealth] = useState<PortfolioHealth | null>(null);
  const [activeRecommendations, setActiveRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickInsights();
  }, []);

  const fetchQuickInsights = async () => {
    try {
      const response = await fetch('/api/recommendations');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPortfolioHealth(data.portfolioHealth);
          setActiveRecommendations(data.recommendations.filter((r: AIRecommendation) => r.status === 'ACTIVE'));
        }
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthEmoji = (score: number) => {
    if (score >= 80) return '🎯';
    if (score >= 60) return '⚡';
    return '⚠️';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Head>
        <title>Squeeze Alpha - AI-Powered Trading Intelligence</title>
        <meta name="description" content="Real-time AI-powered trading dashboard with portfolio analysis and intelligent recommendations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎯 Squeeze Alpha
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            AI-Powered Trading Intelligence
          </p>
          <p className="text-sm text-gray-500">
            Pattern Recognition • Real-Time Analysis • Learning System Active
          </p>
        </header>

        {/* Quick Portfolio Overview */}
        {!loading && portfolioHealth && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Portfolio Health Score */}
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Portfolio Health</div>
                <div className={`text-4xl font-bold ${getHealthColor(portfolioHealth.overallScore)}`}>
                  {getHealthEmoji(portfolioHealth.overallScore)} {portfolioHealth.overallScore}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {portfolioHealth.overallScore >= 80 ? 'Excellent' :
                   portfolioHealth.overallScore >= 60 ? 'Good' : 'Needs Attention'}
                </div>
              </div>

              {/* Portfolio Value */}
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Total Value</div>
                <div className="text-4xl font-bold text-gray-900">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {holdings.length} positions
                </div>
              </div>

              {/* Projected Return */}
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Projected Return</div>
                <div className={`text-4xl font-bold ${portfolioHealth.projectedReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioHealth.projectedReturn > 0 ? '+' : ''}{(portfolioHealth.projectedReturn * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {portfolioHealth.projectedTimeframe}
                </div>
              </div>

              {/* Active Recommendations */}
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Active Recommendations</div>
                <div className="text-4xl font-bold text-blue-600">
                  {activeRecommendations.length}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {activeRecommendations.filter(r => r.action === 'BUY').length} buy, 
                  {' '}{activeRecommendations.filter(r => r.action === 'SELL').length} sell
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t flex justify-center space-x-4">
              <Link
                href="/portfolio-v2"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📊 View Full Analysis
              </Link>
              <Link
                href="/enhanced"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                🚀 Enhanced Dashboard
              </Link>
              <Link
                href="/portfolio"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                💼 Classic Portfolio
              </Link>
            </div>
          </div>
        )}

        {/* Top Recommendations Preview */}
        {!loading && activeRecommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🎯 Top AI Recommendations
            </h2>
            <div className="space-y-3">
              {activeRecommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${
                      rec.action === 'BUY' ? 'bg-green-500' : 
                      rec.action === 'SELL' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                      {rec.action}
                    </span>
                    <span className="font-bold text-gray-900">{rec.symbol}</span>
                    <span className="text-sm text-gray-600">{rec.confidence}% confidence</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {rec.expectedReturn > 0 ? '+' : ''}{(rec.expectedReturn * 100).toFixed(1)}% expected
                    </div>
                    <div className="text-xs text-gray-500">{rec.timeframe}</div>
                  </div>
                </div>
              ))}
            </div>
            {activeRecommendations.length > 3 && (
              <Link href="/portfolio-v2" className="block text-center text-blue-600 hover:text-blue-700 mt-3 text-sm font-medium">
                View all {activeRecommendations.length} recommendations →
              </Link>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Learning System</h3>
            <p className="text-sm text-gray-600">
              AI learns from every trade, building pattern recognition that improves over time
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Real-Time Analysis</h3>
            <p className="text-sm text-gray-600">
              Live portfolio monitoring with squeeze scoring and market condition tracking
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Actionable Insights</h3>
            <p className="text-sm text-gray-600">
              Specific buy/sell recommendations with confidence scores and position sizing
            </p>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            💬 AI Trading Assistant
          </h2>
          <p className="text-gray-600 mb-4">
            Chat with Squeeze Alpha to get personalized analysis and recommendations based on learned patterns
          </p>
          <ChatWidget />
        </div>

        {/* Learning Status Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            🔄 Learning System Active • 
            📈 Pattern Recognition Online • 
            🎯 {activeRecommendations.length} Active Recommendations
          </p>
        </div>
      </main>
    </div>
  );
}