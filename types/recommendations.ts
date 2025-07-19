// AI Recommendation Types
// Surfaces the learning system's intelligence into actionable recommendations

export interface AIRecommendation {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
  confidence: number; // 0-100
  reasoning: string; // "Based on 15 similar patterns with 78% success rate..."
  expectedReturn: number; // Percentage expected return
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  thesis: string; // Detailed explanation of why this recommendation
  priceTarget: number;
  stopLoss: number;
  timeframe: string; // "1-2 weeks", "30 days", etc.
  createdAt: Date;
  status: 'ACTIVE' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED';
  
  // Pattern recognition context
  patternContext: {
    similarPatterns: number;
    historicalSuccessRate: number;
    averageReturn: number;
    confidenceFactors: string[];
  };
  
  // Market conditions at time of recommendation
  marketContext: {
    shortInterest: number;
    daysToCover: number;
    borrowRate: number;
    volumeRatio: number;
    squeezeScore: number;
  };
  
  // Position sizing recommendation
  positionSizing: {
    suggestedShares: number;
    suggestedDollarAmount: number;
    percentOfPortfolio: number;
    riskAmount: number; // Dollar risk if stop loss hit
  };
}

export interface StockThesis {
  symbol: string;
  currentThesis: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  thesisText: string;
  entryReason: string;
  exitStrategy: string;
  lastUpdated: Date;
  performanceVsThesis: 'ON_TRACK' | 'UNDERPERFORMING' | 'OUTPERFORMING';
  keyMetrics: {
    entryPrice: number;
    currentPrice: number;
    targetPrice: number;
    stopLoss: number;
    daysHeld: number;
    returnToDate: number;
  };
}

export interface PortfolioHealth {
  overallScore: number; // 0-100
  riskScore: number; // 0-100 (lower is better)
  diversificationScore: number; // 0-100
  momentumScore: number; // 0-100
  projectedReturn: number; // Expected portfolio return %
  projectedTimeframe: string;
  
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  
  sectorExposure: {
    sector: string;
    percentage: number;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
}