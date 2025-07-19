// Enhanced Portfolio Page with AI Intelligence Surfacing
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Holdings from '../components/Holdings';
import AIRecommendationCard from '../components/AIRecommendationCard';
import PortfolioHealthDashboard from '../components/PortfolioHealthDashboard';
import StockThesisCard from '../components/StockThesisCard';
import OrderConfirmationDialog from '../components/OrderConfirmationDialog';
import OrderStatusNotification from '../components/OrderStatusNotification';
import OrderStatusTable from '../components/OrderStatusTable';
import PortfolioOptimizationModal from '../components/PortfolioOptimizationModal';
import { useAlpaca } from '../hooks/useAlpaca';
import { AIRecommendation, StockThesis, PortfolioHealth } from '../types/recommendations';

export default function EnhancedPortfolio() {
  const { positions, loading: positionsLoading, error: positionsError, fetchPositions } = useAlpaca();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [portfolioHealth, setPortfolioHealth] = useState<PortfolioHealth | null>(null);
  const [stockTheses, setStockTheses] = useState<StockThesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Execution state
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  
  // Portfolio optimization state
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  // Fetch AI recommendations and portfolio health
  useEffect(() => {
    fetchPositions();
    fetchRecommendations();
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const response = await fetch('/api/alpaca/account');
      if (response.ok) {
        const accountData = await response.json();
        setAccount(accountData);
        console.log('Account data fetched:', { 
          buying_power: accountData.buying_power, 
          portfolio_value: accountData.portfolio_value 
        });
      }
    } catch (error) {
      console.error('Error fetching account:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      // Add cache-busting timestamp  
      const timestamp = Date.now();
      const response = await fetch(`/api/recommendations?t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Portfolio-v2 portfolio health:', data.portfolioHealth?.overallScore);
        setRecommendations(data.recommendations);
        setPortfolioHealth(data.portfolioHealth);
        setStockTheses(data.stockTheses);
      } else {
        setError(data.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRecommendation = async (recommendation: AIRecommendation) => {
    setSelectedRecommendation(recommendation);
    setShowOrderDialog(true);
  };

  const handleConfirmOrder = async (orderDetailsInput: any) => {
    if (!selectedRecommendation) return;
    
    setShowOrderDialog(false);
    setNotificationStatus('pending');
    setNotificationMessage('Executing trade...');
    setShowNotification(true);
    
    try {
      const response = await fetch('/api/execute-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderDetailsInput,
          recommendationId: selectedRecommendation.id,
          confidence: selectedRecommendation.confidence,
          expectedReturn: selectedRecommendation.expectedReturn,
          reasoning: selectedRecommendation.reasoning
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNotificationStatus('success');
        setNotificationMessage(result.message);
        setOrderDetails(result.orderDetails);
        
        // Refresh positions and recommendations
        fetchPositions();
        fetchRecommendations();
        
        // Remove executed recommendation from list
        setRecommendations(prev => prev.filter(r => r.id !== selectedRecommendation.id));
      } else {
        setNotificationStatus('error');
        setNotificationMessage(result.message || 'Trade execution failed');
      }
    } catch (error) {
      setNotificationStatus('error');
      setNotificationMessage('Network error - please try again');
      console.error('Trade execution error:', error);
    }
  };

  const handleDismissRecommendation = (recommendationId: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
  };

  const handleStockAction = (symbol: string, action: 'BUY' | 'SELL' | 'HOLD') => {
    if (action === 'HOLD') {
      alert(`Holding ${symbol} - no action needed`);
      return;
    }

    // Create a recommendation-like object for the stock action
    const stockThesis = stockTheses.find(t => t.symbol === symbol);
    const position = positions?.find(p => p.symbol === symbol);
    
    if (!stockThesis) {
      alert(`No thesis found for ${symbol}`);
      return;
    }

    // Calculate intelligent position sizing based on portfolio analysis
    const currentPrice = position ? parseFloat(position.current_price) : 0;
    const totalPortfolioValue = account ? parseFloat(account.portfolio_value) : 100000;
    const buyingPower = account ? parseFloat(account.buying_power) : 50000;
    
    // Analyze current position performance and portfolio context
    const currentPositionValue = position ? parseFloat(position.market_value) : 0;
    const currentPositionPercent = (currentPositionValue / totalPortfolioValue) * 100;
    const unrealizedPLPercent = position ? parseFloat(position.unrealized_plpc) : 0;
    
    // Generate intelligent position sizing recommendation
    let suggestedShares = 0;
    let suggestedDollarAmount = 0;
    let positionSizeReasoning = '';
    
    if (action === 'BUY') {
      // For buys, recommend conservative position sizing
      let recommendedDollarAmount = 0;
      
      if (currentPositionPercent > 0 && position) {
        // Already have position - suggest small additions
        const currentPositionSize = parseInt(position.qty);
        
        if (unrealizedPLPercent > 0.05) {
          // Position is winning - small add (10-25% of current position)
          suggestedShares = Math.min(Math.floor(currentPositionSize * 0.25), Math.floor(2000 / currentPrice));
          recommendedDollarAmount = Math.min(2000, suggestedShares * currentPrice);
          positionSizeReasoning = `Adding ${suggestedShares} shares (25% of current position) to ${symbol}. Position is up ${(unrealizedPLPercent * 100).toFixed(1)}% - modest add to winner.`;
        } else if (unrealizedPLPercent < -0.05) {
          // Position is losing - very small add or none
          suggestedShares = Math.min(Math.floor(currentPositionSize * 0.15), Math.floor(1000 / currentPrice));
          recommendedDollarAmount = Math.min(1000, suggestedShares * currentPrice);
          positionSizeReasoning = `Adding ${suggestedShares} shares (15% of current position) to ${symbol}. Position is down ${(Math.abs(unrealizedPLPercent) * 100).toFixed(1)}% - very cautious add.`;
        } else {
          // Position is flat - moderate add
          suggestedShares = Math.min(Math.floor(currentPositionSize * 0.20), Math.floor(1500 / currentPrice));
          recommendedDollarAmount = Math.min(1500, suggestedShares * currentPrice);
          positionSizeReasoning = `Adding ${suggestedShares} shares (20% of current position) to ${symbol}. Position is roughly flat - moderate increase.`;
        }
      } else {
        // New position - conservative starter position
        if (stockThesis.performanceVsThesis === 'OUTPERFORMING') {
          recommendedDollarAmount = Math.min(3000, buyingPower * 0.15);
          positionSizeReasoning = `Starting with $${recommendedDollarAmount.toFixed(0)} position in ${symbol}. Strong thesis performance suggests higher conviction starter.`;
        } else if (stockThesis.performanceVsThesis === 'UNDERPERFORMING') {
          recommendedDollarAmount = Math.min(1500, buyingPower * 0.08);
          positionSizeReasoning = `Starting with $${recommendedDollarAmount.toFixed(0)} position in ${symbol}. Underperforming thesis suggests smaller initial position.`;
        } else {
          recommendedDollarAmount = Math.min(2000, buyingPower * 0.12);
          positionSizeReasoning = `Starting with $${recommendedDollarAmount.toFixed(0)} position in ${symbol}. Standard starter position size.`;
        }
        suggestedShares = Math.floor(recommendedDollarAmount / currentPrice);
      }
      
      // Final safety checks
      suggestedDollarAmount = Math.min(recommendedDollarAmount, buyingPower * 0.5); // Never use more than 50% of buying power
      suggestedShares = Math.min(suggestedShares, Math.floor(suggestedDollarAmount / currentPrice));
      
      // Ensure minimum viable position
      if (suggestedShares < 1) {
        suggestedShares = 1;
        suggestedDollarAmount = currentPrice;
        positionSizeReasoning = `Minimum viable position of 1 share for ${symbol}. Price too high for larger position with current buying power.`;
      }
      
    } else if (action === 'SELL') {
      // For sells, recommend based on position performance and thesis
      const totalShares = position ? parseInt(position.qty) : 0;
      
      if (unrealizedPLPercent > 0.20) {
        // Big winner - suggest taking some profits
        suggestedShares = Math.floor(totalShares * 0.5);
        positionSizeReasoning = `Recommending selling 50% of ${symbol} position (${suggestedShares} shares). Up ${(unrealizedPLPercent * 100).toFixed(1)}% - time to take some profits while letting winners run.`;
      } else if (unrealizedPLPercent < -0.10) {
        // Big loser - suggest cutting losses
        suggestedShares = totalShares; // Full exit
        positionSizeReasoning = `Recommending selling entire ${symbol} position (${suggestedShares} shares). Down ${(Math.abs(unrealizedPLPercent) * 100).toFixed(1)}% - cut losses and preserve capital.`;
      } else if (stockThesis.performanceVsThesis === 'UNDERPERFORMING') {
        // Thesis not working - suggest partial exit
        suggestedShares = Math.floor(totalShares * 0.6);
        positionSizeReasoning = `Recommending selling 60% of ${symbol} position (${suggestedShares} shares). Thesis underperforming - reduce exposure while maintaining some upside.`;
      } else {
        // Normal rebalancing
        suggestedShares = Math.floor(totalShares * 0.3);
        positionSizeReasoning = `Recommending selling 30% of ${symbol} position (${suggestedShares} shares). Portfolio rebalancing and risk management.`;
      }
      
      suggestedDollarAmount = suggestedShares * currentPrice;
    }
    
    // Generate reasoning for the action
    let actionReasoning = '';
    if (action === 'BUY') {
      actionReasoning = `BUY recommendation for ${symbol}: ${stockThesis.thesisText}. `;
      
      if (stockThesis.performanceVsThesis === 'OUTPERFORMING') {
        actionReasoning += `Position is outperforming expectations, suggesting thesis is correct. `;
      } else if (stockThesis.performanceVsThesis === 'UNDERPERFORMING') {
        actionReasoning += `Position is underperforming, but may present value opportunity. `;
      } else {
        actionReasoning += `Position is tracking thesis expectations. `;
      }
      
      actionReasoning += `Target price: $${stockThesis.keyMetrics.targetPrice.toFixed(2)}. `;
      actionReasoning += positionSizeReasoning;
      
    } else if (action === 'SELL') {
      actionReasoning = `SELL recommendation for ${symbol}: `;
      
      if (unrealizedPLPercent > 0.15) {
        actionReasoning += `Position has achieved significant gains (${(unrealizedPLPercent * 100).toFixed(1)}%). Taking profits to lock in returns. `;
      } else if (unrealizedPLPercent < -0.10) {
        actionReasoning += `Position showing material losses (${(Math.abs(unrealizedPLPercent) * 100).toFixed(1)}%). Cutting losses to preserve capital. `;
      } else if (stockThesis.performanceVsThesis === 'UNDERPERFORMING') {
        actionReasoning += `Thesis not materializing as expected. Reducing exposure. `;
      } else {
        actionReasoning += `Portfolio rebalancing and risk management. `;
      }
      
      actionReasoning += positionSizeReasoning;
    }
    
    const executionRecommendation: AIRecommendation = {
      id: `stock_action_${symbol}_${Date.now()}`,
      symbol,
      action,
      confidence: 0,
      reasoning: actionReasoning,
      expectedReturn: 0,
      riskLevel: 'MEDIUM',
      thesis: stockThesis.thesisText,
      priceTarget: stockThesis.keyMetrics.targetPrice,
      stopLoss: stockThesis.keyMetrics.stopLoss,
      timeframe: 'User-defined',
      createdAt: new Date(),
      status: 'ACTIVE',
      patternContext: {
        similarPatterns: 0,
        historicalSuccessRate: 0,
        averageReturn: 0,
        confidenceFactors: ['Portfolio management', 'Position performance analysis']
      },
      marketContext: {
        shortInterest: 0,
        daysToCover: 0,
        borrowRate: 0,
        volumeRatio: 0,
        squeezeScore: 0
      },
      positionSizing: {
        suggestedShares,
        suggestedDollarAmount,
        percentOfPortfolio: (suggestedDollarAmount / totalPortfolioValue) * 100,
        riskAmount: suggestedShares * currentPrice * 0.08
      }
    };

    setSelectedRecommendation(executionRecommendation);
    setShowOrderDialog(true);
  };

  const handlePortfolioOptimization = async () => {
    try {
      const response = await fetch('/api/portfolio-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh all data after optimization
        fetchPositions();
        fetchRecommendations();
        fetchAccount();
      }
      
      return result;
    } catch (error) {
      console.error('Portfolio optimization error:', error);
      return {
        success: false,
        message: 'Network error during optimization',
        executedTrades: [],
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Enhanced Portfolio - Squeeze Alpha</title>
        <meta name="description" content="AI-powered portfolio analysis and recommendations" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI-Enhanced Portfolio</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowOptimizationModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg"
            >
              🎯 Optimize Portfolio
            </button>
            <button
              onClick={fetchRecommendations}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Analysis
            </button>
            <Link
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Chat
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <>
            {/* Portfolio Health Dashboard */}
            {portfolioHealth && <PortfolioHealthDashboard health={portfolioHealth} />}

            {/* Current Holdings with AI Thesis */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Holdings</h2>
              <Holdings />
              
              {/* Stock Thesis Cards */}
              {stockTheses.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">AI Stock Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stockTheses.map(thesis => (
                      <StockThesisCard
                        key={thesis.symbol}
                        thesis={thesis}
                        currentPrice={positions?.find(p => p.symbol === thesis.symbol)?.current_price ? parseFloat(positions.find(p => p.symbol === thesis.symbol)!.current_price) : undefined}
                        onAction={handleStockAction}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                AI Recommendations
                {recommendations.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({recommendations.length} active)
                  </span>
                )}
              </h2>
              
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map(rec => (
                    <AIRecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      onExecute={handleExecuteRecommendation}
                      onDismiss={handleDismissRecommendation}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">All recommendations have been reviewed.</p>
                  <p className="text-sm text-gray-500 mt-2">The AI is continuously analyzing market conditions for new opportunities.</p>
                </div>
              )}
            </div>

            {/* Learning Context Display */}
            {/* Order Status Table */}
            <div className="mt-8">
              <OrderStatusTable />
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">🧠 AI Learning System</h3>
              <p className="text-blue-800">
                The AI learning system tracks all trade executions and market patterns to improve recommendation accuracy over time.
                All recommendations are based on real market data and actual portfolio performance.
              </p>
              <div className="mt-4 bg-white rounded p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Learning System Active</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  System continuously learns from executed trades and market conditions
                </p>
              </div>
            </div>
          </>
        )}

        {/* Order Confirmation Dialog */}
        {showOrderDialog && selectedRecommendation && (
          <OrderConfirmationDialog
            isOpen={showOrderDialog}
            onClose={() => setShowOrderDialog(false)}
            onConfirm={handleConfirmOrder}
            recommendation={selectedRecommendation}
            currentPrice={positions?.find(p => p.symbol === selectedRecommendation.symbol)?.current_price ? parseFloat(positions.find(p => p.symbol === selectedRecommendation.symbol)!.current_price) : undefined}
            buyingPower={account?.buying_power ? parseFloat(account.buying_power) : 0}
          />
        )}

        {/* Order Status Notification */}
        <OrderStatusNotification
          isVisible={showNotification}
          onClose={() => setShowNotification(false)}
          status={notificationStatus}
          message={notificationMessage}
          orderDetails={orderDetails}
        />

        {/* Portfolio Optimization Modal */}
        <PortfolioOptimizationModal
          isOpen={showOptimizationModal}
          onClose={() => setShowOptimizationModal(false)}
          onOptimize={handlePortfolioOptimization}
        />
      </main>
    </div>
  );
}