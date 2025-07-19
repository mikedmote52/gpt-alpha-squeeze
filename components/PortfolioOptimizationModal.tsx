// Portfolio Optimization Progress Modal
import React, { useState, useEffect } from 'react';

interface OptimizationTrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  orderId: string;
  status: 'executed' | 'failed';
  error?: string;
}

interface PreviewTrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  currentPrice: number;
  dollarAmount: number;
  reasoning: string;
  type: 'profit_taking' | 'loss_cutting' | 'rebalancing' | 'new_opportunity' | 'add_to_winner';
}

interface OptimizationPreview {
  success: boolean;
  trades: PreviewTrade[];
  summary: {
    totalSells: number;
    totalBuys: number;
    sellValue: number;
    buyValue: number;
    netCashFlow: number;
    affectedPositions: number;
  };
}

interface OptimizationResult {
  success: boolean;
  message: string;
  executedTrades: OptimizationTrade[];
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
}

interface PortfolioOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimize: () => Promise<OptimizationResult>;
}

const PortfolioOptimizationModal: React.FC<PortfolioOptimizationModalProps> = ({
  isOpen,
  onClose,
  onOptimize
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [currentStep, setCurrentStep] = useState('');
  const [preview, setPreview] = useState<OptimizationPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Fetch preview when modal opens
  useEffect(() => {
    if (isOpen && !preview && !isLoadingPreview) {
      fetchPreview();
    }
  }, [isOpen]);

  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/portfolio-optimization-preview');
      if (response.ok) {
        const previewData = await response.json();
        setPreview(previewData);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setResult(null);
    setCurrentStep('Analyzing current positions...');
    
    try {
      // Simulate step progression
      setTimeout(() => setCurrentStep('Identifying sell opportunities...'), 1000);
      setTimeout(() => setCurrentStep('Scanning for new opportunities...'), 2000);
      setTimeout(() => setCurrentStep('Executing trades...'), 3000);
      
      const optimizationResult = await onOptimize();
      setResult(optimizationResult);
      setCurrentStep('Optimization complete!');
    } catch (error) {
      setResult({
        success: false,
        message: 'Optimization failed',
        executedTrades: [],
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0
      });
      setCurrentStep('Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleClose = () => {
    if (!isOptimizing) {
      setResult(null);
      setCurrentStep('');
      setPreview(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🎯 Portfolio Optimization</h2>
          <button
            onClick={handleClose}
            disabled={isOptimizing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!result && !isOptimizing && (
          <div>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI-Powered Portfolio Optimization
              </h3>
              <p className="text-gray-600 mb-4">
                Review the planned trades below, then click optimize to execute them automatically.
              </p>
            </div>

            {isLoadingPreview ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing your portfolio...</p>
              </div>
            ) : preview ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">📊 Optimization Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-red-600 font-bold text-lg">{preview.summary.totalSells}</div>
                      <div className="text-gray-600">Sells</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-bold text-lg">{preview.summary.totalBuys}</div>
                      <div className="text-gray-600">Buys</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-600 font-bold text-lg">{preview.summary.affectedPositions}</div>
                      <div className="text-gray-600">Positions</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-bold text-lg ${preview.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {preview.summary.netCashFlow >= 0 ? '+' : ''}${preview.summary.netCashFlow.toFixed(0)}
                      </div>
                      <div className="text-gray-600">Net Cash</div>
                    </div>
                  </div>
                </div>

                {/* Planned Trades */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">📋 Planned Trades</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {preview.trades.map((trade, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          trade.action === 'BUY' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                            trade.action === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {trade.action}
                          </span>
                          <span className="font-medium text-gray-900">{trade.symbol}</span>
                          <span className="text-sm text-gray-600">
                            {trade.quantity} shares @ ${trade.currentPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ${trade.dollarAmount.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500 max-w-40 truncate">
                            {trade.reasoning}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {preview.trades.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No optimization trades needed at this time.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">What This Will Do:</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• <strong>Sell underperforming positions</strong> - Cut losses and reduce risk</li>
                  <li>• <strong>Take profits on big winners</strong> - Lock in gains (25%+ positions)</li>
                  <li>• <strong>Rebalance overweight positions</strong> - Maintain diversification</li>
                  <li>• <strong>Add to strong performers</strong> - Increase winning positions</li>
                  <li>• <strong>Buy new opportunities</strong> - Enter high-scoring squeeze candidates</li>
                  <li>• <strong>Set automatic stop-losses</strong> - Protect all new positions</li>
                </ul>
              </div>
            )}

            {preview && preview.trades.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This will execute {preview.trades.length} trades automatically. Make sure you&apos;re ready to proceed.
                  </p>
                </div>
              </div>
            )}

            <div className="text-center">
              {preview && preview.trades.length > 0 ? (
                <button
                  onClick={handleOptimize}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                >
                  🎯 Execute {preview.trades.length} Trades
                </button>
              ) : preview && preview.trades.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-800">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">Portfolio is already optimized!</p>
                    <p className="text-sm text-green-600 mt-1">No trades needed at this time.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {isOptimizing && (
          <div className="text-center">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Optimizing Portfolio...
              </h3>
              <p className="text-blue-600 font-medium">{currentStep}</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Please wait while AI analyzes your portfolio and executes optimal trades...
              </p>
            </div>
          </div>
        )}

        {result && (
          <div>
            <div className="text-center mb-6">
              <div className={`text-6xl mb-4 ${result.success ? '' : ''}`}>
                {result.success ? '✅' : '❌'}
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                {result.success ? 'Optimization Complete!' : 'Optimization Failed'}
              </h3>
              <p className="text-gray-600">{result.message}</p>
            </div>

            {result.executedTrades.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Executed Trades ({result.successfulTrades} successful, {result.failedTrades} failed)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.executedTrades.map((trade, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        trade.status === 'executed' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                          trade.action === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {trade.action}
                        </span>
                        <span className="font-medium">{trade.symbol}</span>
                        <span className="text-sm text-gray-600">
                          {trade.quantity} shares @ ${trade.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          trade.status === 'executed' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.status === 'executed' ? '✅ Executed' : '❌ Failed'}
                        </div>
                        {trade.error && (
                          <div className="text-xs text-red-500 mt-1">{trade.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioOptimizationModal;