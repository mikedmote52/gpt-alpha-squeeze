import React, { useState, useEffect } from 'react';
import { useAlpaca } from '../hooks/useAlpaca';
import PortfolioHealthDashboard from './PortfolioHealthDashboard';
import HoldingsGrid from './HoldingsGrid';
import EnhancedChatInterface from './EnhancedChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  RefreshCw, 
  TrendingUp, 
  Activity, 
  Brain,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface MarketConditions {
  vix: number;
  spyChange: number;
  marketSentiment: string;
  timestamp: Date;
}

interface TradingDashboardState {
  portfolioData: any;
  marketConditions: MarketConditions | null;
  isLoading: boolean;
  lastRefresh: Date;
  alerts: string[];
}

export default function EnhancedTradingDashboard() {
  const { positions, loading: alpacaLoading, error: alpacaError, fetchPositions, createOrder } = useAlpaca();
  const [state, setState] = useState<TradingDashboardState>({
    portfolioData: null,
    marketConditions: null,
    isLoading: true,
    lastRefresh: new Date(),
    alerts: []
  });

  useEffect(() => {
    initializeDashboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const initializeDashboard = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await fetchPositions();
      await refreshPortfolioData();
      await fetchMarketConditions();
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false, lastRefresh: new Date() }));
    }
  };

  const refreshData = async () => {
    try {
      await fetchPositions();
      await refreshPortfolioData();
      await fetchMarketConditions();
      setState(prev => ({ ...prev, lastRefresh: new Date() }));
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const refreshPortfolioData = async () => {
    if (!positions || positions.length === 0) return;

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
        setState(prev => ({
          ...prev,
          portfolioData: {
            positions,
            candidates: data.candidates || [],
            totalValue: positions.reduce((sum, pos) => sum + parseFloat(pos.market_value || 0), 0),
            totalPnL: positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl || 0), 0),
            learningStatus: data.learning_status || {}
          }
        }));
      }
    } catch (error) {
      console.error('Failed to refresh portfolio data:', error);
    }
  };

  const fetchMarketConditions = async () => {
    try {
      // Simulate market conditions - in real implementation, fetch from market data API
      const conditions: MarketConditions = {
        vix: 18.5 + Math.random() * 10,
        spyChange: (Math.random() - 0.5) * 4,
        marketSentiment: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
        timestamp: new Date()
      };
      
      setState(prev => ({ ...prev, marketConditions: conditions }));
    } catch (error) {
      console.error('Failed to fetch market conditions:', error);
    }
  };

  const handleTradeAction = async (action: string, symbol: string, quantity?: number) => {
    try {
      const position = positions.find(p => p.symbol === symbol);
      const tradeQuantity = quantity || Math.floor(parseFloat(position?.qty || '1') * 0.1);
      
      let orderSide: 'buy' | 'sell' = 'buy';
      let orderQty = tradeQuantity;

      switch (action) {
        case 'SELL':
          orderSide = 'sell';
          orderQty = Math.min(tradeQuantity, parseFloat(position?.qty || '0'));
          break;
        case 'ADD':
          orderSide = 'buy';
          orderQty = tradeQuantity;
          break;
        case 'BUY':
          orderSide = 'buy';
          orderQty = quantity || 10;
          break;
        default:
          return false;
      }

      if (orderQty <= 0) return false;

      const order = await createOrder({
        symbol,
        qty: orderQty,
        side: orderSide,
        type: 'market',
        time_in_force: 'day'
      });

      if (order) {
        setState(prev => ({
          ...prev,
          alerts: [...prev.alerts, `${action} order executed for ${symbol}: ${orderQty} shares`]
        }));
        
        // Refresh portfolio after trade
        setTimeout(() => {
          refreshData();
        }, 1000);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Trade execution failed:', error);
      return false;
    }
  };

  const handleChatTradeExecute = async (action: any) => {
    return await handleTradeAction(action.action, action.symbol, action.quantity);
  };

  const dismissAlert = (index: number) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter((_, i) => i !== index)
    }));
  };

  const getMarketSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return 'text-green-600';
      case 'Bearish': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading trading dashboard...</span>
        </div>
      </div>
    );
  }

  if (alpacaError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{alpacaError}</p>
          <Button onClick={initializeDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trading Command Center</h1>
            <p className="text-gray-600 mt-1">Real-time portfolio analysis with AI-powered trading assistance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Last updated: {state.lastRefresh.toLocaleTimeString()}
            </div>
            <Button onClick={refreshData} disabled={state.isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {state.alerts.length > 0 && (
          <div className="space-y-2">
            {state.alerts.map((alert, index) => (
              <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">{alert}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => dismissAlert(index)}>
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Market Conditions Bar */}
        {state.marketConditions && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Market Conditions</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xs text-gray-500">VIX</span>
                      <div className="font-medium">{state.marketConditions.vix.toFixed(1)}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">SPY</span>
                      <div className={`font-medium ${state.marketConditions.spyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {state.marketConditions.spyChange >= 0 ? '+' : ''}{state.marketConditions.spyChange.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Sentiment</span>
                      <div className={`font-medium ${getMarketSentimentColor(state.marketConditions.marketSentiment)}`}>
                        {state.marketConditions.marketSentiment}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">
                  Live Data
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Health Dashboard */}
        {state.portfolioData && (
          <PortfolioHealthDashboard
            positions={state.portfolioData.positions}
            candidates={state.portfolioData.candidates}
            learningStatus={state.portfolioData.learningStatus}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Holdings Grid */}
          <div className="space-y-6">
            <HoldingsGrid
              positions={positions}
              candidates={state.portfolioData?.candidates || []}
              onTradeAction={handleTradeAction}
            />
          </div>

          {/* Enhanced Chat Interface */}
          <div className="space-y-6">
            <EnhancedChatInterface
              onTradeExecute={handleChatTradeExecute}
              portfolioData={state.portfolioData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}