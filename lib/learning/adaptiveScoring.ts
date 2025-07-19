import AIMemorySystem from './memorySystem';

interface ScoringWeights {
  shortInterestWeight: number;
  daysToCoverWeight: number;
  borrowRateWeight: number;
  volumeWeight: number;
  floatWeight: number;
  priceActionWeight: number;
  sentimentWeight: number;
}

interface ScoringThresholds {
  minShortInterest: number;
  minDaysToCover: number;
  minBorrowRate: number;
  minVolumeRatio: number;
  minScoreThreshold: number;
}

interface StrategyParameters {
  weights: ScoringWeights;
  thresholds: ScoringThresholds;
  version: number;
  performance: {
    recommendations_count: number;
    successful_recommendations: number;
    total_return: number;
    avg_return: number;
    win_rate: number;
    sharpe_ratio: number;
  };
}

interface OptimizationResult {
  improved_parameters: StrategyParameters;
  performance_improvement: number;
  confidence_score: number;
  optimization_method: string;
  backtest_results: any;
}

class AdaptiveScoringSystem {
  private memorySystem: AIMemorySystem;
  private currentParameters: StrategyParameters;
  private readonly LEARNING_RATE = 0.1;
  private readonly MIN_SAMPLES_FOR_OPTIMIZATION = 20;

  constructor() {
    this.memorySystem = new AIMemorySystem();
    this.currentParameters = this.getDefaultParameters();
    this.loadLatestParameters();
  }

  private getDefaultParameters(): StrategyParameters {
    return {
      weights: {
        shortInterestWeight: 0.25,
        daysToCoverWeight: 0.20,
        borrowRateWeight: 0.15,
        volumeWeight: 0.15,
        floatWeight: 0.10,
        priceActionWeight: 0.10,
        sentimentWeight: 0.05
      },
      thresholds: {
        minShortInterest: 8.0,
        minDaysToCover: 1.0,
        minBorrowRate: 0.0,
        minVolumeRatio: 1.2,
        minScoreThreshold: 40.0
      },
      version: 1,
      performance: {
        recommendations_count: 0,
        successful_recommendations: 0,
        total_return: 0.0,
        avg_return: 0.0,
        win_rate: 0.0,
        sharpe_ratio: 0.0
      }
    };
  }

  private async loadLatestParameters(): Promise<void> {
    try {
      // This would query the strategy_parameters table for the latest active parameters
      // For now, we'll start with defaults
      console.log('Loaded default scoring parameters');
    } catch (error) {
      console.error('Error loading parameters:', error);
    }
  }

  // Calculate adaptive squeeze score based on current parameters
  calculateAdaptiveScore(stockData: any): number {
    const weights = this.currentParameters.weights;
    const thresholds = this.currentParameters.thresholds;
    
    // Normalize each metric to 0-100 scale
    const shortInterestScore = this.normalizeMetric(
      stockData.shortInt || 0,
      0,
      100,
      thresholds.minShortInterest
    );
    
    const daysToCoverScore = this.normalizeMetric(
      stockData.daysToCover || 0,
      0,
      10,
      thresholds.minDaysToCover
    );
    
    const borrowRateScore = this.normalizeMetric(
      stockData.borrowRate || 0,
      0,
      200,
      thresholds.minBorrowRate
    );
    
    const volumeScore = this.normalizeMetric(
      stockData.volumeRatio || 0,
      0,
      10,
      thresholds.minVolumeRatio
    );
    
    const floatScore = this.normalizeFloatScore(stockData.float || 0);
    const priceActionScore = this.calculatePriceActionScore(stockData);
    const sentimentScore = this.calculateSentimentScore(stockData);
    
    // Weighted combination
    const totalScore = (
      shortInterestScore * weights.shortInterestWeight +
      daysToCoverScore * weights.daysToCoverWeight +
      borrowRateScore * weights.borrowRateWeight +
      volumeScore * weights.volumeWeight +
      floatScore * weights.floatWeight +
      priceActionScore * weights.priceActionWeight +
      sentimentScore * weights.sentimentWeight
    ) * 100;
    
    return Math.round(Math.min(100, Math.max(0, totalScore)));
  }

  private normalizeMetric(value: number, min: number, max: number, threshold: number): number {
    if (value < threshold) return 0;
    return Math.min(1, (value - min) / (max - min));
  }

  private normalizeFloatScore(floatValue: number): number {
    // Smaller float = higher score (more squeeze potential)
    if (floatValue <= 0) return 0;
    if (floatValue < 50_000_000) return 1; // < 50M shares = excellent
    if (floatValue < 100_000_000) return 0.8; // < 100M shares = good
    if (floatValue < 500_000_000) return 0.6; // < 500M shares = average
    return 0.2; // > 500M shares = poor
  }

  private calculatePriceActionScore(stockData: any): number {
    // Combine multiple price action indicators
    let score = 0;
    
    // Recent price momentum
    if (stockData.priceChange > 0) score += 0.3;
    if (stockData.priceChange > 0.05) score += 0.2; // > 5% gain
    
    // Volume confirmation
    if (stockData.volumeRatio > 2) score += 0.3;
    if (stockData.volumeRatio > 5) score += 0.2; // > 5x volume
    
    return Math.min(1, score);
  }

  private calculateSentimentScore(stockData: any): number {
    // Placeholder for sentiment analysis
    // This would integrate with social media sentiment, news analysis, etc.
    return 0.5; // Neutral sentiment
  }

  // Learn from recommendation outcomes and optimize parameters
  async optimizeParameters(): Promise<OptimizationResult | null> {
    const performanceData = await this.memorySystem.getRecommendationPerformance();
    
    if (performanceData.total_recommendations < this.MIN_SAMPLES_FOR_OPTIMIZATION) {
      console.log('Insufficient data for parameter optimization');
      return null;
    }
    
    const optimizationResult = await this.performOptimization(performanceData);
    
    if (optimizationResult && optimizationResult.performance_improvement > 0.05) {
      // If improvement is significant (>5%), update parameters
      await this.updateParameters(optimizationResult.improved_parameters);
      console.log(`Parameters optimized: ${(optimizationResult.performance_improvement * 100).toFixed(2)}% improvement`);
    }
    
    return optimizationResult;
  }

  private async performOptimization(performanceData: any): Promise<OptimizationResult> {
    // Get historical recommendations with outcomes
    const recommendations = await this.memorySystem.getRecentRecommendations(90);
    const successfulRecs = recommendations.filter(r => r.outcome_type === 'profitable');
    const failedRecs = recommendations.filter(r => r.outcome_type === 'unprofitable');
    
    // Analyze what conditions led to success vs failure
    const successPatterns = this.analyzeSuccessPatterns(successfulRecs);
    const failurePatterns = this.analyzeFailurePatterns(failedRecs);
    
    // Generate optimized parameters
    const optimizedWeights = this.optimizeWeights(successPatterns, failurePatterns);
    const optimizedThresholds = this.optimizeThresholds(successPatterns, failurePatterns);
    
    const improvedParameters: StrategyParameters = {
      weights: optimizedWeights,
      thresholds: optimizedThresholds,
      version: this.currentParameters.version + 1,
      performance: {
        recommendations_count: 0,
        successful_recommendations: 0,
        total_return: 0.0,
        avg_return: 0.0,
        win_rate: 0.0,
        sharpe_ratio: 0.0
      }
    };
    
    // Backtest the improved parameters
    const backtestResults = await this.backtestParameters(improvedParameters, recommendations);
    
    return {
      improved_parameters: improvedParameters,
      performance_improvement: backtestResults.improvement_vs_current,
      confidence_score: backtestResults.confidence,
      optimization_method: 'pattern_analysis',
      backtest_results: backtestResults
    };
  }

  private analyzeSuccessPatterns(successfulRecs: any[]): any {
    // Analyze common characteristics of successful recommendations
    const patterns = {
      avg_short_interest: 0,
      avg_days_to_cover: 0,
      avg_volume_ratio: 0,
      common_conditions: {}
    };
    
    if (successfulRecs.length === 0) return patterns;
    
    successfulRecs.forEach(rec => {
      const marketConditions = rec.market_conditions ? JSON.parse(rec.market_conditions) : {};
      patterns.avg_short_interest += marketConditions.short_interest || 0;
      patterns.avg_days_to_cover += marketConditions.days_to_cover || 0;
      patterns.avg_volume_ratio += marketConditions.volume_ratio || 0;
    });
    
    const count = successfulRecs.length;
    patterns.avg_short_interest /= count;
    patterns.avg_days_to_cover /= count;
    patterns.avg_volume_ratio /= count;
    
    return patterns;
  }

  private analyzeFailurePatterns(failedRecs: any[]): any {
    // Analyze common characteristics of failed recommendations
    const patterns = {
      avg_short_interest: 0,
      avg_days_to_cover: 0,
      avg_volume_ratio: 0,
      common_conditions: {}
    };
    
    if (failedRecs.length === 0) return patterns;
    
    failedRecs.forEach(rec => {
      const marketConditions = rec.market_conditions ? JSON.parse(rec.market_conditions) : {};
      patterns.avg_short_interest += marketConditions.short_interest || 0;
      patterns.avg_days_to_cover += marketConditions.days_to_cover || 0;
      patterns.avg_volume_ratio += marketConditions.volume_ratio || 0;
    });
    
    const count = failedRecs.length;
    patterns.avg_short_interest /= count;
    patterns.avg_days_to_cover /= count;
    patterns.avg_volume_ratio /= count;
    
    return patterns;
  }

  private optimizeWeights(successPatterns: any, failurePatterns: any): ScoringWeights {
    const currentWeights = this.currentParameters.weights;
    const learningRate = this.LEARNING_RATE;
    
    // Adjust weights based on which metrics were more predictive of success
    const optimizedWeights = { ...currentWeights };
    
    // If successful recommendations had higher short interest, increase that weight
    if (successPatterns.avg_short_interest > failurePatterns.avg_short_interest) {
      optimizedWeights.shortInterestWeight = Math.min(0.4, 
        optimizedWeights.shortInterestWeight + learningRate * 0.1);
    }
    
    // Similar logic for other metrics
    if (successPatterns.avg_days_to_cover > failurePatterns.avg_days_to_cover) {
      optimizedWeights.daysToCoverWeight = Math.min(0.3, 
        optimizedWeights.daysToCoverWeight + learningRate * 0.1);
    }
    
    if (successPatterns.avg_volume_ratio > failurePatterns.avg_volume_ratio) {
      optimizedWeights.volumeWeight = Math.min(0.3, 
        optimizedWeights.volumeWeight + learningRate * 0.1);
    }
    
    // Normalize weights to sum to 1
    const totalWeight = Object.values(optimizedWeights).reduce((sum, w) => sum + w, 0);
    Object.keys(optimizedWeights).forEach(key => {
      optimizedWeights[key as keyof ScoringWeights] /= totalWeight;
    });
    
    return optimizedWeights;
  }

  private optimizeThresholds(successPatterns: any, failurePatterns: any): ScoringThresholds {
    const currentThresholds = this.currentParameters.thresholds;
    
    // Adjust thresholds based on success patterns
    return {
      minShortInterest: Math.max(15, Math.min(40, successPatterns.avg_short_interest * 0.8)),
      minDaysToCover: Math.max(2, Math.min(5, successPatterns.avg_days_to_cover * 0.8)),
      minBorrowRate: currentThresholds.minBorrowRate, // Keep stable for now
      minVolumeRatio: Math.max(1.5, Math.min(3, successPatterns.avg_volume_ratio * 0.8)),
      minScoreThreshold: currentThresholds.minScoreThreshold
    };
  }

  private async backtestParameters(parameters: StrategyParameters, historicalData: any[]): Promise<any> {
    // Simulate how the new parameters would have performed on historical data
    let totalReturn = 0;
    let successCount = 0;
    const totalRecs = historicalData.filter(r => r.outcome_tracked).length;
    
    for (const rec of historicalData) {
      if (!rec.outcome_tracked) continue;
      
      const marketConditions = rec.market_conditions ? JSON.parse(rec.market_conditions) : {};
      const newScore = this.calculateScoreWithParameters(marketConditions, parameters);
      
      // Would we have recommended this with new parameters?
      if (newScore >= parameters.thresholds.minScoreThreshold) {
        totalReturn += rec.outcome_return || 0;
        if (rec.outcome_type === 'profitable') successCount++;
      }
    }
    
    const avgReturn = totalRecs > 0 ? totalReturn / totalRecs : 0;
    const winRate = totalRecs > 0 ? successCount / totalRecs : 0;
    
    // Compare to current parameters performance
    const currentPerformance = this.currentParameters.performance;
    const improvementVsCurrent = avgReturn - currentPerformance.avg_return;
    
    return {
      avg_return: avgReturn,
      win_rate: winRate,
      total_return: totalReturn,
      improvement_vs_current: improvementVsCurrent,
      confidence: totalRecs >= 30 ? 0.8 : 0.5, // Higher confidence with more data
      recommendations_tested: totalRecs
    };
  }

  private calculateScoreWithParameters(marketConditions: any, parameters: StrategyParameters): number {
    // Calculate score using specific parameters (similar to calculateAdaptiveScore)
    const weights = parameters.weights;
    const thresholds = parameters.thresholds;
    
    const shortInterestScore = this.normalizeMetric(
      marketConditions.short_interest || 0,
      0,
      100,
      thresholds.minShortInterest
    );
    
    const daysToCoverScore = this.normalizeMetric(
      marketConditions.days_to_cover || 0,
      0,
      10,
      thresholds.minDaysToCover
    );
    
    const volumeScore = this.normalizeMetric(
      marketConditions.volume_ratio || 0,
      0,
      10,
      thresholds.minVolumeRatio
    );
    
    // Simplified calculation for backtesting
    const totalScore = (
      shortInterestScore * weights.shortInterestWeight +
      daysToCoverScore * weights.daysToCoverWeight +
      volumeScore * weights.volumeWeight +
      0.5 * (weights.floatWeight + weights.priceActionWeight + weights.sentimentWeight)
    ) * 100;
    
    return Math.round(Math.min(100, Math.max(0, totalScore)));
  }

  private async updateParameters(newParameters: StrategyParameters): Promise<void> {
    this.currentParameters = newParameters;
    
    // Save to database
    // This would insert into strategy_parameters table
    console.log('Updated scoring parameters to version', newParameters.version);
  }

  // Get current parameters for external use
  getCurrentParameters(): StrategyParameters {
    return { ...this.currentParameters };
  }

  // Get learning insights
  async getLearningInsights(): Promise<any> {
    const insights = await this.memorySystem.generateLearningInsights();
    
    return {
      current_parameters: this.currentParameters,
      learning_insights: insights,
      optimization_ready: insights.overall_performance.total_recommendations >= this.MIN_SAMPLES_FOR_OPTIMIZATION,
      last_optimization: new Date().toISOString()
    };
  }
}

export default AdaptiveScoringSystem;