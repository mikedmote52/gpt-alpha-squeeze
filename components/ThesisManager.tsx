import React, { useState, useEffect } from 'react';

interface StockThesis {
  symbol: string;
  currentThesis: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  thesisText: string;
  entryReason: string;
  exitStrategy: string;
  keyMetrics: {
    entryPrice?: number;
    currentPrice: number;
    targetPrice: number;
    stopLoss: number;
    squeezeScore: number;
    shortInterest: number;
    daysHeld?: number;
  };
  lastUpdated: string;
  performanceVsThesis: 'ON_TRACK' | 'UNDERPERFORMING' | 'OUTPERFORMING';
  aiGenerated: boolean;
}

interface SystemThesis {
  id: string;
  strategy: string;
  description: string;
  active: boolean;
  createdAt: string;
  performance: {
    totalTrades: number;
    successfulTrades: number;
    totalReturn: number;
    winRate: number;
  };
}

export default function ThesisManager() {
  const [stockTheses, setStockTheses] = useState<StockThesis[]>([]);
  const [systemTheses, setSystemTheses] = useState<SystemThesis[]>([]);
  const [selectedTab, setSelectedTab] = useState<'stock' | 'system'>('stock');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheses();
  }, []);

  const fetchTheses = async () => {
    try {
      setLoading(true);
      
      // Fetch stock theses
      const stockResponse = await fetch('/api/thesis/stocks');
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        setStockTheses(stockData.theses || []);
      }

      // Fetch system theses  
      const systemResponse = await fetch('/api/thesis/system');
      if (systemResponse.ok) {
        const systemData = await systemResponse.json();
        setSystemTheses(systemData.theses || []);
      }
    } catch (error) {
      console.error('Error fetching theses:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStockThesis = async (symbol: string, updates: Partial<StockThesis>) => {
    try {
      const response = await fetch('/api/thesis/stocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, updates })
      });

      if (response.ok) {
        fetchTheses(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating thesis:', error);
    }
  };

  const createSystemThesis = async (thesis: Omit<SystemThesis, 'id' | 'createdAt' | 'performance'>) => {
    try {
      const response = await fetch('/api/thesis/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thesis)
      });

      if (response.ok) {
        fetchTheses(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating system thesis:', error);
    }
  };

  const getThesisStatusColor = (performance: string) => {
    switch (performance) {
      case 'OUTPERFORMING': return 'text-green-600 bg-green-100';
      case 'ON_TRACK': return 'text-blue-600 bg-blue-100';
      case 'UNDERPERFORMING': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getThesisIcon = (thesis: string) => {
    switch (thesis) {
      case 'BULLISH': return '🚀';
      case 'BEARISH': return '📉';
      case 'NEUTRAL': return '⚖️';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">📋 Thesis Management</h2>
        <button
          onClick={fetchTheses}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setSelectedTab('stock')}
          className={`px-4 py-2 font-medium ${
            selectedTab === 'stock'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📈 Stock Theses ({stockTheses.length})
        </button>
        <button
          onClick={() => setSelectedTab('system')}
          className={`px-4 py-2 font-medium ${
            selectedTab === 'system'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🧠 System Strategies ({systemTheses.length})
        </button>
      </div>

      {selectedTab === 'stock' && (
        <div className="space-y-4">
          {stockTheses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No stock theses found. Execute some trades to generate theses.
            </div>
          ) : (
            stockTheses.map((thesis) => (
              <div key={thesis.symbol} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getThesisIcon(thesis.currentThesis)}</span>
                    <div>
                      <h3 className="font-bold text-lg">{thesis.symbol}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getThesisStatusColor(thesis.performanceVsThesis)}`}>
                        {thesis.performanceVsThesis.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {thesis.keyMetrics.squeezeScore}/100
                    </div>
                    <div className="text-sm text-gray-500">Squeeze Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Current Thesis</div>
                    <div className="text-sm text-gray-900">{thesis.thesisText}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Key Metrics</div>
                    <div className="text-sm space-y-1">
                      <div>Price: ${thesis.keyMetrics.currentPrice}</div>
                      <div>Target: ${thesis.keyMetrics.targetPrice}</div>
                      <div>Stop: ${thesis.keyMetrics.stopLoss}</div>
                      <div>Short Interest: {thesis.keyMetrics.shortInterest}%</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Entry Reason:</div>
                    <div className="text-gray-600">{thesis.entryReason}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Exit Strategy:</div>
                    <div className="text-gray-600">{thesis.exitStrategy}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(thesis.lastUpdated).toLocaleString()}
                    {thesis.aiGenerated && <span className="ml-2 px-1 bg-blue-100 text-blue-800 rounded">AI Generated</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'system' && (
        <div className="space-y-4">
          {systemTheses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No system strategies found. The AI will create strategies as it learns.
            </div>
          ) : (
            systemTheses.map((thesis) => (
              <div key={thesis.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {thesis.active ? '🟢' : '🔴'} {thesis.strategy}
                    </h3>
                    <div className="text-sm text-gray-600">{thesis.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {(thesis.performance.winRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Win Rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Total Trades</div>
                    <div className="text-lg font-semibold">{thesis.performance.totalTrades}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Successful</div>
                    <div className="text-lg font-semibold text-green-600">{thesis.performance.successfulTrades}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Total Return</div>
                    <div className={`text-lg font-semibold ${thesis.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {thesis.performance.totalReturn >= 0 ? '+' : ''}{(thesis.performance.totalReturn * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Status</div>
                    <div className={`text-lg font-semibold ${thesis.active ? 'text-green-600' : 'text-gray-500'}`}>
                      {thesis.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  Created: {new Date(thesis.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}