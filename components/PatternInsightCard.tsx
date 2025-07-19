import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface PatternInsight {
  description: string;
  successRate: number;
  avgReturn: number;
  sampleSize: number;
  lastSeen: string;
  confidence: number;
}

interface PatternInsightCardProps {
  className?: string;
}

const PatternInsightCard: React.FC<PatternInsightCardProps> = ({ className = "" }) => {
  const router = useRouter();
  const [insights, setInsights] = useState<PatternInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatternInsights = async () => {
      try {
        const response = await fetch('/api/recommendations-simple');
        if (!response.ok) throw new Error('Failed to fetch pattern insights');
        
        const data = await response.json();
        if (data.success && data.learningContext?.patternInsights) {
          setInsights(data.learningContext.patternInsights.slice(0, 3));
        } else {
          setInsights([]);
        }
      } catch (err) {
        console.error('Pattern insights error:', err);
        setError('Unable to load pattern insights');
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatternInsights();
  }, []);

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 border-yellow-200 bg-yellow-50 ${className}`}>
        <div className="text-center">
          <div className="text-yellow-600 text-2xl mb-2">⚠️</div>
          <h3 className="font-medium text-yellow-800 mb-1">Pattern Analysis Unavailable</h3>
          <p className="text-sm text-yellow-600">Unable to load learning insights</p>
        </div>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className={`p-6 border-blue-200 bg-blue-50 ${className}`}>
        <div className="text-center">
          <div className="text-blue-600 text-2xl mb-2">🧠</div>
          <h3 className="font-medium text-blue-800 mb-1">AI Learning In Progress</h3>
          <p className="text-sm text-blue-600 mb-3">
            Building pattern recognition from market data
          </p>
          <div className="text-xs text-blue-500">
            Check back soon as the AI learns from trading outcomes
          </div>
        </div>
      </Card>
    );
  }

  const topInsight = insights[0];

  return (
    <Card className={`p-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-xl">💭</div>
        <h3 className="text-lg font-bold text-gray-900">What AI Is Learning</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-white/60 rounded-lg p-4 border border-green-100">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 leading-relaxed">
                &quot;{topInsight.description}&quot;
              </p>
            </div>
            <Badge 
              variant={topInsight.successRate > 0.7 ? "default" : "secondary"} 
              className="ml-2 text-xs"
            >
              {Math.round(topInsight.successRate * 100)}% success
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {(topInsight.avgReturn * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Avg Return</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {topInsight.sampleSize}
              </div>
              <div className="text-xs text-gray-600">Sample Size</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {Math.round(topInsight.confidence * 100)}%
              </div>
              <div className="text-xs text-gray-600">Confidence</div>
            </div>
          </div>
        </div>

        {insights.length > 1 && (
          <div className="space-y-2">
            {insights.slice(1).map((insight, index) => (
              <div key={index} className="bg-white/40 rounded-lg p-3 border border-green-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700 flex-1">
                    {insight.description.length > 60 
                      ? `${insight.description.substring(0, 60)}...` 
                      : insight.description}
                  </p>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs text-green-600 font-medium">
                      {Math.round(insight.successRate * 100)}%
                    </span>
                    <span className="text-xs text-gray-400">
                      ({insight.sampleSize})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-green-700 border-green-200 hover:bg-green-100"
            onClick={() => router.push('/portfolio-v2')}
          >
            View Pattern Analysis
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PatternInsightCard;