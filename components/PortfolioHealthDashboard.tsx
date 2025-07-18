import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, DollarSign, Target, Brain, Shield } from 'lucide-react';

interface PortfolioMetrics {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  avgSqueezeScore: number;
  riskScore: number;
  diversification: number;
  momentum: number;
  aiConfidence: number;
  topPerformer: string;
  worstPerformer: string;
  activeTracking: number;
}

interface PortfolioHealthDashboardProps {
  positions: any[];
  candidates: any[];
  learningStatus: any;
}

export default function PortfolioHealthDashboard({ 
  positions = [], 
  candidates = [], 
  learningStatus 
}: PortfolioHealthDashboardProps) {
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalValue: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    avgSqueezeScore: 0,
    riskScore: 0,
    diversification: 0,
    momentum: 0,
    aiConfidence: 0,
    topPerformer: '',
    worstPerformer: '',
    activeTracking: 0
  });

  useEffect(() => {
    calculateMetrics();
  }, [positions, candidates, learningStatus]);

  const calculateMetrics = () => {
    if (!positions || positions.length === 0) {
      setMetrics({
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        avgSqueezeScore: 0,
        riskScore: 0,
        diversification: 0,
        momentum: 0,
        aiConfidence: 0,
        topPerformer: 'No positions',
        worstPerformer: 'No positions',
        activeTracking: 0
      });
      return;
    }

    // Calculate portfolio totals from real Alpaca data
    const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.market_value || 0), 0);
    const totalPnL = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl || 0), 0);
    const totalPnLPercent = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    // Calculate average squeeze score from real market data
    const avgSqueezeScore = candidates && candidates.length > 0 
      ? candidates.reduce((sum, c) => sum + (c.enhanced_score || 0), 0) / candidates.length
      : 0;

    // Risk score based on position concentration
    const maxPosition = Math.max(...positions.map(p => parseFloat(p.market_value || 0)));
    const riskScore = totalValue > 0 ? Math.min(100, (maxPosition / totalValue) * 100) : 0;

    // Diversification score (better with more positions, max at 10)
    const diversification = Math.min(100, positions.length * 10);

    // Momentum score (average of all position P&L percentages)
    const momentum = positions.length > 0 
      ? positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_plpc || 0), 0) / positions.length * 100
      : 0;

    // AI confidence based on learning system status
    const aiConfidence = learningStatus?.system_learning ? 85 : 0;

    // Find top and worst performers
    const sortedPositions = [...positions].sort((a, b) => 
      parseFloat(b.unrealized_plpc || 0) - parseFloat(a.unrealized_plpc || 0)
    );
    const topPerformer = sortedPositions[0]?.symbol || 'None';
    const worstPerformer = sortedPositions[sortedPositions.length - 1]?.symbol || 'None';

    // Active tracking from learning system
    const activeTracking = learningStatus?.active_tracking || 0;

    setMetrics({
      totalValue,
      totalPnL,
      totalPnLPercent,
      avgSqueezeScore,
      riskScore,
      diversification,
      momentum,
      aiConfidence,
      topPerformer,
      worstPerformer,
      activeTracking
    });
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 70) return { variant: 'default', label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 40) return { variant: 'secondary', label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    return { variant: 'destructive', label: 'Needs Attention', color: 'bg-red-100 text-red-800' };
  };

  // Calculate overall portfolio health score
  const overallHealth = Math.round(
    (metrics.avgSqueezeScore * 0.3) +
    ((100 - metrics.riskScore) * 0.2) +
    (metrics.diversification * 0.15) +
    (Math.max(0, metrics.momentum + 50) * 0.2) +
    (metrics.aiConfidence * 0.15)
  );

  return (
    <div className="space-y-6">
      {/* Main Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Portfolio Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalValue.toLocaleString()}</div>
            <div className={`text-xs flex items-center gap-1 ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.totalPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              ${metrics.totalPnL.toLocaleString()} ({metrics.totalPnLPercent.toFixed(1)}%)
            </div>
          </CardContent>
        </Card>

        {/* Overall Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallHealth}/100</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={overallHealth} className="flex-1" />
              <Badge className={getHealthBadge(overallHealth).color}>
                {getHealthBadge(overallHealth).label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Squeeze Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Squeeze Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgSqueezeScore.toFixed(1)}/100</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={metrics.avgSqueezeScore} className="flex-1" />
              <span className={`text-xs ${getHealthColor(metrics.avgSqueezeScore)}`}>
                {metrics.avgSqueezeScore >= 75 ? 'High' : metrics.avgSqueezeScore >= 50 ? 'Medium' : 'Low'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* AI Learning Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Learning Status</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.aiConfidence.toFixed(0)}%</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={metrics.aiConfidence} className="flex-1" />
              <Badge className={metrics.aiConfidence >= 70 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {metrics.aiConfidence >= 70 ? 'Active' : 'Learning'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Concentration Risk</span>
                  <span className={`text-xs font-medium ${metrics.riskScore <= 30 ? 'text-green-600' : metrics.riskScore <= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {metrics.riskScore.toFixed(0)}%
                  </span>
                </div>
                <Progress value={metrics.riskScore} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {metrics.riskScore <= 30 ? 'Well diversified' : metrics.riskScore <= 60 ? 'Moderate concentration' : 'High concentration risk'}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Diversification</span>
                  <span className={`text-xs font-medium ${getHealthColor(metrics.diversification)}`}>
                    {positions.length} positions
                  </span>
                </div>
                <Progress value={metrics.diversification} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {metrics.diversification >= 70 ? 'Excellent diversification' : metrics.diversification >= 40 ? 'Good diversification' : 'Consider adding positions'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Overall Momentum</span>
                  <span className={`text-xs font-medium ${metrics.momentum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.momentum.toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.max(0, metrics.momentum + 50)} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {metrics.momentum >= 5 ? 'Strong upward momentum' : metrics.momentum >= 0 ? 'Slight positive momentum' : 'Negative momentum'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Top Performer</div>
                  <div className="font-medium text-green-600">{metrics.topPerformer}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Needs Attention</div>
                  <div className="font-medium text-red-600">{metrics.worstPerformer}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">AI Tracking</div>
                <div className="font-medium">{metrics.activeTracking} positions actively monitored</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}