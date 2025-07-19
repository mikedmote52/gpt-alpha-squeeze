import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface AIRecommendation {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
  confidence: number;
  reasoning: string;
  expectedReturn: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  thesis: string;
  priceTarget: number;
  stopLoss: number;
  timeframe: string;
  positionSizing: {
    suggestedShares: number;
    suggestedDollarAmount: number;
    percentOfPortfolio: number;
    riskAmount: number;
  };
  patternContext: {
    similarPatterns: number;
    historicalSuccessRate: number;
    averageReturn: number;
    confidenceFactors: string[];
  };
}

interface TopAIRecommendationProps {
  className?: string;
}

const TopAIRecommendation: React.FC<TopAIRecommendationProps> = ({ className = "" }) => {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopRecommendation = async () => {
      try {
        const response = await fetch('/api/recommendations-simple');
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        
        const data = await response.json();
        if (data.success && data.recommendations?.length > 0) {
          const topRec = data.recommendations[0];
          setRecommendation(topRec);
        } else {
          setRecommendation(null);
        }
      } catch (err) {
        console.error('Top recommendation error:', err);
        setError('Unable to load recommendation');
        setRecommendation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRecommendation();
    const interval = setInterval(fetchTopRecommendation, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !recommendation) {
    return (
      <Card className={`p-6 border-blue-200 bg-blue-50 ${className}`}>
        <div className="text-center">
          <div className="text-blue-600 text-2xl mb-2">🎯</div>
          <h3 className="font-medium text-blue-800 mb-1">No Active Recommendations</h3>
          <p className="text-sm text-blue-600 mb-3">
            AI is analyzing market conditions for new opportunities
          </p>
          <div className="text-xs text-blue-500">
            Check back soon or connect portfolio for personalized recommendations
          </div>
        </div>
      </Card>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'bg-green-600 text-white';
      case 'SELL': return 'bg-red-600 text-white';
      case 'HOLD': return 'bg-yellow-600 text-white';
      default: return 'bg-gray-600 text-white';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card className={`p-6 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">🎯</div>
        <h3 className="text-lg font-bold text-gray-900">Top AI Recommendation</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={getActionColor(recommendation.action)}>
              {recommendation.action}
            </Badge>
            <span className="text-xl font-bold text-gray-900">
              {recommendation.symbol}
            </span>
            {recommendation.action === 'SELL' && (
              <span className="text-sm text-gray-600">
                ({recommendation.positionSizing.suggestedShares} shares)
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-600">
              {recommendation.confidence}%
            </div>
            <div className="text-xs text-gray-600">Confidence</div>
          </div>
        </div>

        <div className="bg-white/60 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-900 mb-2">AI Thesis:</div>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            &quot;{recommendation.thesis.length > 150 
              ? `${recommendation.thesis.substring(0, 150)}...` 
              : recommendation.thesis}&quot;
          </p>
          
          {recommendation.patternContext.similarPatterns > 0 && (
            <div className="text-xs text-gray-600">
              Based on {recommendation.patternContext.similarPatterns} similar patterns with{' '}
              {Math.round(recommendation.patternContext.historicalSuccessRate * 100)}% success rate
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Expected Return</div>
            <div className="text-lg font-bold text-green-600">
              {recommendation.expectedReturn > 0 
                ? `+${(recommendation.expectedReturn * 100).toFixed(1)}%`
                : 'Risk Management'
              }
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Risk Level</div>
            <div className={`text-lg font-bold ${getRiskColor(recommendation.riskLevel)}`}>
              {recommendation.riskLevel}
            </div>
          </div>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-2">Position Details</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Amount: </span>
              <span className="font-medium">
                {formatCurrency(recommendation.positionSizing.suggestedDollarAmount)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Timeframe: </span>
              <span className="font-medium">{recommendation.timeframe}</span>
            </div>
            {recommendation.priceTarget > 0 && (
              <div>
                <span className="text-gray-600">Target: </span>
                <span className="font-medium">{formatCurrency(recommendation.priceTarget)}</span>
              </div>
            )}
            {recommendation.stopLoss > 0 && (
              <div>
                <span className="text-gray-600">Stop Loss: </span>
                <span className="font-medium">{formatCurrency(recommendation.stopLoss)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            size="sm"
            onClick={() => router.push('/portfolio-v2')}
          >
            Execute
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 border-purple-300 text-purple-700"
            size="sm"
            onClick={() => router.push('/portfolio-v2')}
          >
            Learn More
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TopAIRecommendation;