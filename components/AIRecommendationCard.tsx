// AI Recommendation Card Component
// Displays individual AI recommendations with actionable insights

import React from 'react';
import { AIRecommendation } from '../types/recommendations';

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  onExecute?: (recommendation: AIRecommendation) => void;
  onDismiss?: (recommendationId: string) => void;
}

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  recommendation,
  onExecute,
  onDismiss
}) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      case 'HOLD': return 'bg-yellow-500';
      case 'WATCH': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-4 border border-gray-200 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className={`${getActionColor(recommendation.action)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
            {recommendation.action}
          </span>
          <h3 className="text-xl font-bold text-gray-900">{recommendation.symbol}</h3>
          <span className={`${getConfidenceColor(recommendation.confidence)} px-3 py-1 rounded-full text-sm font-semibold`}>
            {recommendation.confidence}% Confidence
          </span>
        </div>
        <div className="flex space-x-2">
          {onExecute && recommendation.status === 'ACTIVE' && (
            <button
              onClick={() => onExecute(recommendation)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Execute Trade
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(recommendation.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="mb-4">
        <p className="text-gray-700 font-medium mb-1">AI Analysis:</p>
        <p className="text-gray-600">{recommendation.reasoning}</p>
      </div>

      {/* Pattern Context */}
      {recommendation.patternContext.similarPatterns > 0 && (
        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <p className="text-sm text-blue-800">
            📊 Based on {recommendation.patternContext.similarPatterns} similar patterns with{' '}
            {(recommendation.patternContext.historicalSuccessRate * 100).toFixed(0)}% success rate
            and {(recommendation.patternContext.averageReturn * 100).toFixed(1)}% average return
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Expected Return</p>
          <p className="font-bold text-lg text-green-600">
            {recommendation.expectedReturn > 0 ? '+' : ''}{(recommendation.expectedReturn * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Risk Level</p>
          <p className={`font-bold text-lg ${getRiskColor(recommendation.riskLevel)}`}>
            {recommendation.riskLevel}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Price Target</p>
          <p className="font-bold text-lg">${recommendation.priceTarget.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Stop Loss</p>
          <p className="font-bold text-lg text-red-600">${recommendation.stopLoss.toFixed(2)}</p>
        </div>
      </div>

      {/* Market Context */}
      <div className="bg-gray-50 p-3 rounded-md mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Market Context:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Short Interest:</span>
            <span className="ml-1 font-medium">{recommendation.marketContext.shortInterest.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-gray-500">Days to Cover:</span>
            <span className="ml-1 font-medium">{recommendation.marketContext.daysToCover.toFixed(1)}</span>
          </div>
          <div>
            <span className="text-gray-500">Volume Ratio:</span>
            <span className="ml-1 font-medium">{recommendation.marketContext.volumeRatio.toFixed(1)}x</span>
          </div>
          <div>
            <span className="text-gray-500">Squeeze Score:</span>
            <span className="ml-1 font-medium">{recommendation.marketContext.squeezeScore}/100</span>
          </div>
        </div>
      </div>

      {/* Position Sizing */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Suggested Position:</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {recommendation.positionSizing.suggestedShares} shares 
            (${recommendation.positionSizing.suggestedDollarAmount.toFixed(0)})
          </span>
          <span className="text-gray-600">
            {recommendation.positionSizing.percentOfPortfolio.toFixed(1)}% of portfolio
          </span>
          <span className="text-red-600">
            Risk: ${recommendation.positionSizing.riskAmount.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Thesis */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm font-medium text-gray-700 mb-1">Investment Thesis:</p>
        <p className="text-sm text-gray-600">{recommendation.thesis}</p>
      </div>

      {/* Timeframe */}
      <div className="mt-3 flex justify-between items-center">
        <span className="text-sm text-gray-500">Timeframe: {recommendation.timeframe}</span>
        <span className="text-xs text-gray-400">
          Generated: {new Date(recommendation.createdAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default AIRecommendationCard;