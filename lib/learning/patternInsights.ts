// Pattern Insights Generator
// Creates natural language insights from learning database for AI context

import sqlite3 from 'sqlite3';

interface PatternInsight {
  pattern_description: string;
  success_rate: number;
  sample_size: number;
  avg_return: number;
  confidence: number;
}

class PatternInsights {
  private db: sqlite3.Database;

  constructor(dbPath: string = './ai_memory.db') {
    this.db = new sqlite3.Database(dbPath);
  }

  async generatePatternInsights(): Promise<string[]> {
    try {
      const insights: string[] = [];
      
      // Get insights for different short interest ranges
      const shortInterestInsights = await this.getShortInterestPatterns();
      insights.push(...shortInterestInsights);
      
      // Get insights for volume ratio patterns  
      const volumeInsights = await this.getVolumePatterns();
      insights.push(...volumeInsights);
      
      // Get insights for recommendation type patterns
      const typeInsights = await this.getRecommendationTypePatterns();
      insights.push(...typeInsights);
      
      // Get insights for symbol-specific patterns
      const symbolInsights = await this.getSymbolPatterns();
      insights.push(...symbolInsights);
      
      return insights;
    } catch (error) {
      console.error('Error generating pattern insights:', error);
      return [
        'Learning system is building pattern recognition database...',
        'Pattern analysis will improve as more data is collected.'
      ];
    }
  }

  private async getShortInterestPatterns(): Promise<string[]> {
    const query = `
      SELECT 
        CASE 
          WHEN CAST(json_extract(market_conditions, '$.short_interest') AS REAL) >= 30 THEN 'high'
          WHEN CAST(json_extract(market_conditions, '$.short_interest') AS REAL) >= 15 THEN 'medium'
          ELSE 'low'
        END as si_category,
        COUNT(*) as sample_size,
        AVG(CASE WHEN outcome_type = 'profitable' THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(outcome_return) as avg_return
      FROM ai_recommendations 
      WHERE outcome_tracked = 1 
        AND market_conditions IS NOT NULL
        AND json_extract(market_conditions, '$.short_interest') IS NOT NULL
      GROUP BY si_category
      HAVING COUNT(*) >= 2
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const insights: string[] = [];
        
        rows.forEach(row => {
          const successRate = Math.round(row.success_rate * 100);
          const avgReturn = Math.round(row.avg_return * 100);
          
          let description = '';
          if (row.si_category === 'high') {
            description = 'High short interest (>30%) stocks';
          } else if (row.si_category === 'medium') {
            description = 'Medium short interest (15-30%) stocks';
          } else {
            description = 'Low short interest (<15%) stocks';
          }
          
          insights.push(
            `${description} show ${successRate}% success rate with ${avgReturn}% avg return (based on ${row.sample_size} tracked patterns)`
          );
        });
        
        resolve(insights);
      });
    });
  }

  private async getVolumePatterns(): Promise<string[]> {
    const query = `
      SELECT 
        CASE 
          WHEN CAST(json_extract(market_conditions, '$.volume_ratio') AS REAL) >= 3.0 THEN 'high'
          WHEN CAST(json_extract(market_conditions, '$.volume_ratio') AS REAL) >= 2.0 THEN 'medium'
          ELSE 'low'
        END as volume_category,
        COUNT(*) as sample_size,
        AVG(CASE WHEN outcome_type = 'profitable' THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(outcome_return) as avg_return
      FROM ai_recommendations 
      WHERE outcome_tracked = 1 
        AND market_conditions IS NOT NULL
        AND json_extract(market_conditions, '$.volume_ratio') IS NOT NULL
      GROUP BY volume_category
      HAVING COUNT(*) >= 2
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const insights: string[] = [];
        
        rows.forEach(row => {
          const successRate = Math.round(row.success_rate * 100);
          const avgReturn = Math.round(row.avg_return * 100);
          
          let description = '';
          if (row.volume_category === 'high') {
            description = 'High volume ratio (>3x) patterns';
          } else if (row.volume_category === 'medium') {
            description = 'Medium volume ratio (2-3x) patterns';
          } else {
            description = 'Low volume ratio (<2x) patterns';
          }
          
          insights.push(
            `${description} show ${successRate}% success rate with ${avgReturn}% avg return (based on ${row.sample_size} tracked patterns)`
          );
        });
        
        resolve(insights);
      });
    });
  }

  private async getRecommendationTypePatterns(): Promise<string[]> {
    const query = `
      SELECT 
        recommendation_type,
        COUNT(*) as sample_size,
        AVG(CASE WHEN outcome_type = 'profitable' THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(outcome_return) as avg_return,
        AVG(days_to_outcome) as avg_days
      FROM ai_recommendations 
      WHERE outcome_tracked = 1
      GROUP BY recommendation_type
      HAVING COUNT(*) >= 2
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const insights: string[] = [];
        
        rows.forEach(row => {
          const successRate = Math.round(row.success_rate * 100);
          const avgReturn = Math.round(row.avg_return * 100);
          const avgDays = Math.round(row.avg_days);
          
          insights.push(
            `${row.recommendation_type.toUpperCase()} recommendations show ${successRate}% success rate with ${avgReturn}% avg return over ${avgDays} days (based on ${row.sample_size} tracked patterns)`
          );
        });
        
        resolve(insights);
      });
    });
  }

  private async getSymbolPatterns(): Promise<string[]> {
    const query = `
      SELECT 
        symbol,
        COUNT(*) as sample_size,
        AVG(CASE WHEN outcome_type = 'profitable' THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(outcome_return) as avg_return,
        GROUP_CONCAT(DISTINCT recommendation_type) as rec_types
      FROM ai_recommendations 
      WHERE outcome_tracked = 1
      GROUP BY symbol
      HAVING COUNT(*) >= 2
      ORDER BY sample_size DESC
      LIMIT 5
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const insights: string[] = [];
        
        rows.forEach(row => {
          const successRate = Math.round(row.success_rate * 100);
          const avgReturn = Math.round(row.avg_return * 100);
          
          insights.push(
            `${row.symbol} shows ${successRate}% success rate with ${avgReturn}% avg return (based on ${row.sample_size} tracked recommendations)`
          );
        });
        
        resolve(insights);
      });
    });
  }

  async getTopPerformingPatterns(limit: number = 5): Promise<PatternInsight[]> {
    const query = `
      SELECT 
        'Short Interest: ' || 
        CASE 
          WHEN CAST(json_extract(market_conditions, '$.short_interest') AS REAL) >= 30 THEN 'High (>30%)'
          WHEN CAST(json_extract(market_conditions, '$.short_interest') AS REAL) >= 15 THEN 'Medium (15-30%)'
          ELSE 'Low (<15%)'
        END || ', Volume: ' ||
        CASE 
          WHEN CAST(json_extract(market_conditions, '$.volume_ratio') AS REAL) >= 3.0 THEN 'High (>3x)'
          WHEN CAST(json_extract(market_conditions, '$.volume_ratio') AS REAL) >= 2.0 THEN 'Medium (2-3x)'
          ELSE 'Low (<2x)'
        END as pattern_description,
        COUNT(*) as sample_size,
        AVG(CASE WHEN outcome_type = 'profitable' THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(outcome_return) as avg_return
      FROM ai_recommendations 
      WHERE outcome_tracked = 1 
        AND market_conditions IS NOT NULL
        AND json_extract(market_conditions, '$.short_interest') IS NOT NULL
        AND json_extract(market_conditions, '$.volume_ratio') IS NOT NULL
      GROUP BY pattern_description
      HAVING COUNT(*) >= 2
      ORDER BY success_rate DESC, avg_return DESC
      LIMIT ?
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [limit], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const patterns: PatternInsight[] = rows.map(row => ({
          pattern_description: row.pattern_description,
          success_rate: row.success_rate,
          sample_size: row.sample_size,
          avg_return: row.avg_return,
          confidence: Math.min(0.9, row.sample_size / 10) // Confidence based on sample size
        }));
        
        resolve(patterns);
      });
    });
  }

  close() {
    this.db.close();
  }
}

export default PatternInsights;