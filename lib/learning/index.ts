// Learning System Main Orchestrator
import AIMemorySystem from './memorySystem';
import AdaptiveScoringSystem from './adaptiveScoring';
import PatternRecognitionEngine from './patternRecognition';
import RecommendationTracker from './recommendationTracker';
import StrategyOptimizer from './strategyOptimizer';
import { outcomeTracker } from './outcomeTracker';

// Export all learning components
export { default as AIMemorySystem } from './memorySystem';
export { default as AdaptiveScoringSystem } from './adaptiveScoring';
export { default as PatternRecognitionEngine } from './patternRecognition';
export { default as RecommendationTracker } from './recommendationTracker';
export { default as StrategyOptimizer } from './strategyOptimizer';
export { outcomeTracker } from './outcomeTracker';

// Central Learning System Manager
export class LearningSystemManager {
  private memorySystem: AIMemorySystem;
  private adaptiveScoring: AdaptiveScoringSystem;
  private patternEngine: PatternRecognitionEngine;
  private recommendationTracker: RecommendationTracker;
  private strategyOptimizer: StrategyOptimizer;
  private isInitialized: boolean = false;

  constructor() {
    this.memorySystem = new AIMemorySystem();
    this.adaptiveScoring = new AdaptiveScoringSystem();
    this.patternEngine = new PatternRecognitionEngine();
    this.recommendationTracker = new RecommendationTracker();
    this.strategyOptimizer = new StrategyOptimizer();
  }

  // Initialize the learning system
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing Learning System...');
    
    try {
      // Initialize all components
      await this.memorySystem.buildConversationContext();
      await this.recommendationTracker.batchUpdate();
      
      // Start outcome tracking
      await outcomeTracker.startTracking();
      
      this.isInitialized = true;
      console.log('Learning System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Learning System:', error);
      throw error;
    }
  }

  // Save a conversation message and extract insights
  async saveConversationWithInsights(
    message: string,
    messageType: 'user' | 'assistant' | 'system',
    sessionId?: string,
    metadata?: any
  ): Promise<void> {
    await this.memorySystem.saveConversation({
      session_id: sessionId || this.memorySystem.getCurrentSessionId(),
      message_type: messageType,
      message_content: message,
      message_context: metadata
    });

    // Extract recommendations if this is an assistant message
    if (messageType === 'assistant') {
      await this.extractAndSaveRecommendations(message, sessionId, metadata);
    }
  }

  // Extract recommendations from assistant messages
  private async extractAndSaveRecommendations(
    message: string,
    sessionId?: string,
    metadata?: any
  ): Promise<void> {
    const recommendations = this.parseRecommendationsFromMessage(message);
    
    for (const rec of recommendations) {
      const recId = await this.memorySystem.saveRecommendation({
        session_id: sessionId || this.memorySystem.getCurrentSessionId(),
        recommendation_type: rec.type,
        symbol: rec.symbol,
        recommendation_text: rec.text,
        confidence_score: rec.confidence,
        reasoning: rec.reasoning,
        market_conditions: metadata?.market_conditions
      });

      // Start tracking if it's a buy/watch recommendation
      if (rec.type === 'buy' || rec.type === 'watch') {
        await this.recommendationTracker.startTracking(
          rec.symbol,
          recId,
          metadata?.market_conditions?.current_price
        );
      }
    }
  }

  // Parse recommendations from AI message text
  private parseRecommendationsFromMessage(message: string): any[] {
    const recommendations: any[] = [];
    
    // Simple regex patterns to extract recommendations
    const patterns = [
      { regex: /recommend.*?buying?\s+(\w+)/gi, type: 'buy' },
      { regex: /suggest.*?selling?\s+(\w+)/gi, type: 'sell' },
      { regex: /hold.*?(\w+)/gi, type: 'hold' },
      { regex: /watch.*?(\w+)/gi, type: 'watch' },
      { regex: /(\w+).*?(?:excellent|good|strong).*?(?:squeeze|potential)/gi, type: 'analysis' }
    ];

    for (const pattern of patterns) {
      const matches = message.matchAll(pattern.regex);
      for (const match of matches) {
        const symbol = match[1]?.toUpperCase();
        if (symbol && symbol.length >= 2 && symbol.length <= 5) {
          recommendations.push({
            type: pattern.type,
            symbol: symbol,
            text: match[0],
            confidence: this.extractConfidence(match[0]),
            reasoning: this.extractReasoning(message, symbol)
          });
        }
      }
    }

    return recommendations;
  }

  private extractConfidence(text: string): number {
    // Simple confidence extraction based on language
    const highConfidenceWords = ['excellent', 'strong', 'highly', 'significant', 'outstanding'];
    const mediumConfidenceWords = ['good', 'solid', 'reasonable', 'moderate'];
    const lowConfidenceWords = ['potential', 'possible', 'may', 'could', 'might'];

    const lowerText = text.toLowerCase();
    
    if (highConfidenceWords.some(word => lowerText.includes(word))) return 0.8;
    if (mediumConfidenceWords.some(word => lowerText.includes(word))) return 0.6;
    if (lowConfidenceWords.some(word => lowerText.includes(word))) return 0.4;
    
    return 0.5; // Default confidence
  }

  private extractReasoning(message: string, symbol: string): string {
    // Extract reasoning around the symbol mention
    const sentences = message.split(/[.!?]+/);
    const relevantSentences = sentences.filter(s => 
      s.toLowerCase().includes(symbol.toLowerCase())
    );
    
    return relevantSentences.join('. ').trim();
  }

  // Get enhanced context for AI conversations
  async getConversationContext(sessionId?: string): Promise<any> {
    const context = await this.memorySystem.buildConversationContext(sessionId);
    const learningInsights = await this.strategyOptimizer.getLearningInsights();
    const currentParameters = this.adaptiveScoring.getCurrentParameters();
    
    return {
      ...context,
      learning_insights: learningInsights,
      current_scoring_parameters: currentParameters,
      active_tracking: Array.from(this.recommendationTracker.getActiveTracking().values()),
      pattern_summary: this.patternEngine.getPatternSummary(),
      system_status: {
        total_conversations: context.recent_conversations.length,
        total_recommendations: context.recent_recommendations.length,
        active_tracking_count: this.recommendationTracker.getActiveTracking().size,
        learning_system_active: this.isInitialized
      }
    };
  }

  // Enhanced scoring with pattern recognition
  async calculateEnhancedScore(stockData: any, symbol: string): Promise<{
    adaptive_score: number;
    pattern_analysis: any;
    confidence_adjustment: number;
    final_score: number;
    reasoning: string;
  }> {
    // Get adaptive score
    const adaptiveScore = this.adaptiveScoring.calculateAdaptiveScore(stockData);
    
    // Get pattern analysis
    const patternAnalysis = await this.patternEngine.analyzeStock(symbol, stockData);
    
    // Calculate confidence adjustment based on patterns and history
    const stockMemory = await this.memorySystem.getStockMemory(symbol);
    const confidenceAdjustment = this.calculateConfidenceAdjustment(
      patternAnalysis,
      stockMemory,
      stockData
    );
    
    // Calculate final score
    const finalScore = Math.min(100, Math.max(0, 
      adaptiveScore + (confidenceAdjustment * 20)
    ));
    
    // Generate reasoning
    const reasoning = this.generateScoringReasoning(
      adaptiveScore,
      patternAnalysis,
      confidenceAdjustment,
      stockMemory
    );
    
    return {
      adaptive_score: adaptiveScore,
      pattern_analysis: patternAnalysis,
      confidence_adjustment: confidenceAdjustment,
      final_score: Math.round(finalScore),
      reasoning: reasoning
    };
  }

  private calculateConfidenceAdjustment(
    patternAnalysis: any,
    stockMemory: any,
    stockData: any
  ): number {
    let adjustment = 0;
    
    // Pattern-based adjustment
    if (patternAnalysis.overall_prediction.squeeze_probability > 0.7) {
      adjustment += 0.2;
    } else if (patternAnalysis.overall_prediction.squeeze_probability < 0.3) {
      adjustment -= 0.2;
    }
    
    // Historical performance adjustment
    if (stockMemory && stockMemory.total_recommendations > 0) {
      const successRate = stockMemory.successful_recommendations / stockMemory.total_recommendations;
      if (successRate > 0.7) adjustment += 0.15;
      else if (successRate < 0.3) adjustment -= 0.15;
    }
    
    // Market conditions adjustment
    if (stockData.volumeRatio > 5) adjustment += 0.1;
    if (stockData.shortInt > 50) adjustment += 0.1;
    
    return Math.max(-0.5, Math.min(0.5, adjustment));
  }

  private generateScoringReasoning(
    adaptiveScore: number,
    patternAnalysis: any,
    confidenceAdjustment: number,
    stockMemory: any
  ): string {
    const reasons: string[] = [];
    
    reasons.push(`Base adaptive score: ${adaptiveScore}/100`);
    
    if (patternAnalysis.pattern_matches.length > 0) {
      const topPattern = patternAnalysis.pattern_matches[0];
      reasons.push(`Matches pattern "${topPattern.pattern.pattern_name}" with ${(topPattern.match_score * 100).toFixed(0)}% confidence`);
    }
    
    if (confidenceAdjustment > 0.1) {
      reasons.push(`Confidence boosted by ${(confidenceAdjustment * 100).toFixed(0)}% due to positive indicators`);
    } else if (confidenceAdjustment < -0.1) {
      reasons.push(`Confidence reduced by ${(Math.abs(confidenceAdjustment) * 100).toFixed(0)}% due to risk factors`);
    }
    
    if (stockMemory && stockMemory.total_recommendations > 0) {
      const successRate = stockMemory.successful_recommendations / stockMemory.total_recommendations;
      reasons.push(`Historical success rate: ${(successRate * 100).toFixed(0)}%`);
    }
    
    return reasons.join('. ');
  }

  // Run periodic optimization
  async runPeriodicOptimization(): Promise<any> {
    return await this.strategyOptimizer.runOptimization();
  }

  // Get comprehensive learning status
  async getLearningStatus(): Promise<any> {
    const insights = await this.strategyOptimizer.getLearningInsights();
    const memoryStats = await this.memorySystem.generateLearningInsights();
    const trackingStatus = await this.recommendationTracker.getPerformanceSummary();
    
    return {
      system_initialized: this.isInitialized,
      memory_system: {
        total_conversations: memoryStats.overall_performance.total_recommendations,
        recent_recommendations: memoryStats.overall_performance.tracked_outcomes,
        win_rate: memoryStats.overall_performance.win_rate
      },
      adaptive_scoring: {
        current_parameters: this.adaptiveScoring.getCurrentParameters(),
        optimization_ready: insights.scoring_system.optimization_ready
      },
      pattern_recognition: {
        total_patterns: insights.pattern_recognition.total_patterns,
        best_patterns: insights.pattern_recognition.best_performing?.slice(0, 3) || []
      },
      recommendation_tracking: {
        active_tracking: trackingStatus.active_tracking_count,
        performance_summary: trackingStatus.overall_performance
      },
      strategy_optimization: {
        last_optimization: insights.strategy_evolution.last_optimization,
        next_optimization: insights.strategy_evolution.next_optimization,
        performance_trend: insights.strategy_evolution.performance_trend
      }
    };
  }

  // Manual methods for external control
  async forceOptimization(): Promise<any> {
    return await this.strategyOptimizer.forceOptimization();
  }

  async updateTracking(): Promise<void> {
    await this.recommendationTracker.batchUpdate();
  }

  startNewSession(): string {
    return this.memorySystem.startNewSession();
  }

  getCurrentSessionId(): string {
    return this.memorySystem.getCurrentSessionId();
  }

  // Cleanup
  close(): void {
    this.strategyOptimizer.close();
    this.memorySystem.close();
    outcomeTracker.stopTracking();
  }
}

// Create singleton instance
export const learningSystem = new LearningSystemManager();

// Initialize on import
learningSystem.initialize().catch(console.error);

export default learningSystem;