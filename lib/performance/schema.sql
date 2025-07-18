-- Performance Tracking Database Schema
-- SQLite schema for local development, easily portable to PostgreSQL

-- Core performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    portfolio_value DECIMAL(15,2) NOT NULL,
    daily_return DECIMAL(8,4),
    cumulative_return DECIMAL(8,4),
    benchmark_return DECIMAL(8,4) DEFAULT 0.638, -- 63.8% monthly baseline
    excess_return DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    volatility DECIMAL(8,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- Trade execution logging
CREATE TABLE IF NOT EXISTS trade_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,4) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    execution_time TIMESTAMP NOT NULL,
    strategy_signal TEXT,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Position tracking with entry/exit analysis
CREATE TABLE IF NOT EXISTS position_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    entry_date DATE NOT NULL,
    exit_date DATE,
    entry_price DECIMAL(15,4) NOT NULL,
    exit_price DECIMAL(15,4),
    quantity DECIMAL(15,8) NOT NULL,
    hold_period_days INTEGER,
    realized_pnl DECIMAL(15,2),
    realized_return DECIMAL(8,4),
    max_adverse_excursion DECIMAL(8,4),
    max_favorable_excursion DECIMAL(8,4),
    strategy_reason TEXT,
    is_closed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk metrics tracking
CREATE TABLE IF NOT EXISTS risk_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    portfolio_beta DECIMAL(8,4),
    var_95 DECIMAL(15,2), -- Value at Risk 95%
    var_99 DECIMAL(15,2), -- Value at Risk 99%
    expected_shortfall DECIMAL(15,2),
    portfolio_correlation DECIMAL(8,4),
    concentration_risk DECIMAL(8,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- Statistical significance testing results
CREATE TABLE IF NOT EXISTS alpha_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_period_start DATE NOT NULL,
    test_period_end DATE NOT NULL,
    test_type TEXT NOT NULL,
    t_statistic DECIMAL(8,4),
    p_value DECIMAL(8,6),
    confidence_level DECIMAL(4,2),
    is_significant BOOLEAN,
    alpha_estimate DECIMAL(8,4),
    standard_error DECIMAL(8,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance alerts and monitoring
CREATE TABLE IF NOT EXISTS performance_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    metric_value DECIMAL(15,4),
    threshold_value DECIMAL(15,4),
    is_resolved BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Benchmark comparison data
CREATE TABLE IF NOT EXISTS benchmark_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    benchmark_name TEXT NOT NULL,
    benchmark_value DECIMAL(15,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, benchmark_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_date ON performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trade_executions(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_time ON trade_executions(execution_time);
CREATE INDEX IF NOT EXISTS idx_position_symbol ON position_tracking(symbol);
CREATE INDEX IF NOT EXISTS idx_position_dates ON position_tracking(entry_date, exit_date);
CREATE INDEX IF NOT EXISTS idx_risk_date ON risk_metrics(date);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON performance_alerts(alert_type, created_at);