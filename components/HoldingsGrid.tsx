import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Eye,
  Info,
  Clock,
  Volume2
} from 'lucide-react';

interface HoldingsGridProps {
  positions: any[];
  candidates: any[];
  onTradeAction: (action: string, symbol: string, quantity?: number) => void;
}

export default function HoldingsGrid({ positions = [], candidates = [], onTradeAction }: HoldingsGridProps) {
  const [selectedAction, setSelectedAction] = useState<{symbol: string, action: string} | null>(null);

  const getSqueezeScore = (symbol: string) => {
    const candidate = candidates.find(c => c.symbol === symbol);
    return candidate?.enhanced_score || 0;
  };

  const getSqueezeColor = (score: number) => {
    if (score >= 75) return 'bg-red-100 text-red-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    if (score >= 25) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getSqueezeIcon = (score: number) => {
    if (score >= 75) return '🔥';
    if (score >= 50) return '🟡';
    if (score >= 25) return '🔵';
    return '❄️';
  };

  const getSqueezeLabel = (score: number) => {
    if (score >= 75) return 'HIGH SQUEEZE';
    if (score >= 50) return 'MODERATE';
    if (score >= 25) return 'LOW POTENTIAL';
    return 'MINIMAL';
  };

  const getRecommendation = (position: any, score: number) => {
    const pnlPercent = parseFloat(position.unrealized_plpc || 0) * 100;
    const candidate = candidates.find(c => c.symbol === position.symbol);
    
    if (score >= 75 && pnlPercent > -5) return { action: 'HOLD/ADD', color: 'text-green-600', icon: <Plus className="h-3 w-3" /> };
    if (score >= 50 && pnlPercent > 0) return { action: 'HOLD', color: 'text-blue-600', icon: <Eye className="h-3 w-3" /> };
    if (pnlPercent < -10) return { action: 'CONSIDER SELL', color: 'text-red-600', icon: <Minus className="h-3 w-3" /> };
    if (score < 25 && pnlPercent > 10) return { action: 'TAKE PROFIT', color: 'text-green-600', icon: <TrendingUp className="h-3 w-3" /> };
    return { action: 'MONITOR', color: 'text-gray-600', icon: <Clock className="h-3 w-3" /> };
  };

  const handleTradeClick = (action: string, symbol: string) => {
    setSelectedAction({ symbol, action });
    onTradeAction(action, symbol);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
  };

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No positions found</p>
            <p className="text-sm text-muted-foreground mt-2">Connect your Alpaca account to see your holdings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Current Holdings ({positions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => {
            const squeezeScore = getSqueezeScore(position.symbol);
            const pnlPercent = parseFloat(position.unrealized_plpc || 0);
            const pnlAmount = parseFloat(position.unrealized_pl || 0);
            const marketValue = parseFloat(position.market_value || 0);
            const quantity = parseFloat(position.qty || 0);
            const avgPrice = parseFloat(position.avg_entry_price || 0);
            const currentPrice = parseFloat(position.current_price || 0);
            const recommendation = getRecommendation(position, squeezeScore);
            const candidate = candidates.find(c => c.symbol === position.symbol);

            return (
              <div key={position.symbol} className="border rounded-lg p-4 space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-lg">{position.symbol}</div>
                    <Badge className={getSqueezeColor(squeezeScore)}>
                      {getSqueezeIcon(squeezeScore)} {squeezeScore}/100
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {getSqueezeLabel(squeezeScore)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-medium ${recommendation.color}`}>
                      {recommendation.icon}
                      {recommendation.action}
                    </div>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Position</div>
                    <div className="font-medium">{quantity.toFixed(2)} shares</div>
                    <div className="text-xs text-muted-foreground">@ {formatCurrency(avgPrice)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Current Value</div>
                    <div className="font-medium">{formatCurrency(marketValue)}</div>
                    <div className="text-xs text-muted-foreground">@ {formatCurrency(currentPrice)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">P&L</div>
                    <div className={`font-medium ${pnlAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(pnlAmount)}
                    </div>
                    <div className={`text-xs ${pnlAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(pnlPercent)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Volume</div>
                    <div className="font-medium">{candidate?.volume?.toLocaleString() || 'N/A'}</div>
                    <div className={`text-xs ${candidate?.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {candidate?.changePercent ? `${candidate.changePercent >= 0 ? '+' : ''}${candidate.changePercent.toFixed(2)}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                {candidate?.ai_reasoning && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-blue-900">AI Analysis</div>
                        <div className="text-sm text-blue-700">{candidate.ai_reasoning}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTradeClick('SELL', position.symbol)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Sell
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTradeClick('HOLD', position.symbol)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Hold
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTradeClick('ADD', position.symbol)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                  
                  {/* Squeeze Score Progress */}
                  <div className="flex-1 ml-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Squeeze:</span>
                      <Progress value={squeezeScore} className="flex-1 h-2" />
                      <span className="text-xs font-medium">{squeezeScore}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}