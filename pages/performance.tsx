import { useState } from 'react';
import PerformanceDashboard from '../components/PerformanceDashboard';

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Performance Validation System
        </h1>
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('methodology')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'methodology'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Methodology
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'dashboard' && <PerformanceDashboard />}
        
        {activeTab === 'methodology' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Performance Validation Methodology</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">📊 Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Return Metrics</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Daily, weekly, monthly returns</li>
                      <li>• Annualized return calculation</li>
                      <li>• Excess return vs 63.8% baseline</li>
                      <li>• Cumulative performance tracking</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Risk Metrics</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Sharpe ratio (risk-adjusted return)</li>
                      <li>• Maximum drawdown</li>
                      <li>• Value at Risk (95%, 99%)</li>
                      <li>• Beta vs baseline</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">🔬 Statistical Testing</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Null Hypothesis:</strong> The trading system does not generate statistically significant alpha 
                    (excess returns equal zero).
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Alternative Hypothesis:</strong> The trading system generates statistically significant positive alpha.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Test:</strong> One-sample t-test on daily excess returns with significance levels at 1%, 5%, and 10%.
                    Requires minimum 30 observations for valid results.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">🎯 Baseline Comparison</h3>
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>63.8% Monthly Return Baseline:</strong> The system is evaluated against this ambitious 
                    benchmark to prove measurable alpha generation beyond sophisticated analysis.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">⚠️ Alert System</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Critical Alerts</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Daily loss > 10%</li>
                      <li>• Max drawdown > 20%</li>
                      <li>• Portfolio value drop > 15%</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-600">Performance Alerts</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Sharpe ratio < 0.5</li>
                      <li>• Negative excess returns</li>
                      <li>• High volatility > 40%</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">📈 Data Sources</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• <strong>Portfolio Data:</strong> Real-time Alpaca API integration</li>
                    <li>• <strong>Trade Execution:</strong> Automated logging of all buy/sell orders</li>
                    <li>• <strong>Market Data:</strong> Yahoo Finance and Alpaca market data</li>
                    <li>• <strong>Performance Storage:</strong> SQLite database with comprehensive metrics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}