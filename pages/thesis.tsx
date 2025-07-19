import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ThesisManager from '../components/ThesisManager';

export default function ThesisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Head>
        <title>Thesis Management - Squeeze Alpha</title>
        <meta name="description" content="AI Trading Thesis Management and Strategy Documentation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
              ← Back to Dashboard
            </Link>
            <div className="flex gap-2">
              <Link href="/portfolio-v2" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                📊 Portfolio
              </Link>
              <Link href="/enhanced" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                🚀 Enhanced View
              </Link>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📋 Thesis Management
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            AI Trading Strategy Documentation & Learning System
          </p>
          <p className="text-sm text-gray-500">
            Track stock theses, system strategies, and performance over time
          </p>
        </header>

        {/* Thesis Manager Component */}
        <ThesisManager />

        {/* System Information */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🤖 How the Thesis System Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📈 Stock Theses</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Auto-created when you execute trades</li>
                <li>• Updated with real-time market data</li>
                <li>• Track performance vs. original thesis</li>
                <li>• AI generates entry/exit strategies</li>
                <li>• Monitor squeeze scores and metrics</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🧠 System Strategies</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Document overall trading approaches</li>
                <li>• Track strategy performance over time</li>
                <li>• Learn from successful patterns</li>
                <li>• Adapt based on market conditions</li>
                <li>• Maintain consistent risk management</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <div className="font-medium text-blue-900 mb-1">Learning System Active</div>
                <div className="text-sm text-blue-700">
                  The AI continuously learns from your trades, updates theses with real market data, 
                  and evolves strategies based on performance. All data is real-time with zero fake information.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}