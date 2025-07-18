-- AI Memory and Learning System Schema
-- Extension to the existing performance database

-- AI conversation memory across sessions
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_id TEXT DEFAULT 'default_user',
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
    message_content TEXT NOT NULL,
    message_context TEXT, -- JSON metadata
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI recommendations and predictions tracking
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('buy', 'sell', 'hold', 'watch', 'analysis')),
    symbol TEXT NOT NULL,
    recommendation_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    reasoning TEXT, -- AI's reasoning for the recommendation
    market_conditions TEXT, -- JSON of market conditions at time of recommendation
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Outcome tracking
    outcome_tracked BOOLEAN DEFAULT 0,
    outcome_date DATE,
    outcome_type TEXT CHECK (outcome_type IN ('profitable', 'unprofitable', 'neutral', 'unknown')),
    outcome_return DECIMAL(8,4), -- Actual return achieved
    outcome_notes TEXT,
    
    -- Performance metrics
    days_to_outcome INTEGER,
    max_gain DECIMAL(8,4), -- Peak gain during holding period
    max_loss DECIMAL(8,4), -- Peak loss during holding period
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strategy parameter evolution and optimization
CREATE TABLE IF NOT EXISTS strategy_parameters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parameter_set_name TEXT NOT NULL,
    version INTEGER NOT NULL,
    
    -- Squeeze scoring weights
    short_interest_weight DECIMAL(4,2) DEFAULT 0.25,
    days_to_cover_weight DECIMAL(4,2) DEFAULT 0.20,
    borrow_rate_weight DECIMAL(4,2) DEFAULT 0.15,
    volume_weight DECIMAL(4,2) DEFAULT 0.15,
    float_weight DECIMAL(4,2) DEFAULT 0.10,
    price_action_weight DECIMAL(4,2) DEFAULT 0.10,
    sentiment_weight DECIMAL(4,2) DEFAULT 0.05,
    
    -- Thresholds
    min_short_interest DECIMAL(5,2) DEFAULT 20.0,
    min_days_to_cover DECIMAL(5,2) DEFAULT 3.0,
    min_borrow_rate DECIMAL(5,2) DEFAULT 50.0,
    min_volume_ratio DECIMAL(5,2) DEFAULT 2.0,
    min_score_threshold DECIMAL(5,2) DEFAULT 75.0,
    
    -- Performance tracking
    recommendations_count INTEGER DEFAULT 0,
    successful_recommendations INTEGER DEFAULT 0,
    total_return DECIMAL(8,4) DEFAULT 0.0,
    avg_return DECIMAL(8,4) DEFAULT 0.0,
    win_rate DECIMAL(5,4) DEFAULT 0.0,
    sharpe_ratio DECIMAL(6,4) DEFAULT 0.0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT 1,
    creation_reason TEXT,
    performance_period_start DATE,
    performance_period_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(parameter_set_name, version)
);

-- Market pattern recognition and learning
CREATE TABLE IF NOT EXISTS market_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_name TEXT NOT NULL,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('squeeze_setup', 'breakout', 'reversal', 'continuation')),
    
    -- Pattern characteristics
    pattern_features TEXT NOT NULL, -- JSON of pattern features
    market_conditions TEXT, -- JSON of market conditions when pattern occurred
    
    -- Historical performance
    occurrences_count INTEGER DEFAULT 1,
    successful_outcomes INTEGER DEFAULT 0,
    total_return DECIMAL(8,4) DEFAULT 0.0,
    avg_return DECIMAL(8,4) DEFAULT 0.0,
    avg_hold_period DECIMAL(6,2) DEFAULT 0.0,
    
    -- Statistical measures
    confidence_interval DECIMAL(5,4) DEFAULT 0.0,
    statistical_significance DECIMAL(6,4) DEFAULT 0.0,
    
    -- Learning metadata
    first_observed DATE NOT NULL,
    last_observed DATE NOT NULL,
    pattern_strength DECIMAL(5,4) DEFAULT 0.0, -- 0.0 to 1.0
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual stock learning and memory
CREATE TABLE IF NOT EXISTS stock_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    
    -- Historical AI interactions
    times_recommended INTEGER DEFAULT 0,
    times_analyzed INTEGER DEFAULT 0,
    first_mention DATE,
    last_mention DATE,
    
    -- Performance tracking
    total_recommendations INTEGER DEFAULT 0,
    successful_recommendations INTEGER DEFAULT 0,
    failed_recommendations INTEGER DEFAULT 0,
    avg_recommendation_return DECIMAL(8,4) DEFAULT 0.0,
    best_return DECIMAL(8,4) DEFAULT 0.0,
    worst_return DECIMAL(8,4) DEFAULT 0.0,
    
    -- Learning insights
    best_entry_conditions TEXT, -- JSON of conditions when stock performed best
    worst_entry_conditions TEXT, -- JSON of conditions when stock performed worst
    typical_hold_period DECIMAL(6,2) DEFAULT 0.0,
    volatility_profile DECIMAL(6,4) DEFAULT 0.0,
    
    -- Squeeze characteristics
    historical_squeeze_success BOOLEAN DEFAULT 0,
    avg_squeeze_magnitude DECIMAL(8,4) DEFAULT 0.0,
    typical_squeeze_duration DECIMAL(6,2) DEFAULT 0.0,
    
    -- User preferences
    user_interest_level DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    user_risk_tolerance DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(symbol)
);

-- User behavior and preference learning
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    preference_type TEXT NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    learning_source TEXT, -- 'explicit', 'implicit', 'inferred'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, preference_type, preference_key)
);

-- Model training and performance tracking
CREATE TABLE IF NOT EXISTS model_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('squeeze_scoring', 'pattern_recognition', 'price_prediction', 'sentiment_analysis')),
    
    -- Training information
    training_data_start DATE NOT NULL,
    training_data_end DATE NOT NULL,
    training_samples INTEGER NOT NULL,
    training_features TEXT, -- JSON of features used
    
    -- Performance metrics
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    auc_score DECIMAL(5,4),
    
    -- Trading performance
    backtest_return DECIMAL(8,4),
    backtest_sharpe DECIMAL(6,4),
    backtest_max_drawdown DECIMAL(6,4),
    backtest_win_rate DECIMAL(5,4),
    
    -- Model metadata
    hyperparameters TEXT, -- JSON of model hyperparameters
    feature_importance TEXT, -- JSON of feature importance scores
    is_active BOOLEAN DEFAULT 1,
    deployment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(model_name, model_version)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_session ON ai_conversations(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_recommendations_symbol ON ai_recommendations(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_recommendations_outcome ON ai_recommendations(outcome_type, outcome_date);
CREATE INDEX IF NOT EXISTS idx_strategy_params_active ON strategy_parameters(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON market_patterns(pattern_type, is_active);
CREATE INDEX IF NOT EXISTS idx_stock_memory_symbol ON stock_memory(symbol, last_mention);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id, preference_type);
CREATE INDEX IF NOT EXISTS idx_model_perf_active ON model_performance(is_active, model_type);