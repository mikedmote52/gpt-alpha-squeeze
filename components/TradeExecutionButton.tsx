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

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await onExecute(recommendation);
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
            {recommendation.action} {recommendation.quantity} shares of {recommendation.symbol}
          </div>
          <div className="text-blue-600 text-xs mt-1">
            {recommendation.reasoning}
          </div>
        </div>
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            recommendation.action === 'BUY'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isExecuting ? 'Executing...' : `${recommendation.action} Now`}
        </button>
      </div>
    </div>
  );
};

export default TradeExecutionButton;