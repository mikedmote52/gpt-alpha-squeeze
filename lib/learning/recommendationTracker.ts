import AIMemorySystem from './memorySystem';
import { getQuote } from '../marketData';

interface TrackingData {
  symbol: string;
  entry_price: number;
  entry_date: Date;
  current_price?: number;
  max_price?: number;
  min_price?: number;
  recommendation_id: number;
}

interface OutcomeAnalysis {
  total_return: number;
  max_gain: number;
  max_loss: number;
  hold_period_days: number;
  outcome_type: 'profitable' | 'unprofitable' | 'neutral';
  performance_vs_market: number;
}

class RecommendationTracker {
  private memorySystem: AIMemorySystem;
  private trackingData: Map<string, TrackingData>;
  private readonly PROFIT_THRESHOLD = 0.05; // 5% profit threshold
  private readonly LOSS_THRESHOLD = -0.05; // 5% loss threshold

  constructor() {
    this.memorySystem = new AIMemorySystem();
    this.trackingData = new Map();
    this.loadActiveTrackingData();
  }

  // Load existing tracking data from database
  private async loadActiveTrackingData(): Promise<void> {
    try {
      const recentRecs = await this.memorySystem.getRecentRecommendations(30);
      const untrackedRecs = recentRecs.filter(r => !r.outcome_tracked);
      
      for (const rec of untrackedRecs) {
        if (rec.recommendation_type === 'buy' || rec.recommendation_type === 'watch') {
          // Try to get entry price from the recommendation context
          const marketConditions = rec.market_conditions ? JSON.parse(rec.market_conditions) : {};
          const entryPrice = marketConditions.current_price || await this.getHistoricalPrice(rec.symbol, rec.timestamp);
          
          if (entryPrice) {
            this.trackingData.set(`${rec.symbol}_${rec.id}`, {
              symbol: rec.symbol,
              entry_price: entryPrice,
              entry_date: new Date(rec.timestamp),
              recommendation_id: rec.id
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
    }
  }

  // Start tracking a new recommendation
  async startTracking(
    symbol: string,
    recommendationId: number,
    entryPrice?: number,
    entryDate?: Date
  ): Promise<void> {
    const price = entryPrice || await this.getCurrentPrice(symbol);
    const date = entryDate || new Date();
    
    if (!price) {
      console.warn(`Could not get price for ${symbol}, skipping tracking`);
      return;
    }

    const trackingKey = `${symbol}_${recommendationId}`;
    this.trackingData.set(trackingKey, {
      symbol,
      entry_price: price,
      entry_date: date,
      current_price: price,
      max_price: price,
      min_price: price,
      recommendation_id: recommendationId
    });

    console.log(`Started tracking ${symbol} at $${price} for recommendation ${recommendationId}`);
  }

  // Update tracking data with current market prices
  async updateTracking(): Promise<void> {
    const updates = Array.from(this.trackingData.entries());
    
    for (const [key, data] of updates) {
      try {
        const currentPrice = await this.getCurrentPrice(data.symbol);
        
        if (currentPrice) {
          data.current_price = currentPrice;
          data.max_price = Math.max(data.max_price || currentPrice, currentPrice);
          data.min_price = Math.min(data.min_price || currentPrice, currentPrice);
          
          // Check if we should close tracking based on performance
          const shouldClose = await this.shouldCloseTracking(data);
          
          if (shouldClose) {
            await this.closeTracking(key, data);
          }
        }
      } catch (error) {
        console.error(`Error updating tracking for ${data.symbol}:`, error);
      }
    }
  }

  // Determine if we should close tracking for a recommendation
  private async shouldCloseTracking(data: TrackingData): Promise<boolean> {
    if (!data.current_price) return false;
    
    const totalReturn = (data.current_price - data.entry_price) / data.entry_price;
    const daysSinceEntry = (Date.now() - data.entry_date.getTime()) / (1000 * 60 * 60 * 24);
    
    // Close conditions:
    // 1. Significant profit or loss
    // 2. Long holding period (30+ days)
    // 3. Extreme volatility
    
    const significantMove = Math.abs(totalReturn) >= 0.10; // 10% move
    const longHold = daysSinceEntry >= 30;
    const extremeVolatility = data.max_price && data.min_price && 
      (data.max_price - data.min_price) / data.entry_price >= 0.20; // 20% volatility
    
    return significantMove || longHold || extremeVolatility;
  }

  // Close tracking and record outcome
  async closeTracking(trackingKey: string, data: TrackingData): Promise<void> {
    if (!data.current_price) return;
    
    const outcome = this.analyzeOutcome(data);
    
    // Update recommendation outcome in database
    await this.memorySystem.updateRecommendationOutcome({
      recommendation_id: data.recommendation_id,
      outcome_type: outcome.outcome_type,
      outcome_return: outcome.total_return,
      outcome_date: new Date(),
      outcome_notes: `Tracked for ${outcome.hold_period_days} days`,
      max_gain: outcome.max_gain,
      max_loss: outcome.max_loss
    });

    // Update stock memory
    await this.updateStockMemory(data.symbol, outcome);
    
    // Remove from active tracking
    this.trackingData.delete(trackingKey);
    
    console.log(`Closed tracking for ${data.symbol}: ${outcome.outcome_type} (${(outcome.total_return * 100).toFixed(2)}%)`);
  }

  // Analyze the outcome of a tracked recommendation
  private analyzeOutcome(data: TrackingData): OutcomeAnalysis {
    const totalReturn = (data.current_price! - data.entry_price) / data.entry_price;
    const maxGain = data.max_price ? (data.max_price - data.entry_price) / data.entry_price : 0;
    const maxLoss = data.min_price ? (data.min_price - data.entry_price) / data.entry_price : 0;
    const holdPeriodDays = (Date.now() - data.entry_date.getTime()) / (1000 * 60 * 60 * 24);
    
    let outcomeType: 'profitable' | 'unprofitable' | 'neutral';
    if (totalReturn >= this.PROFIT_THRESHOLD) {
      outcomeType = 'profitable';
    } else if (totalReturn <= this.LOSS_THRESHOLD) {
      outcomeType = 'unprofitable';
    } else {
      outcomeType = 'neutral';
    }
    
    return {
      total_return: totalReturn,
      max_gain: maxGain,
      max_loss: maxLoss,
      hold_period_days: holdPeriodDays,
      outcome_type: outcomeType,
      performance_vs_market: totalReturn // Simplified, could compare to market index
    };
  }

  // Update stock memory with outcome data
  private async updateStockMemory(symbol: string, outcome: OutcomeAnalysis): Promise<void> {
    const existingMemory = await this.memorySystem.getStockMemory(symbol);
    
    const updatedMemory = {
      times_recommended: (existingMemory?.times_recommended || 0) + 1,
      times_analyzed: (existingMemory?.times_analyzed || 0) + 1,
      total_recommendations: (existingMemory?.total_recommendations || 0) + 1,
      successful_recommendations: (existingMemory?.successful_recommendations || 0) + 
        (outcome.outcome_type === 'profitable' ? 1 : 0),
      failed_recommendations: (existingMemory?.failed_recommendations || 0) + 
        (outcome.outcome_type === 'unprofitable' ? 1 : 0),
      avg_recommendation_return: this.calculateNewAverage(
        existingMemory?.avg_recommendation_return || 0,
        existingMemory?.total_recommendations || 0,
        outcome.total_return
      ),
      best_return: Math.max(existingMemory?.best_return || 0, outcome.total_return),
      worst_return: Math.min(existingMemory?.worst_return || 0, outcome.total_return),
      typical_hold_period: this.calculateNewAverage(
        existingMemory?.typical_hold_period || 0,
        existingMemory?.total_recommendations || 0,
        outcome.hold_period_days
      )
    };
    
    await this.memorySystem.updateStockMemory(symbol, updatedMemory);
  }

  // Calculate new average including new data point
  private calculateNewAverage(currentAvg: number, currentCount: number, newValue: number): number {
    return (currentAvg * currentCount + newValue) / (currentCount + 1);
  }

  // Get current price for a symbol
  private async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const quote = await getQuote(symbol);
      return quote.price || null;
    } catch (error) {
      console.error(`Error getting price for ${symbol}:`, error);
      return null;
    }
  }

  // Get historical price (placeholder - would need historical data API)
  private async getHistoricalPrice(symbol: string, date: string): Promise<number | null> {
    // This would integrate with a historical data API
    // For now, return null and rely on current price
    return null;
  }

  // Get current tracking status
  getActiveTracking(): Map<string, TrackingData> {
    return new Map(this.trackingData);
  }

  // Get performance summary
  async getPerformanceSummary(): Promise<any> {
    const insights = await this.memorySystem.generateLearningInsights();
    const activeTracking = this.getActiveTracking();
    
    return {
      active_tracking_count: activeTracking.size,
      active_symbols: Array.from(activeTracking.values()).map(t => t.symbol),
      overall_performance: insights.overall_performance,
      best_performing_stocks: insights.best_performing_stocks,
      worst_performing_stocks: insights.worst_performing_stocks,
      learning_insights: insights
    };
  }

  // Force close tracking for a specific recommendation
  async forceCloseTracking(recommendationId: number): Promise<void> {
    const entry = Array.from(this.trackingData.entries())
      .find(([key, data]) => data.recommendation_id === recommendationId);
    
    if (entry) {
      const [key, data] = entry;
      await this.closeTracking(key, data);
    }
  }

  // Batch update all tracking data
  async batchUpdate(): Promise<void> {
    console.log(`Updating tracking for ${this.trackingData.size} recommendations...`);
    await this.updateTracking();
    console.log('Tracking update completed');
  }
}

export default RecommendationTracker;