import AIMemorySystem from './memorySystem';

interface MarketPattern {
  pattern_name: string;
  pattern_type: 'squeeze_setup' | 'breakout' | 'reversal' | 'continuation';
  features: {
    short_interest_range: [number, number];
    days_to_cover_range: [number, number];
    volume_ratio_range: [number, number];
    price_action: string;
    market_conditions: string;
    sentiment: string;
  };
  performance: {
    occurrences: number;
    success_rate: number;
    avg_return: number;
    avg_hold_period: number;
    confidence_score: number;
  };
}

interface PatternMatch {
  pattern: MarketPattern;
  match_score: number;
  confidence: number;
  predicted_outcome: {
    expected_return: number;
    probability_of_success: number;
    expected_hold_period: number;
    risk_level: 'low' | 'medium' | 'high';
  };
}

interface StockAnalysis {
  symbol: string;
  current_metrics: any;
  pattern_matches: PatternMatch[];
  overall_prediction: {
    squeeze_probability: number;
    expected_return: number;
    risk_assessment: string;
    confidence_level: number;
  };
}

class PatternRecognitionEngine {
  private memorySystem: AIMemorySystem;
  private knownPatterns: Map<string, MarketPattern>;
  private readonly MIN_PATTERN_OCCURRENCES = 5;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.6;

  constructor() {
    this.memorySystem = new AIMemorySystem();
    this.knownPatterns = new Map();
    this.initializePatterns();
  }

  private async initializePatterns(): Promise<void> {
    // Load existing patterns from database
    await this.loadPatternsFromDatabase();
    
    // If no patterns exist, create initial patterns from historical data
    if (this.knownPatterns.size === 0) {
      await this.discoverInitialPatterns();
    }
  }

  private async loadPatternsFromDatabase(): Promise<void> {
    // This would load from the market_patterns table
    // For now, we'll start with empty patterns and build them from data
    console.log('Loading patterns from database...');
  }

  // Discover patterns from historical recommendation data
  async discoverInitialPatterns(): Promise<void> {
    const recommendations = await this.memorySystem.getRecentRecommendations(90);
    const trackedRecs = recommendations.filter(r => r.outcome_tracked);
    
    if (trackedRecs.length < this.MIN_PATTERN_OCCURRENCES) {
      console.log('Insufficient historical data for pattern discovery');
      return;
    }

    // Group recommendations by similar characteristics
    const patternGroups = this.groupSimilarRecommendations(trackedRecs);
    
    // Create patterns from groups with sufficient data
    for (const [groupKey, group] of patternGroups) {
      if (group.length >= this.MIN_PATTERN_OCCURRENCES) {
        const pattern = this.createPatternFromGroup(groupKey, group);
        this.knownPatterns.set(pattern.pattern_name, pattern);
      }
    }
    
    console.log(`Discovered ${this.knownPatterns.size} initial patterns`);
  }

  private groupSimilarRecommendations(recommendations: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    for (const rec of recommendations) {
      const marketConditions = rec.market_conditions ? JSON.parse(rec.market_conditions) : {};
      const groupKey = this.generateGroupKey(marketConditions, rec.outcome_type);
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(rec);
    }
    
    return groups;
  }

  private generateGroupKey(marketConditions: any, outcome: string): string {
    // Create a key based on market condition ranges
    const shortInterestBucket = this.bucketValue(marketConditions.short_interest || 0, [0, 25, 50, 75, 100]);
    const daysToCoverBucket = this.bucketValue(marketConditions.days_to_cover || 0, [0, 2, 5, 10, 20]);
    const volumeRatioBucket = this.bucketValue(marketConditions.volume_ratio || 0, [0, 1.5, 3, 5, 10]);
    
    return `${shortInterestBucket}_${daysToCoverBucket}_${volumeRatioBucket}_${outcome}`;
  }

  private bucketValue(value: number, buckets: number[]): string {
    for (let i = 0; i < buckets.length - 1; i++) {
      if (value >= buckets[i] && value < buckets[i + 1]) {
        return `${buckets[i]}-${buckets[i + 1]}`;
      }
    }
    return `${buckets[buckets.length - 1]}+`;
  }

  private createPatternFromGroup(groupKey: string, group: any[]): MarketPattern {
    const successfulRecs = group.filter(r => r.outcome_type === 'profitable');
    const avgReturn = group.reduce((sum, r) => sum + (r.outcome_return || 0), 0) / group.length;
    const avgHoldPeriod = group.reduce((sum, r) => sum + (r.days_to_outcome || 0), 0) / group.length;
    
    // Calculate feature ranges
    const shortInterestValues = group.map(r => {
      const mc = r.market_conditions ? JSON.parse(r.market_conditions) : {};
      return mc.short_interest || 0;
    });
    
    const daysToCoverValues = group.map(r => {
      const mc = r.market_conditions ? JSON.parse(r.market_conditions) : {};
      return mc.days_to_cover || 0;
    });
    
    const volumeRatioValues = group.map(r => {
      const mc = r.market_conditions ? JSON.parse(r.market_conditions) : {};
      return mc.volume_ratio || 0;
    });
    
    const pattern: MarketPattern = {
      pattern_name: `pattern_${groupKey}`,
      pattern_type: this.determinePatternType(group),
      features: {
        short_interest_range: [Math.min(...shortInterestValues), Math.max(...shortInterestValues)],
        days_to_cover_range: [Math.min(...daysToCoverValues), Math.max(...daysToCoverValues)],
        volume_ratio_range: [Math.min(...volumeRatioValues), Math.max(...volumeRatioValues)],
        price_action: this.analyzePriceAction(group),
        market_conditions: this.analyzeMarketConditions(group),
        sentiment: 'neutral' // Placeholder for sentiment analysis
      },
      performance: {
        occurrences: group.length,
        success_rate: successfulRecs.length / group.length,
        avg_return: avgReturn,
        avg_hold_period: avgHoldPeriod,
        confidence_score: this.calculateConfidenceScore(group)
      }
    };
    
    return pattern;
  }

  private determinePatternType(group: any[]): 'squeeze_setup' | 'breakout' | 'reversal' | 'continuation' {
    // Simple heuristic based on market conditions
    const avgShortInterest = group.reduce((sum, r) => {
      const mc = r.market_conditions ? JSON.parse(r.market_conditions) : {};
      return sum + (mc.short_interest || 0);
    }, 0) / group.length;
    
    if (avgShortInterest >= 30) return 'squeeze_setup';
    if (avgShortInterest >= 15) return 'breakout';
    return 'continuation';
  }

  private analyzePriceAction(group: any[]): string {
    // Analyze common price action characteristics
    const priceChanges = group.map(r => {
      const mc = r.market_conditions ? JSON.parse(r.market_conditions) : {};
      return mc.price_change || 0;
    });
    
    const avgPriceChange = priceChanges.reduce((sum, pc) => sum + pc, 0) / priceChanges.length;
    
    if (avgPriceChange > 0.05) return 'strong_uptrend';
    if (avgPriceChange > 0.02) return 'moderate_uptrend';
    if (avgPriceChange > -0.02) return 'sideways';
    return 'downtrend';
  }

  private analyzeMarketConditions(group: any[]): string {
    // Analyze overall market conditions during successful trades
    // This would integrate with broader market data
    return 'mixed'; // Placeholder
  }

  private calculateConfidenceScore(group: any[]): number {
    const sampleSize = group.length;
    const successfulRecs = group.filter(r => r.outcome_type === 'profitable').length;
    const successRate = successfulRecs / sampleSize;
    
    // Confidence based on sample size and success rate
    const sampleSizeScore = Math.min(1, sampleSize / 20); // More confidence with larger samples
    const successRateScore = successRate; // Higher success rate = more confidence
    
    return (sampleSizeScore + successRateScore) / 2;
  }

  // Analyze a stock against known patterns
  async analyzeStock(symbol: string, currentMetrics: any): Promise<StockAnalysis> {
    const stockMemory = await this.memorySystem.getStockMemory(symbol);
    const patternMatches: PatternMatch[] = [];
    
    // Check against all known patterns
    for (const [patternName, pattern] of this.knownPatterns) {
      const matchScore = this.calculatePatternMatch(currentMetrics, pattern);
      
      if (matchScore >= this.MIN_CONFIDENCE_THRESHOLD) {
        const match: PatternMatch = {
          pattern: pattern,
          match_score: matchScore,
          confidence: pattern.performance.confidence_score,
          predicted_outcome: {
            expected_return: pattern.performance.avg_return,
            probability_of_success: pattern.performance.success_rate,
            expected_hold_period: pattern.performance.avg_hold_period,
            risk_level: this.assessRiskLevel(pattern)
          }
        };
        
        patternMatches.push(match);
      }
    }
    
    // Sort by match score
    patternMatches.sort((a, b) => b.match_score - a.match_score);
    
    // Generate overall prediction
    const overallPrediction = this.generateOverallPrediction(patternMatches, stockMemory);
    
    return {
      symbol,
      current_metrics: currentMetrics,
      pattern_matches: patternMatches,
      overall_prediction: overallPrediction
    };
  }

  private calculatePatternMatch(currentMetrics: any, pattern: MarketPattern): number {
    let matchScore = 0;
    let totalWeight = 0;
    
    // Short interest match
    const shortInterestWeight = 0.3;
    const shortInterestMatch = this.calculateRangeMatch(
      currentMetrics.shortInt || 0,
      pattern.features.short_interest_range
    );
    matchScore += shortInterestMatch * shortInterestWeight;
    totalWeight += shortInterestWeight;
    
    // Days to cover match
    const daysToCoverWeight = 0.25;
    const daysToCoverMatch = this.calculateRangeMatch(
      currentMetrics.daysToCover || 0,
      pattern.features.days_to_cover_range
    );
    matchScore += daysToCoverMatch * daysToCoverWeight;
    totalWeight += daysToCoverWeight;
    
    // Volume ratio match
    const volumeWeight = 0.2;
    const volumeMatch = this.calculateRangeMatch(
      currentMetrics.volumeRatio || 0,
      pattern.features.volume_ratio_range
    );
    matchScore += volumeMatch * volumeWeight;
    totalWeight += volumeWeight;
    
    // Price action match (simplified)
    const priceActionWeight = 0.15;
    const priceActionMatch = this.calculatePriceActionMatch(
      currentMetrics,
      pattern.features.price_action
    );
    matchScore += priceActionMatch * priceActionWeight;
    totalWeight += priceActionWeight;
    
    // Market conditions match (simplified)
    const marketConditionsWeight = 0.1;
    matchScore += 0.5 * marketConditionsWeight; // Neutral match
    totalWeight += marketConditionsWeight;
    
    return totalWeight > 0 ? matchScore / totalWeight : 0;
  }

  private calculateRangeMatch(value: number, range: [number, number]): number {
    const [min, max] = range;
    if (value >= min && value <= max) return 1.0;
    
    // Partial match for values close to range
    const rangeSize = max - min;
    const tolerance = rangeSize * 0.2; // 20% tolerance
    
    if (value < min) {
      const distance = min - value;
      return Math.max(0, 1 - distance / tolerance);
    } else {
      const distance = value - max;
      return Math.max(0, 1 - distance / tolerance);
    }
  }

  private calculatePriceActionMatch(currentMetrics: any, expectedPriceAction: string): number {
    const currentPriceChange = currentMetrics.priceChange || 0;
    
    switch (expectedPriceAction) {
      case 'strong_uptrend':
        return currentPriceChange > 0.05 ? 1.0 : Math.max(0, currentPriceChange * 20);
      case 'moderate_uptrend':
        return currentPriceChange > 0.02 ? 1.0 : Math.max(0, currentPriceChange * 50);
      case 'sideways':
        return Math.abs(currentPriceChange) < 0.02 ? 1.0 : Math.max(0, 1 - Math.abs(currentPriceChange) * 25);
      case 'downtrend':
        return currentPriceChange < -0.02 ? 1.0 : Math.max(0, -currentPriceChange * 50);
      default:
        return 0.5; // Neutral match
    }
  }

  private assessRiskLevel(pattern: MarketPattern): 'low' | 'medium' | 'high' {
    const successRate = pattern.performance.success_rate;
    const avgReturn = pattern.performance.avg_return;
    const occurrences = pattern.performance.occurrences;
    
    if (successRate >= 0.7 && avgReturn >= 0.1 && occurrences >= 10) return 'low';
    if (successRate >= 0.5 && avgReturn >= 0.05 && occurrences >= 5) return 'medium';
    return 'high';
  }

  private generateOverallPrediction(
    patternMatches: PatternMatch[],
    stockMemory: any
  ): StockAnalysis['overall_prediction'] {
    if (patternMatches.length === 0) {
      return {
        squeeze_probability: 0.1,
        expected_return: 0,
        risk_assessment: 'No matching patterns found',
        confidence_level: 0.1
      };
    }
    
    // Weight predictions by match score and confidence
    let totalWeight = 0;
    let weightedProbability = 0;
    let weightedReturn = 0;
    
    for (const match of patternMatches) {
      const weight = match.match_score * match.confidence;
      totalWeight += weight;
      weightedProbability += match.predicted_outcome.probability_of_success * weight;
      weightedReturn += match.predicted_outcome.expected_return * weight;
    }
    
    const avgProbability = totalWeight > 0 ? weightedProbability / totalWeight : 0;
    const avgReturn = totalWeight > 0 ? weightedReturn / totalWeight : 0;
    
    // Factor in stock's historical performance
    const stockSuccessRate = stockMemory ? 
      (stockMemory.successful_recommendations / Math.max(1, stockMemory.total_recommendations)) : 0.5;
    
    const adjustedProbability = (avgProbability * 0.7 + stockSuccessRate * 0.3);
    const adjustedReturn = stockMemory ? 
      (avgReturn * 0.8 + stockMemory.avg_recommendation_return * 0.2) : avgReturn;
    
    return {
      squeeze_probability: adjustedProbability,
      expected_return: adjustedReturn,
      risk_assessment: this.generateRiskAssessment(patternMatches, adjustedProbability),
      confidence_level: Math.min(0.9, totalWeight / patternMatches.length)
    };
  }

  private generateRiskAssessment(patternMatches: PatternMatch[], probability: number): string {
    const riskLevels = patternMatches.map(m => m.predicted_outcome.risk_level);
    const highRisk = riskLevels.filter(r => r === 'high').length;
    const mediumRisk = riskLevels.filter(r => r === 'medium').length;
    const lowRisk = riskLevels.filter(r => r === 'low').length;
    
    if (probability < 0.3) return 'High risk - Low probability of success';
    if (highRisk > lowRisk) return 'High risk - Conflicting patterns';
    if (mediumRisk > lowRisk) return 'Medium risk - Mixed signals';
    return 'Low risk - Consistent positive patterns';
  }

  // Update patterns with new data
  async updatePatterns(newRecommendations: any[]): Promise<void> {
    const trackedRecs = newRecommendations.filter(r => r.outcome_tracked);
    
    if (trackedRecs.length === 0) return;
    
    // Update existing patterns or create new ones
    const patternGroups = this.groupSimilarRecommendations(trackedRecs);
    
    for (const [groupKey, group] of patternGroups) {
      const patternName = `pattern_${groupKey}`;
      
      if (this.knownPatterns.has(patternName)) {
        // Update existing pattern
        await this.updateExistingPattern(patternName, group);
      } else if (group.length >= this.MIN_PATTERN_OCCURRENCES) {
        // Create new pattern
        const newPattern = this.createPatternFromGroup(groupKey, group);
        this.knownPatterns.set(patternName, newPattern);
      }
    }
    
    console.log(`Updated patterns, now tracking ${this.knownPatterns.size} patterns`);
  }

  private async updateExistingPattern(patternName: string, newData: any[]): Promise<void> {
    const existingPattern = this.knownPatterns.get(patternName);
    if (!existingPattern) return;
    
    // Merge new data with existing pattern
    const updatedOccurrences = existingPattern.performance.occurrences + newData.length;
    const successfulNew = newData.filter(r => r.outcome_type === 'profitable').length;
    const newSuccessRate = (existingPattern.performance.success_rate * existingPattern.performance.occurrences + successfulNew) / updatedOccurrences;
    
    const newAvgReturn = newData.reduce((sum, r) => sum + (r.outcome_return || 0), 0) / newData.length;
    const updatedAvgReturn = (existingPattern.performance.avg_return * existingPattern.performance.occurrences + newAvgReturn * newData.length) / updatedOccurrences;
    
    existingPattern.performance.occurrences = updatedOccurrences;
    existingPattern.performance.success_rate = newSuccessRate;
    existingPattern.performance.avg_return = updatedAvgReturn;
    existingPattern.performance.confidence_score = this.calculateConfidenceScore([...newData]);
    
    this.knownPatterns.set(patternName, existingPattern);
  }

  // Get all known patterns
  getKnownPatterns(): MarketPattern[] {
    return Array.from(this.knownPatterns.values());
  }

  // Get pattern performance summary
  getPatternSummary(): any {
    const patterns = Array.from(this.knownPatterns.values());
    
    return {
      total_patterns: patterns.length,
      best_performing: patterns.sort((a, b) => b.performance.success_rate - a.performance.success_rate).slice(0, 5),
      most_reliable: patterns.sort((a, b) => b.performance.confidence_score - a.performance.confidence_score).slice(0, 5),
      most_frequent: patterns.sort((a, b) => b.performance.occurrences - a.performance.occurrences).slice(0, 5)
    };
  }
}

export default PatternRecognitionEngine;