// Stock Thesis Card Component
// Displays individual stock thesis and performance

import React from 'react';
import { StockThesis } from '../types/recommendations';

interface StockThesisCardProps {
  thesis: StockThesis;
  currentPrice?: number;
  onAction?: (symbol: string, action: 'BUY' | 'SELL' | 'HOLD') => void;
}

const StockThesisCard: React.FC<StockThesisCardProps> = ({ thesis, currentPrice, onAction }) => {
  const getThesisColor = (thesis: string) => {
    switch (thesis) {
      case 'BULLISH': return 'text-green-600 bg-green-50';
      case 'BEARISH': return 'text-red-600 bg-red-50';
      case 'NEUTRAL': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'OUTPERFORMING': return 'text-green-600';
      case 'ON_TRACK': return 'text-blue-600';
      case 'UNDERPERFORMING': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const price = (currentPrice && !isNaN(currentPrice)) ? currentPrice : thesis.keyMetrics.currentPrice;
  const returnPercent = thesis.keyMetrics.returnToDate * 100;
  const progressToTarget = ((price - thesis.keyMetrics.entryPrice) / 
    (thesis.keyMetrics.targetPrice - thesis.keyMetrics.entryPrice)) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{thesis.symbol}</h3>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getThesisColor(thesis.currentThesis)}`}>
            {thesis.currentThesis}
          </span>
        </div>
        <span className={`text-sm font-medium ${getPerformanceColor(thesis.performanceVsThesis)}`}>
          {thesis.performanceVsThesis.replace('_', ' ')}
        </span>
      </div>

      {/* Current Performance */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Current Performance</span>
          <span className={`text-lg font-bold ${returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(1)}%
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Entry: ${thesis.keyMetrics.entryPrice.toFixed(2)} → Current: ${price.toFixed(2)}
        </div>
      </div>

      {/* Progress to Target */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress to Target</span>
          <span className="text-gray-700">${thesis.keyMetrics.targetPrice.toFixed(2)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progressToTarget))}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Stop: ${thesis.keyMetrics.stopLoss.toFixed(2)}</span>
          <span>{thesis.keyMetrics.daysHeld} days held</span>
        </div>
      </div>

      {/* Thesis Text */}
      <div className="mb-3">
        <p className="text-sm text-gray-700">{thesis.thesisText}</p>
      </div>

      {/* Entry Reason & Exit Strategy */}
      <div className="border-t pt-3 space-y-2">
        <div>
          <span className="text-xs font-medium text-gray-500">Entry Reason:</span>
          <p className="text-xs text-gray-600">{thesis.entryReason}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500">Exit Strategy:</span>
          <p className="text-xs text-gray-600">{thesis.exitStrategy}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {onAction && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => onAction(thesis.symbol, 'BUY')}
            className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
          >
            Add More
          </button>
          <button
            onClick={() => onAction(thesis.symbol, 'HOLD')}
            className="flex-1 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
          >
            Hold
          </button>
          <button
            onClick={() => onAction(thesis.symbol, 'SELL')}
            className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
          >
            Sell
          </button>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-3 text-xs text-gray-400 text-right">
        Updated: {new Date(thesis.lastUpdated).toLocaleDateString()}
      </div>
    </div>
  );
};

export default StockThesisCard;