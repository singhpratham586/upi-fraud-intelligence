-- =============================================================================
-- UPI Fraud Intelligence Platform: Analytical SQL Query Library
-- 20+ Production Analytical Queries
-- =============================================================================

-- Query 1: Total Transaction Volume & Throughput
SELECT 
    COUNT(*) AS total_transactions,
    ROUND(SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS success_rate_pct,
    COUNT(DISTINCT sender_id) AS distinct_senders,
    COUNT(DISTINCT receiver_id) AS distinct_receivers,
    ROUND(SUM(amount), 2) AS gross_transaction_value_inr
FROM transactions;

-- Query 2: Aggregate Transaction Value & Average Ticket Size
SELECT 
    ROUND(SUM(amount), 2) AS total_settlement_value_inr,
    ROUND(AVG(amount), 2) AS avg_ticket_size_inr,
    ROUND(MIN(amount), 2) AS min_ticket_size_inr,
    ROUND(MAX(amount), 2) AS max_ticket_size_inr
FROM transactions
WHERE status = 'SUCCESS';

-- Query 3: Daily Transaction Velocity & Value Trends
SELECT 
    SUBSTR(timestamp, 1, 10) AS txn_date,
    COUNT(*) AS daily_txn_count,
    ROUND(SUM(amount), 2) AS daily_amount_inr,
    ROUND(AVG(amount), 2) AS daily_avg_amount_inr
FROM transactions
GROUP BY SUBSTR(timestamp, 1, 10)
ORDER BY txn_date DESC
LIMIT 14;

-- Query 4: Hourly Diurnal Pattern & Night-Window Risk
SELECT 
    CAST(SUBSTR(timestamp, 12, 2) AS INTEGER) AS hour_of_day,
    COUNT(*) AS txn_count,
    ROUND(SUM(amount), 2) AS total_amount_inr,
    ROUND(AVG(amount), 2) AS avg_ticket_inr,
    SUM(CASE WHEN CAST(SUBSTR(timestamp, 12, 2) AS INTEGER) BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS is_graveyard_hour
FROM transactions
GROUP BY hour_of_day
ORDER BY hour_of_day ASC;

-- Query 5: Merchant Category Breakdown & Risk Distribution
SELECT 
    t.merchant_category,
    COUNT(t.id) AS total_txns,
    ROUND(SUM(t.amount), 2) AS total_value_inr,
    ROUND(AVG(t.amount), 2) AS avg_value_inr,
    SUM(CASE WHEN d.risk_level IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) AS high_risk_alerts,
    ROUND(SUM(CASE WHEN d.risk_level IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) * 100.0 / COUNT(t.id), 2) AS high_risk_rate_pct
FROM transactions t
LEFT JOIN detection_results d ON t.id = d.transaction_id
GROUP BY t.merchant_category
ORDER BY high_risk_alerts DESC;

-- Query 6: Transaction Amount Percentile & Tail Exposure
WITH ranked_txns AS (
    SELECT 
        amount,
        ROW_NUMBER() OVER (ORDER BY amount) AS row_num,
        COUNT(*) OVER () AS total_count
    FROM transactions
)
SELECT 
    ROUND(MAX(CASE WHEN row_num = CAST(0.25 * total_count AS INT) THEN amount END), 2) AS p25_q1,
    ROUND(MAX(CASE WHEN row_num = CAST(0.50 * total_count AS INT) THEN amount END), 2) AS p50_median,
    ROUND(MAX(CASE WHEN row_num = CAST(0.75 * total_count AS INT) THEN amount END), 2) AS p75_q3,
    ROUND(MAX(CASE WHEN row_num = CAST(0.95 * total_count AS INT) THEN amount END), 2) AS p95,
    ROUND(MAX(CASE WHEN row_num = CAST(0.99 * total_count AS INT) THEN amount END), 2) AS p99
FROM ranked_txns;

-- Query 7: High-Frequency Transacting Accounts (Velocity Profiling)
SELECT 
    sender_id,
    sender_name,
    COUNT(*) AS total_transactions,
    ROUND(SUM(amount), 2) AS total_spent_inr,
    ROUND(AVG(amount), 2) AS avg_per_txn_inr,
    MAX(rolling_count_1h) AS max_1h_burst_count
FROM transactions
GROUP BY sender_id, sender_name
HAVING COUNT(*) > 40
ORDER BY max_1h_burst_count DESC
LIMIT 10;

-- Query 8: Repeated Receiver Funneling (Syndicate Detection)
SELECT 
    receiver_id,
    receiver_name,
    receiver_type,
    COUNT(DISTINCT sender_id) AS distinct_senders,
    COUNT(*) AS total_receipts,
    ROUND(SUM(amount), 2) AS total_inflow_inr,
    ROUND(AVG(amount), 2) AS avg_receipt_inr
FROM transactions
WHERE receiver_type = 'individual'
GROUP BY receiver_id, receiver_name, receiver_type
HAVING COUNT(DISTINCT sender_id) > 5
ORDER BY distinct_senders DESC
LIMIT 10;

-- Query 9: Rolling 1-Hour Velocity Burst Analysis
SELECT 
    rolling_count_1h AS velocity_tier_1h,
    COUNT(*) AS transaction_count,
    ROUND(SUM(amount), 2) AS total_value_inr,
    ROUND(AVG(amount), 2) AS avg_value_inr,
    SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS simulated_fraud_instances
FROM transactions
GROUP BY rolling_count_1h
ORDER BY rolling_count_1h ASC;

-- Query 10: User-Level Baseline vs Current Transaction Ratio
SELECT 
    CASE 
        WHEN amount_to_mean_ratio < 1.0 THEN 'Below Historical Mean'
        WHEN amount_to_mean_ratio BETWEEN 1.0 AND 3.0 THEN '1x - 3x Mean'
        WHEN amount_to_mean_ratio BETWEEN 3.0 AND 5.0 THEN '3x - 5x Mean'
        WHEN amount_to_mean_ratio BETWEEN 5.0 AND 10.0 THEN '5x - 10x Mean (Spike)'
        ELSE 'Over 10x Historical Mean (Extreme)'
    END AS baseline_deviation_tier,
    COUNT(*) AS txn_count,
    ROUND(AVG(amount), 2) AS avg_amount_inr,
    SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS fraud_cases,
    ROUND(SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS fraud_rate_pct
FROM transactions
GROUP BY baseline_deviation_tier
ORDER BY fraud_rate_pct DESC;

-- Query 11: Extreme Deviations from Historical User Mean (Z-Scores)
SELECT 
    id,
    timestamp,
    sender_id,
    sender_name,
    amount,
    user_historical_mean,
    user_historical_std,
    ROUND((amount - user_historical_mean) / MAX(1.0, user_historical_std), 2) AS z_score,
    is_fraud_simulated
FROM transactions
WHERE (amount - user_historical_mean) / MAX(1.0, user_historical_std) >= 4.0
ORDER BY z_score DESC
LIMIT 15;

-- Query 12: Device Switch Velocity & Security Implications
SELECT 
    is_device_changed,
    COUNT(*) AS total_transactions,
    ROUND(AVG(amount), 2) AS avg_amount_inr,
    SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS fraud_count,
    ROUND(SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS fraud_rate_pct
FROM transactions
GROUP BY is_device_changed;

-- Query 13: Geographic Location Hops & Impossible Transit
SELECT 
    location_city,
    COUNT(*) AS txn_count,
    SUM(CASE WHEN is_location_changed = 1 THEN 1 ELSE 0 END) AS location_change_events,
    SUM(CASE WHEN is_location_changed = 1 AND time_since_last_txn_sec < 1800 THEN 1 ELSE 0 END) AS impossible_travel_alerts,
    ROUND(AVG(amount), 2) AS avg_amount_inr
FROM transactions
GROUP BY location_city
ORDER BY impossible_travel_alerts DESC;

-- Query 14: Risk Category Distribution & Alert Tiers
SELECT 
    d.risk_level,
    COUNT(t.id) AS transaction_count,
    ROUND(SUM(t.amount), 2) AS aggregate_value_inr,
    ROUND(AVG(d.ensemble_risk_score), 2) AS avg_risk_score,
    SUM(CASE WHEN t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS simulated_fraud_count,
    ROUND(SUM(CASE WHEN t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(t.id), 2) AS ground_truth_precision_pct
FROM transactions t
JOIN detection_results d ON t.id = d.transaction_id
GROUP BY d.risk_level
ORDER BY avg_risk_score DESC;

-- Query 15: Detection Method Agreement & Consensus Analysis
SELECT 
    d.iqr_flag,
    d.iforest_flag,
    d.timeseries_flag,
    COUNT(*) AS txn_count,
    ROUND(AVG(t.amount), 2) AS avg_amount_inr,
    SUM(CASE WHEN t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS simulated_fraud_count,
    ROUND(SUM(CASE WHEN t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS consensus_precision_pct
FROM detection_results d
JOIN transactions t ON d.transaction_id = t.id
WHERE d.iqr_flag = 1 OR d.iforest_flag = 1 OR d.timeseries_flag = 1
GROUP BY d.iqr_flag, d.iforest_flag, d.timeseries_flag
ORDER BY consensus_precision_pct DESC;

-- Query 16: Flagged Transaction Value by Merchant Vertical
SELECT 
    t.merchant_category,
    COUNT(t.id) AS flagged_txns,
    ROUND(SUM(t.amount), 2) AS flagged_exposure_inr,
    ROUND(AVG(t.amount), 2) AS avg_flagged_ticket_inr,
    ROUND(MAX(t.amount), 2) AS max_flagged_ticket_inr
FROM transactions t
JOIN detection_results d ON t.id = d.transaction_id
WHERE d.risk_level IN ('HIGH', 'CRITICAL')
GROUP BY t.merchant_category
ORDER BY flagged_exposure_inr DESC;

-- Query 17: Investigation Queue Status & Operational Workload
SELECT 
    i.review_status,
    COUNT(i.id) AS alert_count,
    ROUND(SUM(t.amount), 2) AS value_under_review_inr,
    ROUND(AVG(d.ensemble_risk_score), 2) AS avg_queue_risk_score,
    SUM(CASE WHEN d.risk_level = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_priority_cases
FROM investigations i
JOIN transactions t ON i.transaction_id = t.id
JOIN detection_results d ON t.id = d.transaction_id
GROUP BY i.review_status
ORDER BY alert_count DESC;

-- Query 18: False Positive Analysis: Legitimate High-Value Spenders
SELECT 
    t.id,
    t.sender_id,
    t.merchant_category,
    t.amount,
    t.user_historical_mean,
    d.ensemble_risk_score,
    d.iqr_flag,
    d.iforest_flag,
    d.timeseries_flag
FROM transactions t
JOIN detection_results d ON t.id = d.transaction_id
WHERE t.is_fraud_simulated = 0 AND d.risk_level IN ('HIGH', 'CRITICAL')
ORDER BY t.amount DESC
LIMIT 10;

-- Query 19: Precision, Recall, and Ground-Truth Confusion Metrics
SELECT 
    SUM(CASE WHEN d.risk_level IN ('HIGH', 'CRITICAL') AND t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS true_positives,
    SUM(CASE WHEN d.risk_level IN ('HIGH', 'CRITICAL') AND t.is_fraud_simulated = 0 THEN 1 ELSE 0 END) AS false_positives,
    SUM(CASE WHEN d.risk_level NOT IN ('HIGH', 'CRITICAL') AND t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS false_negatives,
    SUM(CASE WHEN d.risk_level NOT IN ('HIGH', 'CRITICAL') AND t.is_fraud_simulated = 0 THEN 1 ELSE 0 END) AS true_negatives,
    ROUND(
        SUM(CASE WHEN d.risk_level IN ('HIGH', 'CRITICAL') AND t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 /
        MAX(1, SUM(CASE WHEN d.risk_level IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END)), 2
    ) AS precision_pct,
    ROUND(
        SUM(CASE WHEN d.risk_level IN ('HIGH', 'CRITICAL') AND t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 /
        MAX(1, SUM(CASE WHEN t.is_fraud_simulated = 1 THEN 1 ELSE 0 END)), 2
    ) AS recall_pct
FROM transactions t
JOIN detection_results d ON t.id = d.transaction_id;

-- Query 20: Bi-Weekly Period-over-Period Risk Shift
WITH period_partitioned AS (
    SELECT 
        id,
        amount,
        is_fraud_simulated,
        CASE 
            WHEN timestamp < (SELECT datetime(MIN(timestamp), '+17 days') FROM transactions) 
            THEN 'Period 1 (Initial 17 Days)'
            ELSE 'Period 2 (Subsequent 17 Days)'
        END AS observation_period
    FROM transactions
)
SELECT 
    observation_period,
    COUNT(*) AS txn_volume,
    ROUND(SUM(amount), 2) AS total_amount_inr,
    ROUND(AVG(amount), 2) AS avg_amount_inr,
    SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS fraud_instances,
    ROUND(SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS fraud_rate_pct
FROM period_partitioned
GROUP BY observation_period
ORDER BY observation_period ASC;

-- -----------------------------------------------------------------------------
-- Query 21: Saved Analyst Credentials & Authentication Audit Log
-- -----------------------------------------------------------------------------
SELECT 
    id,
    email,
    provider,
    full_name,
    role,
    login_count,
    last_login_at,
    created_at
FROM users
ORDER BY last_login_at DESC;

-- -----------------------------------------------------------------------------
-- Query 22: Money Mule In-Degree Funneling & Aggregation Syndicate Analysis
-- -----------------------------------------------------------------------------
SELECT 
    receiver_id,
    receiver_name,
    COUNT(DISTINCT sender_id) AS distinct_payer_sources,
    COUNT(*) AS total_received_transfers,
    ROUND(SUM(amount), 2) AS total_settled_inr,
    ROUND(AVG(amount), 2) AS avg_transfer_inr,
    SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS simulated_mule_flags,
    ROUND(SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS mule_risk_rate_pct
FROM transactions
GROUP BY receiver_id, receiver_name
HAVING COUNT(DISTINCT sender_id) >= 5
ORDER BY distinct_payer_sources DESC, total_settled_inr DESC
LIMIT 15;

-- -----------------------------------------------------------------------------
-- Query 23: High-Net-Worth Legitimate Spender Divergence (False-Alarm Mitigation)
-- -----------------------------------------------------------------------------
SELECT 
    t.sender_id,
    t.sender_name,
    ROUND(AVG(t.amount), 2) AS user_avg_spend_inr,
    ROUND(MAX(t.amount), 2) AS peak_ticket_inr,
    COUNT(*) AS total_payments,
    SUM(CASE WHEN d.iqr_flag = 1 AND t.is_fraud_simulated = 0 THEN 1 ELSE 0 END) AS false_positive_iqr_alerts,
    ROUND(SUM(CASE WHEN d.iqr_flag = 1 AND t.is_fraud_simulated = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS false_alarm_rate_pct
FROM transactions t
JOIN detection_results d ON t.id = d.transaction_id
GROUP BY t.sender_id, t.sender_name
HAVING AVG(t.amount) >= 15000.0
ORDER BY user_avg_spend_inr DESC
LIMIT 15;

-- -----------------------------------------------------------------------------
-- Query 24: Investigation Queue Resolution Status & Workload Distribution
-- -----------------------------------------------------------------------------
SELECT 
    review_status,
    COUNT(*) AS total_cases,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM investigations), 2) AS workload_distribution_pct,
    COUNT(analyst_notes) AS cases_with_notes,
    COUNT(DISTINCT analyst_id) AS active_investigators
FROM investigations
GROUP BY review_status
ORDER BY total_cases DESC;

-- -----------------------------------------------------------------------------
-- Query 25: Sender Account Spend Velocity & Micro-Probe Drain Clusters
-- -----------------------------------------------------------------------------
SELECT 
    sender_id,
    sender_name,
    COUNT(*) AS total_transfers,
    ROUND(SUM(amount), 2) AS cumulative_drain_inr,
    ROUND(AVG(time_since_last_txn_sec), 1) AS avg_inter_transaction_seconds,
    SUM(CASE WHEN time_since_last_txn_sec <= 180 THEN 1 ELSE 0 END) AS rapid_burst_count
FROM transactions
WHERE time_since_last_txn_sec > 0
GROUP BY sender_id, sender_name
HAVING COUNT(*) >= 10 AND AVG(time_since_last_txn_sec) <= 900
ORDER BY rapid_burst_count DESC, cumulative_drain_inr DESC
LIMIT 15;

-- -----------------------------------------------------------------------------
-- Query 26: Geographic Transit Velocity & Impossible Metro Hop Audit
-- -----------------------------------------------------------------------------
SELECT 
    id,
    sender_id,
    location_city AS current_city,
    device_type,
    amount,
    time_since_last_txn_sec,
    is_location_changed,
    is_device_changed,
    is_fraud_simulated
FROM transactions
WHERE is_location_changed = 1 AND time_since_last_txn_sec <= 1800
ORDER BY time_since_last_txn_sec ASC
LIMIT 20;
