import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ConversationMessage {
  session_id: string;
  message_type: 'user' | 'assistant' | 'system';
  message_content: string;
  message_context?: any;
  timestamp?: Date;
}

interface AIRecommendation {
  session_id: string;
  recommendation_type: 'buy' | 'sell' | 'hold' | 'watch' | 'analysis';
  symbol: string;
  recommendation_text: string;
  confidence_score?: number;
  reasoning?: string;
  market_conditions?: any;
}

interface RecommendationOutcome {
  recommendation_id: number;
  outcome_type: 'profitable' | 'unprofitable' | 'neutral' | 'unknown';
  outcome_return: number;
  outcome_date: Date;
  outcome_notes?: string;
  max_gain?: number;
  max_loss?: number;
}

class AIMemorySystem {
  private db: sqlite3.Database;
  private currentSessionId: string;
  
  constructor() {
    this.db = new sqlite3.Database('./ai_memory.db');
    this.currentSessionId = this.generateSessionId();
    this.initializeDatabase();
  }

  private initializeDatabase() {
    try {
      // Try multiple paths for schema file
      let schemaSQL: string;
      const possiblePaths = [
        join(__dirname, 'schema.sql'),
        join(process.cwd(), 'lib', 'learning', 'schema.sql'),
        join(process.cwd(), 'lib/learning/schema.sql')
      ];
      
      for (const path of possiblePaths) {
        try {
          schemaSQL = readFileSync(path, 'utf8');
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!schemaSQL!) {
        console.error('Could not find schema.sql file');
        return;
      }
      
      this.db.exec(schemaSQL, (err) => {
        if (err) {
          console.error('AI Memory database initialization error:', err);
        } else {
          console.log('AI Memory database initialized successfully');
        }
      });
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Conversation Memory Management
  async saveConversation(message: ConversationMessage): Promise<void> {
    const query = `
      INSERT INTO ai_conversations 
      (session_id, message_type, message_content, message_context, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        message.session_id || this.currentSessionId,
        message.message_type,
        message.message_content,
        message.message_context ? JSON.stringify(message.message_context) : null,
        message.timestamp ? message.timestamp.toISOString() : new Date().toISOString()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getConversationHistory(sessionId?: string, limit: number = 50): Promise<any[]> {
    const query = sessionId 
      ? `SELECT * FROM ai_conversations WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM ai_conversations ORDER BY timestamp DESC LIMIT ?`;
    
    const params = sessionId ? [sessionId, limit] : [limit];
    
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getRecentConversations(days: number = 7): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const query = `
      SELECT * FROM ai_conversations 
      WHERE timestamp >= ? 
      ORDER BY timestamp DESC
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [cutoffDate.toISOString()], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Recommendation Tracking
  async saveRecommendation(recommendation: AIRecommendation): Promise<number> {
    const query = `
      INSERT INTO ai_recommendations 
      (session_id, recommendation_type, symbol, recommendation_text, confidence_score, reasoning, market_conditions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        recommendation.session_id || this.currentSessionId,
        recommendation.recommendation_type,
        recommendation.symbol,
        recommendation.recommendation_text,
        recommendation.confidence_score || null,
        recommendation.reasoning || null,
        recommendation.market_conditions ? JSON.stringify(recommendation.market_conditions) : null
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID as number);
      });
    });
  }

  async updateRecommendationOutcome(outcome: RecommendationOutcome): Promise<void> {
    const query = `
      UPDATE ai_recommendations 
      SET outcome_tracked = 1, outcome_date = ?, outcome_type = ?, outcome_return = ?, 
          outcome_notes = ?, max_gain = ?, max_loss = ?,
          days_to_outcome = julianday(?) - julianday(timestamp)
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        outcome.outcome_date.toISOString().split('T')[0],
        outcome.outcome_type,
        outcome.outcome_return,
        outcome.outcome_notes || null,
        outcome.max_gain || null,
        outcome.max_loss || null,
        outcome.outcome_date.toISOString().split('T')[0],
        outcome.recommendation_id
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getRecommendationPerformance(symbol?: string, days: number = 30): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const query = symbol 
      ? `SELECT * FROM ai_recommendations WHERE symbol = ? AND timestamp >= ? ORDER BY timestamp DESC`
      : `SELECT * FROM ai_recommendations WHERE timestamp >= ? ORDER BY timestamp DESC`;
    
    const params = symbol ? [symbol, cutoffDate.toISOString()] : [cutoffDate.toISOString()];
    
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          const analysis = this.analyzeRecommendations(rows);
          resolve(analysis);
        }
      });
    });
  }

  private analyzeRecommendations(recommendations: any[]): any {
    const total = recommendations.length;
    const tracked = recommendations.filter(r => r.outcome_tracked).length;
    const profitable = recommendations.filter(r => r.outcome_type === 'profitable').length;
    const unprofitable = recommendations.filter(r => r.outcome_type === 'unprofitable').length;
    
    const avgReturn = recommendations
      .filter(r => r.outcome_return !== null)
      .reduce((sum, r) => sum + r.outcome_return, 0) / 
      Math.max(1, recommendations.filter(r => r.outcome_return !== null).length);
    
    const avgDaysToOutcome = recommendations
      .filter(r => r.days_to_outcome !== null)
      .reduce((sum, r) => sum + r.days_to_outcome, 0) / 
      Math.max(1, recommendations.filter(r => r.days_to_outcome !== null).length);
    
    return {
      total_recommendations: total,
      tracked_outcomes: tracked,
      profitable_count: profitable,
      unprofitable_count: unprofitable,
      win_rate: tracked > 0 ? profitable / tracked : 0,
      avg_return: avgReturn,
      avg_days_to_outcome: avgDaysToOutcome,
      tracking_rate: total > 0 ? tracked / total : 0
    };
  }

  // Stock Memory Management
  async updateStockMemory(symbol: string, data: any): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO stock_memory 
      (symbol, times_recommended, times_analyzed, first_mention, last_mention,
       total_recommendations, successful_recommendations, failed_recommendations,
       avg_recommendation_return, best_return, worst_return, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        symbol,
        data.times_recommended || 0,
        data.times_analyzed || 0,
        data.first_mention || new Date().toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
        data.total_recommendations || 0,
        data.successful_recommendations || 0,
        data.failed_recommendations || 0,
        data.avg_recommendation_return || 0,
        data.best_return || 0,
        data.worst_return || 0,
        new Date().toISOString()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getStockMemory(symbol: string): Promise<any> {
    const query = `SELECT * FROM stock_memory WHERE symbol = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.get(query, [symbol], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getAllStockMemories(): Promise<any[]> {
    const query = `SELECT * FROM stock_memory ORDER BY last_mention DESC`;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Context Building for AI
  async buildConversationContext(sessionId?: string): Promise<any> {
    const conversations = await this.getConversationHistory(sessionId, 10);
    const recentRecommendations = await this.getRecentRecommendations(7);
    const stockMemories = await this.getAllStockMemories();
    
    return {
      recent_conversations: conversations,
      recent_recommendations: recentRecommendations,
      stock_memories: stockMemories.slice(0, 20), // Top 20 most recent
      session_id: sessionId || this.currentSessionId,
      context_generated_at: new Date().toISOString()
    };
  }

  async getRecentRecommendations(days: number = 7): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const query = `
      SELECT * FROM ai_recommendations 
      WHERE timestamp >= ? 
      ORDER BY timestamp DESC 
      LIMIT 20
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [cutoffDate.toISOString()], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Learning Insights
  async generateLearningInsights(): Promise<any> {
    const performanceData = await this.getRecommendationPerformance();
    const stockMemories = await this.getAllStockMemories();
    
    const insights = {
      overall_performance: performanceData,
      best_performing_stocks: stockMemories
        .filter(s => s.avg_recommendation_return > 0)
        .sort((a, b) => b.avg_recommendation_return - a.avg_recommendation_return)
        .slice(0, 5),
      worst_performing_stocks: stockMemories
        .filter(s => s.avg_recommendation_return < 0)
        .sort((a, b) => a.avg_recommendation_return - b.avg_recommendation_return)
        .slice(0, 5),
      most_analyzed_stocks: stockMemories
        .sort((a, b) => b.times_analyzed - a.times_analyzed)
        .slice(0, 10),
      recommendation_patterns: await this.analyzeRecommendationPatterns()
    };
    
    return insights;
  }

  private async analyzeRecommendationPatterns(): Promise<any> {
    // This would be expanded with more sophisticated pattern analysis
    return {
      most_successful_recommendation_type: 'buy', // Placeholder
      optimal_confidence_threshold: 0.75,
      average_hold_period: 7.5,
      best_market_conditions: 'high_volume_low_volatility'
    };
  }

  // Session Management
  getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  startNewSession(): string {
    this.currentSessionId = this.generateSessionId();
    return this.currentSessionId;
  }

  close(): void {
    this.db.close();
  }
}

export default AIMemorySystem;