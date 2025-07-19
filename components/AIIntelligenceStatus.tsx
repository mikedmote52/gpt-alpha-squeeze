import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';

interface LearningStatus {
  system_initialized: boolean;
  memory_system: {
    total_conversations: number;
    recent_recommendations: number;
    win_rate: number;
  };
  pattern_recognition: {
    total_patterns: number;
  };
  recommendation_tracking: {
    performance_summary: {
      win_rate: number;
      avg_return: number;
    };
  };
}

const AIIntelligenceStatus: React.FC = () => {
  const [status, setStatus] = useState<LearningStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningStatus = async () => {
      try {
        const response = await fetch('/api/learning/status-simple');
        if (!response.ok) throw new Error('Failed to fetch learning status');
        
        const data = await response.json();
        if (data.success && data.data) {
          setStatus(data.data);
        } else {
          throw new Error('Invalid data structure');
        }
      } catch (err) {
        console.error('Learning status error:', err);
        setError('Unable to fetch learning status');
        // Set fallback data
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningStatus();
    const interval = setInterval(fetchLearningStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-yellow-200 bg-yellow-50">
        <div className="flex items-center gap-2">
          <div className="text-yellow-600">⚠️</div>
          <div>
            <h3 className="font-medium text-yellow-800">Learning System Status</h3>
            <p className="text-sm text-yellow-600">Unable to connect - showing cached data</p>
          </div>
        </div>
      </Card>
    );
  }

  const getConfidenceChange = () => {
    if (!status) return 0;
    const winRate = status.recommendation_tracking?.performance_summary?.win_rate || 0;
    const avgReturn = status.recommendation_tracking?.performance_summary?.avg_return || 0;
    return ((winRate - 0.5) * 20) + (avgReturn * 100);
  };

  return (
    <Card className="p-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🧠</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Intelligence Status</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant={status?.system_initialized ? "default" : "secondary"} className="text-xs">
                Learning: {status?.system_initialized ? "Active" : "Initializing"}
              </Badge>
              <span>•</span>
              <span>Patterns: {status?.pattern_recognition?.total_patterns || 0}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Conversations: {status?.memory_system?.total_conversations || 0}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Confidence Evolution</span>
            <span className="font-medium text-gray-900">
              {getConfidenceChange() >= 0 ? '↗️' : '↘️'} 
              {getConfidenceChange() >= 0 ? '+' : ''}{Math.abs(getConfidenceChange()).toFixed(1)}% trend
            </span>
          </div>
          <Progress 
            value={Math.min(100, Math.max(0, (status?.recommendation_tracking?.performance_summary?.win_rate || 0) * 100))} 
            className="h-2"
          />
        </div>

        {(status?.pattern_recognition?.total_patterns || 0) === 0 ? (
          <div className="text-center py-4 bg-blue-100 rounded-lg">
            <div className="text-blue-600 font-medium">AI Learning Mode - Building Intelligence</div>
            <div className="text-sm text-blue-500 mt-1">
              System is analyzing market patterns and building its knowledge base
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {status?.pattern_recognition?.total_patterns || 0}
              </div>
              <div className="text-xs text-gray-600">Total Patterns</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((status?.recommendation_tracking?.performance_summary?.win_rate || 0) * 100)}%
              </div>
              <div className="text-xs text-gray-600">Win Rate</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((status?.recommendation_tracking?.performance_summary?.avg_return || 0) * 100)}%
              </div>
              <div className="text-xs text-gray-600">Avg Return</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIIntelligenceStatus;