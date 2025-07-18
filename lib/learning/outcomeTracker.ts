import { learningSystem } from './index';

interface TradeOutcome {
  symbol: string;
  entry_price: number;
  exit_price?: number;
  entry_date: Date;
  exit_date?: Date;
  position_size: number;
  recommendation_id?: number;
  outcome_type?: 'profitable' | 'unprofitable' | 'neutral';
  return_percentage?: number;
}

export class OutcomeTracker {
  private static instance: OutcomeTracker;
  private trackingInterval: NodeJS.Timeout | null = null;

  static getInstance(): OutcomeTracker {
    if (!OutcomeTracker.instance) {
      OutcomeTracker.instance = new OutcomeTracker();
    }
    return OutcomeTracker.instance;
  }

  async startTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    // Check outcomes every hour
    this.trackingInterval = setInterval(async () => {
      await this.checkAndUpdateOutcomes();
    }, 60 * 60 * 1000);

    // Initial check
    await this.checkAndUpdateOutcomes();
  }

  async checkAndUpdateOutcomes() {
    try {
      // Get all untracked recommendations from the last 30 days
      const recommendations = await learningSystem.memorySystem.getRecentRecommendations(30);
      const untrackedRecs = recommendations.filter(r => !r.outcome_tracked);

      for (const rec of untrackedRecs) {
        if (rec.recommendation_type === 'buy' || rec.recommendation_type === 'sell') {
          await this.updateRecommendationOutcome(rec);
        }
      }
    } catch (error) {
      console.error('Error checking outcomes:', error);
    }
  }

  private async updateRecommendationOutcome(recommendation: any) {
    try {
      // Get current price for the symbol
      const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${recommendation.symbol}?apikey=${process.env.FMP_API_KEY}`);
      const quoteData = await response.json();
      
      if (!quoteData || !quoteData[0]) {
        console.warn(`No quote data for ${recommendation.symbol}`);
        return;
      }

      const currentPrice = quoteData[0].price;
      const entryPrice = recommendation.market_conditions?.fill_price || 
                        recommendation.market_conditions?.current_price || 
                        currentPrice;

      // Calculate return based on recommendation type
      let returnPercentage = 0;
      let outcomeType: 'profitable' | 'unprofitable' | 'neutral' = 'neutral';

      if (recommendation.recommendation_type === 'buy') {
        returnPercentage = (currentPrice - entryPrice) / entryPrice;
      } else if (recommendation.recommendation_type === 'sell') {
        returnPercentage = (entryPrice - currentPrice) / entryPrice;
      }

      // Determine outcome type
      if (returnPercentage > 0.02) { // > 2% gain
        outcomeType = 'profitable';
      } else if (returnPercentage < -0.02) { // > 2% loss
        outcomeType = 'unprofitable';
      } else {
        outcomeType = 'neutral';
      }

      // Only update if the position has been held for at least 1 day
      const daysSinceRecommendation = (Date.now() - new Date(recommendation.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceRecommendation >= 1) {
        await learningSystem.memorySystem.updateRecommendationOutcome({
          recommendation_id: recommendation.id,
          outcome_type: outcomeType,
          outcome_return: returnPercentage,
          outcome_date: new Date(),
          outcome_notes: `Tracked outcome: ${(returnPercentage * 100).toFixed(2)}% return after ${daysSinceRecommendation.toFixed(1)} days`
        });

        // Update stock memory
        const stockMemory = await learningSystem.memorySystem.getStockMemory(recommendation.symbol);
        const updatedMemory = {
          times_recommended: (stockMemory?.times_recommended || 0) + 1,
          times_analyzed: (stockMemory?.times_analyzed || 0) + 1,
          total_recommendations: (stockMemory?.total_recommendations || 0) + 1,
          successful_recommendations: (stockMemory?.successful_recommendations || 0) + (outcomeType === 'profitable' ? 1 : 0),
          failed_recommendations: (stockMemory?.failed_recommendations || 0) + (outcomeType === 'unprofitable' ? 1 : 0),
          avg_recommendation_return: stockMemory ? 
            ((stockMemory.avg_recommendation_return * stockMemory.total_recommendations) + returnPercentage) / (stockMemory.total_recommendations + 1) :
            returnPercentage,
          best_return: Math.max(stockMemory?.best_return || 0, returnPercentage),
          worst_return: Math.min(stockMemory?.worst_return || 0, returnPercentage)
        };

        await learningSystem.memorySystem.updateStockMemory(recommendation.symbol, updatedMemory);

        console.log(`Updated outcome for ${recommendation.symbol}: ${outcomeType} (${(returnPercentage * 100).toFixed(2)}%)`);
      }
    } catch (error) {
      console.error(`Error updating outcome for recommendation ${recommendation.id}:`, error);
    }
  }

  async manualTrackOutcome(symbol: string, entryPrice: number, exitPrice: number, recommendationId?: number) {
    const returnPercentage = (exitPrice - entryPrice) / entryPrice;
    const outcomeType: 'profitable' | 'unprofitable' | 'neutral' = 
      returnPercentage > 0.02 ? 'profitable' : 
      returnPercentage < -0.02 ? 'unprofitable' : 'neutral';

    if (recommendationId) {
      await learningSystem.memorySystem.updateRecommendationOutcome({
        recommendation_id: recommendationId,
        outcome_type: outcomeType,
        outcome_return: returnPercentage,
        outcome_date: new Date(),
        outcome_notes: `Manual tracking: ${(returnPercentage * 100).toFixed(2)}% return`
      });
    }

    return {
      symbol,
      return_percentage: returnPercentage,
      outcome_type: outcomeType
    };
  }

  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }
}

export const outcomeTracker = OutcomeTracker.getInstance();