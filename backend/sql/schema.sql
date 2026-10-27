-- =============================================================================
-- UPI Fraud Intelligence & Transaction Risk Analytics Platform
-- Production PostgreSQL Database Schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(128) NOT NULL,
    receiver_id VARCHAR(64) NOT NULL,
    receiver_name VARCHAR(128) NOT NULL,
    receiver_type VARCHAR(32) NOT NULL DEFAULT 'merchant',
    merchant_category VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    device_id VARCHAR(64) NOT NULL,
    device_type VARCHAR(32) NOT NULL DEFAULT 'Android',
    ip_address VARCHAR(64) NOT NULL,
    location_city VARCHAR(64) NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'UPI_APP',
    is_device_changed BOOLEAN NOT NULL DEFAULT FALSE,
    is_location_changed BOOLEAN NOT NULL DEFAULT FALSE,
    time_since_last_txn_sec NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    rolling_count_1h INTEGER NOT NULL DEFAULT 1,
    rolling_amount_1h NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    rolling_count_24h INTEGER NOT NULL DEFAULT 1,
    rolling_amount_24h NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    user_historical_mean NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    user_historical_std NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    amount_to_mean_ratio NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    is_fraud_simulated BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_scenario_tag VARCHAR(64) NOT NULL DEFAULT 'NONE'
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_txn_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_txn_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_txn_receiver ON transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_txn_merchant_cat ON transactions(merchant_category);
CREATE INDEX IF NOT EXISTS idx_txn_amount ON transactions(amount);
CREATE INDEX IF NOT EXISTS idx_txn_is_fraud ON transactions(is_fraud_simulated);

CREATE TABLE IF NOT EXISTS detection_results (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    iqr_flag BOOLEAN NOT NULL DEFAULT FALSE,
    iqr_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    iqr_reason VARCHAR(256) NOT NULL DEFAULT '',
    iforest_flag BOOLEAN NOT NULL DEFAULT FALSE,
    iforest_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    iforest_reason VARCHAR(256) NOT NULL DEFAULT '',
    timeseries_flag BOOLEAN NOT NULL DEFAULT FALSE,
    timeseries_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    timeseries_reason VARCHAR(256) NOT NULL DEFAULT '',
    ensemble_risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW',
    detection_signals TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_detection_risk_level ON detection_results(risk_level);
CREATE INDEX IF NOT EXISTS idx_detection_risk_score ON detection_results(ensemble_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_detection_iqr ON detection_results(iqr_flag);
CREATE INDEX IF NOT EXISTS idx_detection_iforest ON detection_results(iforest_flag);
CREATE INDEX IF NOT EXISTS idx_detection_timeseries ON detection_results(timeseries_flag);

CREATE TABLE IF NOT EXISTS investigations (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    review_status VARCHAR(32) NOT NULL DEFAULT 'New',
    analyst_notes TEXT,
    analyst_id VARCHAR(64) DEFAULT 'analyst_01',
    escalation_reason VARCHAR(256),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_review_status ON investigations(review_status);
CREATE INDEX IF NOT EXISTS idx_inv_analyst_id ON investigations(analyst_id);

CREATE TABLE IF NOT EXISTS dataset_metadata (
    id SERIAL PRIMARY KEY,
    version VARCHAR(32) NOT NULL,
    total_records INTEGER NOT NULL,
    fraud_count INTEGER NOT NULL,
    fraud_rate NUMERIC(5, 2) NOT NULL,
    date_start TIMESTAMP WITH TIME ZONE NOT NULL,
    date_end TIMESTAMP WITH TIME ZONE NOT NULL,
    random_seed INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    provider VARCHAR(32) NOT NULL DEFAULT 'gmail',
    avatar_url VARCHAR(256),
    role VARCHAR(32) NOT NULL DEFAULT 'Risk Analyst',
    login_count INTEGER NOT NULL DEFAULT 1,
    last_login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);

CREATE TABLE IF NOT EXISTS audit_events (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    previous_status VARCHAR(32),
    new_status VARCHAR(32),
    analyst_id VARCHAR(64) NOT NULL DEFAULT 'analyst_01',
    analyst_name VARCHAR(128) DEFAULT 'Lead Risk Analyst',
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_txn ON audit_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(created_at DESC);
