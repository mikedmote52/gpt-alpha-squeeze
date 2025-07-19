import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface PortfolioHealth {
  overallScore: number;
  riskScore: number;
  diversificationScore: number;
  momentumScore: number;
  projectedReturn: number;
  projectedTimeframe: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  optimizationsReady: number;
}

interface PortfolioHealthCardProps {
  className?: string;
}

const PortfolioHealthCard: React.FC<PortfolioHealthCardProps> = ({ className = "" }) => {
  const router = useRouter();
  const [health, setHealth] = useState<PortfolioHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolioHealth = async () => {
      try {
        const response = await fetch('/api/recommendations-simple');
        if (!response.ok) throw new Error('Failed to fetch portfolio health');
        
        const data = await response.json();
        if (data.success && data.portfolioHealth) {
          setHealth({
            ...data.portfolioHealth,
            optimizationsReady: data.recommendations?.filter((r: any) => 
              r.action === 'BUY' || r.action === 'SELL'
            ).length || 0
          });
        } else {
          setHealth({
            overallScore: 0,
            riskScore: 100,
            diversificationScore: 0,
            momentumScore: 0,
            projectedReturn: 0,
            projectedTimeframe: 'Unknown',
            strengths: [],
            weaknesses: ['No portfolio data available'],
            recommendations: [],
            optimizationsReady: 0
          });
        }
      } catch (err) {
        console.error('Portfolio health error:', err);
        setError('Unable to analyze portfolio');
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioHealth();
    const interval = setInterval(fetchPortfolioHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !health) {
    return (
      <Card className={`p-6 border-orange-200 bg-orange-50 ${className}`}>
        <div className="text-center">
          <div className="text-orange-600 text-2xl mb-2">📊</div>
          <h3 className="font-medium text-orange-800 mb-1">Connect Portfolio to Begin AI Analysis</h3>
          <p className="text-sm text-orange-600 mb-3">
            Link your trading account to unlock portfolio insights
          </p>
          <Button 
            size="sm" 
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => router.push('/portfolio-v2')}
          >
            Connect Account
          </Button>
        </div>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'from-green-50 to-emerald-50 border-green-200';
    if (score >= 60) return 'from-yellow-50 to-orange-50 border-yellow-200';
    return 'from-red-50 to-pink-50 border-red-200';
  };

  return (
    <Card className={`p-6 bg-gradient-to-r ${getScoreBackground(health.overallScore)} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📊</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Portfolio Health</h3>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getScoreColor(health.overallScore)}`}>
                {health.overallScore}/100
              </span>
              {health.optimizationsReady > 0 && (
                <Badge variant="default" className="text-xs">
                  {health.optimizationsReady} optimizations ready
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${getScoreColor(health.riskScore)}`}>
              {health.riskScore}
            </div>
            <div className="text-xs text-gray-600">Risk Score</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${getScoreColor(health.diversificationScore)}`}>
              {health.diversificationScore}
            </div>
            <div className="text-xs text-gray-600">Diversification</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${getScoreColor(health.momentumScore)}`}>
              {health.momentumScore}
            </div>
            <div className="text-xs text-gray-600">Momentum</div>
          </div>
        </div>

        {health.optimizationsReady > 0 && (
          <div className="bg-blue-100 rounded-lg p-3">
            <div className="font-medium text-blue-900 mb-1">
              AI Analysis: {health.optimizationsReady} optimizations ready
            </div>
            <div className="text-sm text-blue-700 mb-3">
              {health.recommendations.slice(0, 1).join(', ')}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push('/portfolio-v2')}
              >
                Optimize Now
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-blue-300 text-blue-700"
                onClick={() => router.push('/portfolio-v2')}
              >
                Details
              </Button>
            </div>
          </div>
        )}

        {health.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Strengths:</div>
            {health.strengths.slice(0, 2).map((strength, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                {strength}
              </div>
            ))}
          </div>
        )}

        {health.weaknesses.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Areas for Improvement:</div>
            {health.weaknesses.slice(0, 2).map((weakness, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-orange-700">
                <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                {weakness}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PortfolioHealthCard;