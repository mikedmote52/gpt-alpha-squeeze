import React, { useState } from 'react';

interface TradeRecommendation {
  action: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  reasoning: string;
}

interface TradeExecutionButtonProps {
  recommendation: TradeRecommendation;
  onExecute: (recommendation: TradeRecommendation) => Promise<void>;
}

const TradeExecutionButton: React.FC<TradeExecutionButtonProps> = ({ 
  recommendation, 
  onExecute 
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [customQuantity, setCustomQuantity] = useState(recommendation.quantity);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const executeRecommendation = {
        ...recommendation,
        quantity: customQuantity
      };
      await onExecute(executeRecommendation);
      setExecuted(true);
    } catch (error) {
      console.error('Trade execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  if (executed) {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
              <path d="M6.1 1.4L3.5 4 1.9 2.4 1.4 2.9 3.5 5 6.6 1.9z"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-green-800">
            Trade Executed: {recommendation.action} {recommendation.quantity} {recommendation.symbol}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-blue-900 text-sm">
            💡 AI Recommendation
          </div>
          <div className="text-blue-800 text-sm">
            {recommendation.action} {recommendation.quantity} shares of {recommendation.symbol} (suggested)
          </div>
          <div className="text-blue-600 text-xs mt-1">
            {recommendation.reasoning}
          </div>
          {showQuantityInput && (
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-blue-700">Quantity:</label>
              <input
                type="number"
                min="1"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
                className="w-20 px-2 py-1 text-sm border border-blue-300 rounded"
              />
              <span className="text-xs text-blue-600">shares</span>
            </div>
          )}
        </div>
        <div className="ml-3 flex flex-col gap-1">
          <button
            onClick={() => setShowQuantityInput(!showQuantityInput)}
            className="px-3 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
          >
            {showQuantityInput ? 'Hide' : 'Edit Qty'}
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              recommendation.action === 'BUY'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isExecuting ? 'Executing...' : `${recommendation.action} ${customQuantity}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeExecutionButton;