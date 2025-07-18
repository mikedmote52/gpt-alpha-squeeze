import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

class PerformanceDatabase {
  private db: sqlite3.Database;
  
  constructor() {
    this.db = new sqlite3.Database('./performance.db');
    this.initializeDatabase();
  }

  private initializeDatabase() {
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    this.db.exec(schemaSQL, (err) => {
      if (err) {
        console.error('Database initialization error:', err);
      } else {
        console.log('Performance database initialized successfully');
      }
    });
  }

  // Trade execution logging
  async logTradeExecution(trade: {
    order_id: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    total_value: number;
    execution_time: Date;
    strategy_signal?: string;
    confidence_score?: number;
  }) {
    const query = `
      INSERT INTO trade_executions 
      (order_id, symbol, side, quantity, price, total_value, execution_time, strategy_signal, confidence_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        trade.order_id,
        trade.symbol,
        trade.side,
        trade.quantity,
        trade.price,
        trade.total_value,
        trade.execution_time.toISOString(),
        trade.strategy_signal,
        trade.confidence_score
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Position tracking
  async openPosition(position: {
    symbol: string;
    entry_date: Date;
    entry_price: number;
    quantity: number;
    strategy_reason?: string;
  }) {
    const query = `
      INSERT INTO position_tracking 
      (symbol, entry_date, entry_price, quantity, strategy_reason)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        position.symbol,
        position.entry_date.toISOString().split('T')[0],
        position.entry_price,
        position.quantity,
        position.strategy_reason
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async closePosition(symbol: string, exit_price: number, exit_date: Date) {
    const query = `
      UPDATE position_tracking 
      SET exit_date = ?, exit_price = ?, is_closed = 1,
          hold_period_days = julianday(?) - julianday(entry_date),
          realized_pnl = (? - entry_price) * quantity,
          realized_return = (? - entry_price) / entry_price
      WHERE symbol = ? AND is_closed = 0
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        exit_date.toISOString().split('T')[0],
        exit_price,
        exit_date.toISOString().split('T')[0],
        exit_price,
        exit_price,
        symbol
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Performance metrics
  async recordDailyPerformance(metrics: {
    date: Date;
    portfolio_value: number;
    daily_return?: number;
    cumulative_return?: number;
    benchmark_return?: number;
    excess_return?: number;
    sharpe_ratio?: number;
    max_drawdown?: number;
    volatility?: number;
  }) {
    const query = `
      INSERT OR REPLACE INTO performance_metrics 
      (date, portfolio_value, daily_return, cumulative_return, benchmark_return, 
       excess_return, sharpe_ratio, max_drawdown, volatility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        metrics.date.toISOString().split('T')[0],
        metrics.portfolio_value,
        metrics.daily_return,
        metrics.cumulative_return,
        metrics.benchmark_return,
        metrics.excess_return,
        metrics.sharpe_ratio,
        metrics.max_drawdown,
        metrics.volatility
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Risk metrics
  async recordRiskMetrics(metrics: {
    date: Date;
    portfolio_beta?: number;
    var_95?: number;
    var_99?: number;
    expected_shortfall?: number;
    portfolio_correlation?: number;
    concentration_risk?: number;
  }) {
    const query = `
      INSERT OR REPLACE INTO risk_metrics 
      (date, portfolio_beta, var_95, var_99, expected_shortfall, portfolio_correlation, concentration_risk)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        metrics.date.toISOString().split('T')[0],
        metrics.portfolio_beta,
        metrics.var_95,
        metrics.var_99,
        metrics.expected_shortfall,
        metrics.portfolio_correlation,
        metrics.concentration_risk
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Alpha testing
  async recordAlphaTest(test: {
    test_period_start: Date;
    test_period_end: Date;
    test_type: string;
    t_statistic: number;
    p_value: number;
    confidence_level: number;
    is_significant: boolean;
    alpha_estimate: number;
    standard_error: number;
  }) {
    const query = `
      INSERT INTO alpha_tests 
      (test_period_start, test_period_end, test_type, t_statistic, p_value, 
       confidence_level, is_significant, alpha_estimate, standard_error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        test.test_period_start.toISOString().split('T')[0],
        test.test_period_end.toISOString().split('T')[0],
        test.test_type,
        test.t_statistic,
        test.p_value,
        test.confidence_level,
        test.is_significant,
        test.alpha_estimate,
        test.standard_error
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Performance alerts
  async createAlert(alert: {
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric_value: number;
    threshold_value: number;
  }) {
    const query = `
      INSERT INTO performance_alerts 
      (alert_type, severity, message, metric_value, threshold_value)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(query, [
        alert.alert_type,
        alert.severity,
        alert.message,
        alert.metric_value,
        alert.threshold_value
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Query methods
  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT * FROM performance_metrics 
      WHERE date BETWEEN ? AND ? 
      ORDER BY date DESC
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getTradeHistory(symbol?: string, limit: number = 100): Promise<any[]> {
    const query = symbol 
      ? `SELECT * FROM trade_executions WHERE symbol = ? ORDER BY execution_time DESC LIMIT ?`
      : `SELECT * FROM trade_executions ORDER BY execution_time DESC LIMIT ?`;
    
    const params = symbol ? [symbol, limit] : [limit];
    
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getActivePositions(): Promise<any[]> {
    const query = `SELECT * FROM position_tracking WHERE is_closed = 0`;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getUnresolvedAlerts(): Promise<any[]> {
    const query = `
      SELECT * FROM performance_alerts 
      WHERE is_resolved = 0 
      ORDER BY created_at DESC
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    this.db.close();
  }
}

export default PerformanceDatabase;