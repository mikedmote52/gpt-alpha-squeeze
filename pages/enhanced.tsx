import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAlpaca } from '../hooks/useAlpaca';

interface DashboardMetrics {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: any[];
  candidates: any[];
}

export default function EnhancedDashboard() {
  const { positions, loading, error, fetchPositions } = useAlpaca();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalValue: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    positions: [],
    candidates: []
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchPositions();
    fetchPortfolioAnalysis();
  }, []);

  useEffect(() => {
    if (positions && positions.length > 0) {
      calculateMetrics();
    }
  }, [positions]);

  const calculateMetrics = () => {
    const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.market_value || '0'), 0);
    const totalPnL = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl || '0'), 0);
    const totalPnLPercent = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    setMetrics(prev => ({
      ...prev,
      totalValue,
      totalPnL,
      totalPnLPercent,
      positions
    }));
  };

  const fetchPortfolioAnalysis = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'What is my current portfolio analysis?' }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(prev => ({
          ...prev,
          candidates: data.candidates || []
        }));
      }
    } catch (error) {
      console.error('Failed to fetch portfolio analysis:', error);
    }
  };

  const refreshData = async () => {
    await fetchPositions();
    await fetchPortfolioAnalysis();
    setLastUpdate(new Date());
  };

  const getSqueezeScore = (symbol: string) => {
    const candidate = metrics.candidates.find(c => c.symbol === symbol);
    return candidate?.enhanced_score || 0;
  };

  const getSqueezeColor = (score: number) => {
    if (score >= 75) return 'bg-red-500 text-white';
    if (score >= 50) return 'bg-yellow-500 text-white';
    if (score >= 25) return 'bg-blue-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Connection Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Enhanced Trading Dashboard - Squeeze Alpha</title>
        <meta name="description" content="Real-time trading dashboard with portfolio analysis" />
      </Head>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎯 Trading Command Center</h1>
            <p className="text-gray-600">Real-time portfolio analysis with AI-powered insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={refreshData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Portfolio Value</h3>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.totalValue)}</p>
              </div>
              <div className="text-4xl">💼</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total P&L</h3>
                <p className={`text-3xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.totalPnL)}
                </p>
                <p className={`text-sm ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(metrics.totalPnLPercent)}
                </p>
              </div>
              <div className="text-4xl">
                {metrics.totalPnL >= 0 ? '📈' : '📉'}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Positions</h3>
                <p className="text-3xl font-bold text-gray-900">{positions.length}</p>
                <p className="text-sm text-gray-500">Active holdings</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>
        </div>

        {/* Holdings Grid */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Current Holdings</h2>
          </div>
          <div className="p-6">
            {positions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No positions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => {
                  const squeezeScore = getSqueezeScore(position.symbol);
                  const pnlPercent = parseFloat(position.unrealized_plpc || '0') * 100;
                  const pnlAmount = parseFloat(position.unrealized_pl || '0');
                  const marketValue = parseFloat(position.market_value || '0');
                  const quantity = parseFloat(position.qty || '0');
                  const avgPrice = parseFloat((position as any).avg_entry_price || '0');
                  const currentPrice = parseFloat((position as any).current_price || '0');
                  const candidate = metrics.candidates.find(c => c.symbol === position.symbol);

                  return (
                    <div key={position.symbol} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-xl">{position.symbol}</div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getSqueezeColor(squeezeScore)}`}>
                            🔥 {squeezeScore}/100
                          </div>
                        </div>
                        <div className={`text-lg font-semibold ${pnlAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(pnlAmount)} ({formatPercent(pnlPercent)})
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Position</div>
                          <div className="font-medium">{quantity.toFixed(2)} shares</div>
                          <div className="text-xs text-gray-400">@ {formatCurrency(avgPrice)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Current Value</div>
                          <div className="font-medium">{formatCurrency(marketValue)}</div>
                          <div className="text-xs text-gray-400">@ {formatCurrency(currentPrice)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Volume</div>
                          <div className="font-medium">{candidate?.volume?.toLocaleString() || 'N/A'}</div>
                          <div className={`text-xs ${candidate?.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {candidate?.changePercent ? formatPercent(candidate.changePercent) : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">AI Score</div>
                          <div className="font-medium">{squeezeScore}/100</div>
                          <div className="text-xs text-gray-400">
                            {squeezeScore >= 75 ? 'HIGH' : squeezeScore >= 50 ? 'MEDIUM' : 'LOW'}
                          </div>
                        </div>
                      </div>

                      {candidate?.ai_reasoning && (
                        <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <div className="text-sm">
                            <strong className="text-blue-900">AI Analysis:</strong>
                            <span className="text-blue-700 ml-2">{candidate.ai_reasoning}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Market Summary */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Market Analysis</h2>
          </div>
          <div className="p-6">
            {metrics.candidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading market analysis...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.candidates.map((candidate) => (
                  <div key={candidate.symbol} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold">{candidate.symbol}</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getSqueezeColor(candidate.enhanced_score)}`}>
                        {candidate.enhanced_score}/100
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium">{formatCurrency(candidate.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Change:</span>
                        <span className={`font-medium ${candidate.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(candidate.changePercent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Volume:</span>
                        <span className="font-medium">{candidate.volume?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}