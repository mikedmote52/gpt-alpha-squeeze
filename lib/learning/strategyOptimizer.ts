import AIMemorySystem from './memorySystem';
import AdaptiveScoringSystem from './adaptiveScoring';
import PatternRecognitionEngine from './patternRecognition';
import RecommendationTracker from './recommendationTracker';

interface OptimizationReport {
  timestamp: Date;
  performance_summary: {
    total_recommendations: number;
    successful_recommendations: number;
    win_rate: number;
    avg_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
  };
  parameter_changes: {
    weight_adjustments: any;
    threshold_adjustments: any;
    improvement_expected: number;
  };
  pattern_insights: {
    new_patterns_discovered: number;
    updated_patterns: number;
    best_performing_pattern: string;
    worst_performing_pattern: string;
  };
  recommendations: {
    strategy_adjustments: string[];
    risk_warnings: string[];
    opportunities: string[];
  };
}

interface StrategyState {
  current_performance: any;
  parameter_history: any[];
  pattern_evolution: any[];
  optimization_frequency: number;
  last_optimization: Date;
  next_optimization_due: Date;
}

class StrategyOptimizer {
  private memorySystem: AIMemorySystem;
  private adaptiveScoring: AdaptiveScoringSystem;
  private patternEngine: PatternRecognitionEngine;
  private recommendationTracker: RecommendationTracker;
  private optimizationHistory: OptimizationReport[];
  private readonly OPTIMIZATION_INTERVAL_DAYS = 7; // Weekly optimization
  private readonly MIN_RECOMMENDATIONS_FOR_OPTIMIZATION = 15;

  constructor() {
    this.memorySystem = new AIMemorySystem();
    this.adaptiveScoring = new AdaptiveScoringSystem();
    this.patternEngine = new PatternRecognitionEngine();
    this.recommendationTracker = new RecommendationTracker();
    this.optimizationHistory = [];
  }

  // Main optimization loop
  async runOptimization(): Promise<OptimizationReport> {
    console.log('Starting strategy optimization...');
    
    const startTime = Date.now();
    const currentPerformance = await this.analyzeCurrentPerformance();
    
    // Check if optimization is needed
    if (!this.shouldOptimize(currentPerformance)) {
      console.log('Optimization not needed at this time');
      return this.createSkippedOptimizationReport(currentPerformance);
    }
    
    // Step 1: Update tracking data
    await this.recommendationTracker.batchUpdate();
    
    // Step 2: Optimize scoring parameters
    const scoringOptimization = await this.adaptiveScoring.optimizeParameters();
    
    // Step 3: Update pattern recognition
    const recentRecommendations = await this.memorySystem.getRecentRecommendations(30);
    await this.patternEngine.updatePatterns(recentRecommendations);
    
    // Step 4: Analyze pattern insights
    const patternInsights = await this.analyzePatternInsights();
    
    // Step 5: Generate optimization report
    const report = await this.generateOptimizationReport(
      currentPerformance,
      scoringOptimization,
      patternInsights
    );
    
    // Step 6: Save optimization results
    await this.saveOptimizationResults(report);
    
    const duration = Date.now() - startTime;
    console.log(`Strategy optimization completed in ${duration}ms`);
    
    return report;
  }

  private async analyzeCurrentPerformance(): Promise<any> {
    const performanceData = await this.memorySystem.getRecommendationPerformance();
    const trackingSummary = await this.recommendationTracker.getPerformanceSummary();
    
    return {
      ...performanceData,
      tracking_summary: trackingSummary,
      analysis_timestamp: new Date()
    };
  }

  private shouldOptimize(currentPerformance: any): boolean {
    // Check if we have enough data
    if (currentPerformance.total_recommendations < this.MIN_RECOMMENDATIONS_FOR_OPTIMIZATION) {
      return false;
    }
    
    // Check if it's time for scheduled optimization
    const lastOptimization = this.getLastOptimizationDate();
    const daysSinceOptimization = lastOptimization ? 
      (Date.now() - lastOptimization.getTime()) / (1000 * 60 * 60 * 24) : 999;
    
    if (daysSinceOptimization >= this.OPTIMIZATION_INTERVAL_DAYS) {
      return true;
    }
    
    // Check if performance has degraded significantly
    const recentWinRate = currentPerformance.win_rate;
    const historicalWinRate = this.getHistoricalWinRate();
    
    if (historicalWinRate && recentWinRate < historicalWinRate * 0.8) {
      console.log('Performance degradation detected, triggering optimization');
      return true;
    }
    
    return false;
  }

  private getLastOptimizationDate(): Date | null {
    if (this.optimizationHistory.length === 0) return null;
    return this.optimizationHistory[this.optimizationHistory.length - 1].timestamp;
  }

  private getHistoricalWinRate(): number | null {
    if (this.optimizationHistory.length === 0) return null;
    
    const recentReports = this.optimizationHistory.slice(-3); // Last 3 optimizations
    const avgWinRate = recentReports.reduce((sum, report) => 
      sum + report.performance_summary.win_rate, 0) / recentReports.length;
    
    return avgWinRate;
  }

  private async analyzePatternInsights(): Promise<any> {
    const patternSummary = this.patternEngine.getPatternSummary();
    const allPatterns = this.patternEngine.getKnownPatterns();
    
    // Find patterns that have changed significantly
    const updatedPatterns = allPatterns.filter(p => 
      p.performance.occurrences >= 5 && p.performance.confidence_score >= 0.6
    );
    
    // Identify best and worst performing patterns
    const sortedBySuccess = [...allPatterns].sort((a, b) => 
      b.performance.success_rate - a.performance.success_rate
    );
    
    return {
      total_patterns: allPatterns.length,
      new_patterns_discovered: updatedPatterns.length,
      updated_patterns: updatedPatterns.length,
      best_performing_pattern: sortedBySuccess[0]?.pattern_name || 'none',
      worst_performing_pattern: sortedBySuccess[sortedBySuccess.length - 1]?.pattern_name || 'none',
      pattern_distribution: this.analyzePatternDistribution(allPatterns),
      reliability_trends: this.analyzePatternReliabilityTrends(allPatterns)
    };
  }

  private analyzePatternDistribution(patterns: any[]): any {
    const distribution = {
      squeeze_setup: 0,
      breakout: 0,
      reversal: 0,
      continuation: 0
    };
    
    patterns.forEach(pattern => {
      if (pattern.pattern_type in distribution) {
        distribution[pattern.pattern_type as keyof typeof distribution]++;
      }
    });
    
    return distribution;
  }

  private analyzePatternReliabilityTrends(patterns: any[]): any {
    const reliablePatterns = patterns.filter(p => p.performance.confidence_score >= 0.7);
    const unreliablePatterns = patterns.filter(p => p.performance.confidence_score < 0.4);
    
    return {
      reliable_count: reliablePatterns.length,
      unreliable_count: unreliablePatterns.length,
      avg_confidence: patterns.reduce((sum, p) => sum + p.performance.confidence_score, 0) / patterns.length,
      trend: this.calculateConfidenceTrend(patterns)
    };
  }

  private calculateConfidenceTrend(patterns: any[]): 'improving' | 'stable' | 'declining' {
    // This would analyze confidence trends over time
    // For now, return stable as placeholder
    return 'stable';
  }

  private async generateOptimizationReport(
    currentPerformance: any,
    scoringOptimization: any,
    patternInsights: any
  ): Promise<OptimizationReport> {
    
    const report: OptimizationReport = {
      timestamp: new Date(),
      performance_summary: {
        total_recommendations: currentPerformance.total_recommendations,
        successful_recommendations: currentPerformance.profitable_count,
        win_rate: currentPerformance.win_rate,
        avg_return: currentPerformance.avg_return,
        sharpe_ratio: this.calculateSharpeRatio(currentPerformance),
        max_drawdown: this.calculateMaxDrawdown(currentPerformance)
      },
      parameter_changes: {
        weight_adjustments: scoringOptimization ? scoringOptimization.improved_parameters.weights : {},
        threshold_adjustments: scoringOptimization ? scoringOptimization.improved_parameters.thresholds : {},
        improvement_expected: scoringOptimization ? scoringOptimization.performance_improvement : 0
      },
      pattern_insights: patternInsights,
      recommendations: await this.generateRecommendations(currentPerformance, scoringOptimization, patternInsights)
    };
    
    return report;
  }

  private calculateSharpeRatio(performance: any): number {
    // Simplified Sharpe ratio calculation
    const avgReturn = performance.avg_return || 0;
    const riskFreeRate = 0.02; // 2% annual risk-free rate
    
    // Estimate volatility from return data (simplified)
    const volatility = Math.abs(avgReturn) * 2; // Rough estimate
    
    return volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
  }

  private calculateMaxDrawdown(performance: any): number {
    // This would calculate from historical return data
    // For now, return estimated drawdown
    return Math.abs(performance.avg_return) * 0.5; // Rough estimate
  }

  private async generateRecommendations(
    currentPerformance: any,
    scoringOptimization: any,
    patternInsights: any
  ): Promise<{ strategy_adjustments: string[]; risk_warnings: string[]; opportunities: string[] }> {
    
    const strategyAdjustments: string[] = [];
    const riskWarnings: string[] = [];
    const opportunities: string[] = [];
    
    // Analyze performance and generate recommendations
    if (currentPerformance.win_rate < 0.5) {
      strategyAdjustments.push('Consider tightening screening criteria to improve win rate');
      riskWarnings.push('Current win rate below 50% - review risk management');
    }
    
    if (currentPerformance.avg_return < 0.05) {
      strategyAdjustments.push('Focus on higher-conviction trades with better risk/reward ratios');
    }
    
    if (scoringOptimization && scoringOptimization.performance_improvement > 0.1) {
      strategyAdjustments.push('New scoring parameters show significant improvement potential');
      opportunities.push(`Expected performance improvement: ${(scoringOptimization.performance_improvement * 100).toFixed(1)}%`);
    }
    
    // Pattern-based recommendations
    if (patternInsights.new_patterns_discovered > 0) {
      opportunities.push(`${patternInsights.new_patterns_discovered} new trading patterns discovered`);
    }
    
    if (patternInsights.reliability_trends.unreliable_count > patternInsights.reliability_trends.reliable_count) {
      riskWarnings.push('High number of unreliable patterns - consider more conservative approach');
    }
    
    // Market condition recommendations
    const marketConditionRecommendations = this.generateMarketConditionRecommendations(currentPerformance);
    strategyAdjustments.push(...marketConditionRecommendations);
    
    return {
      strategy_adjustments: strategyAdjustments,
      risk_warnings: riskWarnings,
      opportunities: opportunities
    };
  }

  private generateMarketConditionRecommendations(performance: any): string[] {
    const recommendations: string[] = [];
    
    // This would analyze current market conditions and provide recommendations
    // For now, provide general recommendations based on performance
    
    if (performance.tracking_rate < 0.8) {
      recommendations.push('Improve trade outcome tracking for better learning');
    }
    
    if (performance.avg_days_to_outcome > 14) {
      recommendations.push('Consider shorter holding periods or tighter stop losses');
    }
    
    return recommendations;
  }

  private createSkippedOptimizationReport(currentPerformance: any): OptimizationReport {
    return {
      timestamp: new Date(),
      performance_summary: {
        total_recommendations: currentPerformance.total_recommendations,
        successful_recommendations: currentPerformance.profitable_count,
        win_rate: currentPerformance.win_rate,
        avg_return: currentPerformance.avg_return,
        sharpe_ratio: 0,
        max_drawdown: 0
      },
      parameter_changes: {
        weight_adjustments: {},
        threshold_adjustments: {},
        improvement_expected: 0
      },
      pattern_insights: {
        new_patterns_discovered: 0,
        updated_patterns: 0,
        best_performing_pattern: 'none',
        worst_performing_pattern: 'none'
      },
      recommendations: {
        strategy_adjustments: ['Continue current strategy - insufficient data for optimization'],
        risk_warnings: [],
        opportunities: []
      }
    };
  }

  private async saveOptimizationResults(report: OptimizationReport): Promise<void> {
    this.optimizationHistory.push(report);
    
    // Keep only last 20 optimization reports
    if (this.optimizationHistory.length > 20) {
      this.optimizationHistory = this.optimizationHistory.slice(-20);
    }
    
    // Save to database (would implement database storage)
    console.log('Optimization results saved');
  }

  // Get strategy state for external monitoring
  async getStrategyState(): Promise<StrategyState> {
    const currentPerformance = await this.analyzeCurrentPerformance();
    const lastOptimization = this.getLastOptimizationDate();
    
    return {
      current_performance: currentPerformance,
      parameter_history: this.optimizationHistory.slice(-10),
      pattern_evolution: this.patternEngine.getPatternSummary(),
      optimization_frequency: this.OPTIMIZATION_INTERVAL_DAYS,
      last_optimization: lastOptimization || new Date(0),
      next_optimization_due: this.calculateNextOptimizationDate()
    };
  }

  private calculateNextOptimizationDate(): Date {
    const lastOptimization = this.getLastOptimizationDate();
    const nextDate = new Date();
    
    if (lastOptimization) {
      nextDate.setTime(lastOptimization.getTime() + (this.OPTIMIZATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000));
    }
    
    return nextDate;
  }

  // Force optimization (for manual trigger)
  async forceOptimization(): Promise<OptimizationReport> {
    console.log('Forcing strategy optimization...');
    return await this.runOptimization();
  }

  // Get optimization history
  getOptimizationHistory(): OptimizationReport[] {
    return [...this.optimizationHistory];
  }

  // Get current learning insights
  async getLearningInsights(): Promise<any> {
    const scoringInsights = await this.adaptiveScoring.getLearningInsights();
    const patternInsights = this.patternEngine.getPatternSummary();
    const performanceInsights = await this.memorySystem.generateLearningInsights();
    
    return {
      scoring_system: scoringInsights,
      pattern_recognition: patternInsights,
      overall_performance: performanceInsights,
      strategy_evolution: {
        optimization_count: this.optimizationHistory.length,
        last_optimization: this.getLastOptimizationDate(),
        next_optimization: this.calculateNextOptimizationDate(),
        performance_trend: this.calculatePerformanceTrend()
      }
    };
  }

  private calculatePerformanceTrend(): 'improving' | 'stable' | 'declining' {
    if (this.optimizationHistory.length < 3) return 'stable';
    
    const recentReports = this.optimizationHistory.slice(-3);
    const returns = recentReports.map(r => r.performance_summary.avg_return);
    
    const trend = returns[2] - returns[0]; // Compare latest to oldest of recent 3
    
    if (trend > 0.02) return 'improving';
    if (trend < -0.02) return 'declining';
    return 'stable';
  }

  // Cleanup method
  close(): void {
    // Clean up resources
  }
}

export default StrategyOptimizer;