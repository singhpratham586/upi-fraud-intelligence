from typing import List, Dict, Any
import time
from sqlalchemy import text
from sqlalchemy.orm import Session

SQL_QUERIES: List[Dict[str, Any]] = [
    {
        "id": 1,
        "title": "Total Transaction Volume & Aggregate Throughput",
        "category": "Volume & Scale",
        "dashboard_link": "/dashboard",
        "business_question": "What is the total transaction volume processed, success rate, and active user base across the platform?",
        "sql": """SELECT 
    COUNT(*) AS total_transactions,
    ROUND(SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS success_rate_pct,
    COUNT(DISTINCT sender_id) AS distinct_senders,
    COUNT(DISTINCT receiver_id) AS distinct_receivers,
    ROUND(SUM(amount), 2) AS gross_transaction_value_inr
FROM transactions;""",
        "explanation": "Summarizes macro operational scale across the entire payment processing pipeline, validating throughput and unique participant reach.",
        "expected_interpretation": "Provides the foundational denominator for all subsequent risk and fraud proportion calculations."
    },
    {
        "id": 2,
        "title": "Aggregate Transaction Value & Average Ticket Size",
        "category": "Value & Sizing",
        "dashboard_link": "/dashboard",
        "business_question": "What are the macro value distributions including mean, minimum, and maximum transaction tickets?",
        "sql": """SELECT 
    ROUND(SUM(amount), 2) AS total_settlement_value_inr,
    ROUND(AVG(amount), 2) AS avg_ticket_size_inr,
    ROUND(MIN(amount), 2) AS min_ticket_size_inr,
    ROUND(MAX(amount), 2) AS max_ticket_size_inr
FROM transactions
WHERE status = 'SUCCESS';""",
        "explanation": "Calculates central tendency and extreme bounds of settled UPI transfer amounts.",
        "expected_interpretation": "Helps distinguish standard retail payment sizes (e.g. ₹300-₹1500) from corporate or high-net-worth upper boundaries."
    },
    {
        "id": 3,
        "title": "Daily Transaction Velocity & Value Trends",
        "category": "Temporal Trends",
        "dashboard_link": "/dashboard",
        "business_question": "How do daily transaction counts and aggregate transaction volumes trend over the past 30 days?",
        "sql": """SELECT 
    SUBSTR(timestamp, 1, 10) AS txn_date,
    COUNT(*) AS daily_txn_count,
    ROUND(SUM(amount), 2) AS daily_amount_inr,
    ROUND(AVG(amount), 2) AS daily_avg_amount_inr
FROM transactions
GROUP BY SUBSTR(timestamp, 1, 10)
ORDER BY txn_date DESC
LIMIT 14;""",
        "explanation": "Aggregates day-by-day throughput, identifying seasonality, weekly patterns, or sudden platform-wide volume surges.",
        "expected_interpretation": "Reveals weekday vs weekend differences in transaction habits and flags days with atypical spikes."
    },
    {
        "id": 4,
        "title": "Hourly Diurnal Pattern & Night-Window Risk",
        "category": "Temporal Trends",
        "dashboard_link": "/dashboard",
        "business_question": "What is the distribution of transactions by hour of the day, and do late-night hours have higher average amounts?",
        "sql": """SELECT 
    CAST(SUBSTR(timestamp, 12, 2) AS INTEGER) AS hour_of_day,
    COUNT(*) AS txn_count,
    ROUND(SUM(amount), 2) AS total_amount_inr,
    ROUND(AVG(amount), 2) AS avg_ticket_inr,
    SUM(CASE WHEN CAST(SUBSTR(timestamp, 12, 2) AS INTEGER) BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS is_graveyard_hour
FROM transactions
GROUP BY hour_of_day
ORDER BY hour_of_day ASC;""",
        "explanation": "Evaluates the diurnal cycle of UPI payments. Retail payments typically crater between 01:00 and 05:00.",
        "expected_interpretation": "Late-night hours with elevated average tickets signal potential automated draining or stolen device activity."
    },
    {
        "id": 5,
        "title": "Merchant Category Breakdown & Risk Distribution",
        "category": "Category Analytics",
        "dashboard_link": "/dashboard",
        "business_question": "Which merchant categories account for the largest proportion of volume and flagged suspicious activity?",
        "sql": """SELECT 
    t.merchant_category,
    COUNT(t.id) AS total_txns,
    ROUND(SUM(t.amount), 2) AS total_value_inr,
    ROUND(AVG(t.amount), 2) AS avg_value_inr,
    SUM(CASE WHEN d.risk_level IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) AS high_risk_alerts,
    ROUND(SUM(CASE WHEN d.risk_level IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) * 100.0 / COUNT(t.id), 2) AS high_risk_rate_pct
FROM transactions t
LEFT JOIN detection_results d ON t.id = d.transaction_id
GROUP BY t.merchant_category
ORDER BY high_risk_alerts DESC;""",
        "explanation": "Correlates category vertical (e.g., luxury jewelry, crypto, peer transfer) with risk alert density.",
        "expected_interpretation": "High-risk categories like peer-to-peer and luxury goods typically exhibit higher anomaly alert rates."
    },
    {
        "id": 6,
        "title": "Transaction Amount Percentile & Tail Exposure",
        "category": "Value & Sizing",
        "dashboard_link": "/detection-lab",
        "business_question": "How is transaction value distributed across percentiles and what constitutes the extreme upper decile?",
        "sql": """WITH ranked_txns AS (
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
FROM ranked_txns;""",
        "explanation": "Calculates exact distribution percentiles using SQL window ranking, underpinning the IQR outlier detection baseline.",
        "expected_interpretation": "Shows the heavy right-tail of financial transaction distributions where standard normal assumptions fail."
    },
    {
        "id": 7,
        "title": "High-Frequency Transacting Accounts (Velocity Profiling)",
        "category": "User Profiling",
        "dashboard_link": "/transactions",
        "business_question": "Which user accounts exhibit extreme transaction frequency and high aggregate throughput?",
        "sql": """SELECT 
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
LIMIT 10;""",
        "explanation": "Identifies aggressive transactors or potential bot/scripted accounts with sustained multi-day activity.",
        "expected_interpretation": "Distinguishes high-net-worth commercial spenders from compromised accounts suffering velocity bursts."
    },
    {
        "id": 8,
        "title": "Repeated Receiver Funneling (Syndicate Detection)",
        "category": "Network & Graph",
        "dashboard_link": "/transactions",
        "business_question": "Which beneficiary accounts receive funds from an unusually large pool of distinct senders?",
        "sql": """SELECT 
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
LIMIT 10;""",
        "explanation": "Targets individual beneficiary nodes receiving transfers from multiple unconnected parties.",
        "expected_interpretation": "Key indicator for money mule syndicate hubs where funds are consolidated before rapid off-ramping."
    },
    {
        "id": 9,
        "title": "Rolling 1-Hour Velocity Burst Analysis",
        "category": "Temporal Trends",
        "dashboard_link": "/detection-lab",
        "business_question": "What proportion of transactions breach short-term velocity thresholds (>3 transactions within 1 hour)?",
        "sql": """SELECT 
    rolling_count_1h AS velocity_tier_1h,
    COUNT(*) AS transaction_count,
    ROUND(SUM(amount), 2) AS total_value_inr,
    ROUND(AVG(amount), 2) AS avg_value_inr,
    SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS simulated_fraud_instances
FROM transactions
GROUP BY rolling_count_1h
ORDER BY rolling_count_1h ASC;""",
        "explanation": "Analyzes the empirical correlation between rapid 1-hour burst velocity and confirmed simulated fraud events.",
        "expected_interpretation": "Demonstrates that higher velocity tiers (>4 txns/hr) carry exponentially higher probability of unauthorized account takeover."
    },
    {
        "id": 10,
        "title": "User-Level Baseline vs Current Transaction Ratio",
        "category": "User Profiling",
        "dashboard_link": "/detection-lab",
        "business_question": "How often do transactions exceed 5x to 10x the sender's established historical spending baseline?",
        "sql": """SELECT 
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
ORDER BY fraud_rate_pct DESC;""",
        "explanation": "Evaluates transaction amount relative to individual user history rather than global population averages.",
        "expected_interpretation": "Proves that personalized z-scores and mean ratios outperform static global thresholds."
    },
    {
        "id": 11,
        "title": "Extreme Deviations from Historical User Mean (Z-Scores)",
        "category": "Anomaly Detection",
        "dashboard_link": "/detection-lab",
        "business_question": "Which transactions represent severe statistical departures (>4 standard deviations) from user habit?",
        "sql": """SELECT 
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
LIMIT 15;""",
        "explanation": "Identifies extreme upper-tail univariate outliers conditioned strictly on individual sender variance.",
        "expected_interpretation": "Reveals single high-impact transactions that breach behavioral norms even if absolute amount is within bank caps."
    },
    {
        "id": 12,
        "title": "Device Switch Velocity & Security Implications",
        "category": "Device & Context",
        "dashboard_link": "/transactions",
        "business_question": "Does transacting from a new/changed device correlate with higher fraud propensity and higher tickets?",
        "sql": """SELECT 
    is_device_changed,
    COUNT(*) AS total_transactions,
    ROUND(AVG(amount), 2) AS avg_amount_inr,
    SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS fraud_count,
    ROUND(SUM(CASE WHEN is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS fraud_rate_pct
FROM transactions
GROUP BY is_device_changed;""",
        "explanation": "Measures the risk multiplier associated with new device tokens or device fingerprint shifts.",
        "expected_interpretation": "Validates device fingerprint consistency as an essential fraud deterrent in mobile banking."
    },
    {
        "id": 13,
        "title": "Geographic Location Hops & Impossible Transit",
        "category": "Device & Context",
        "dashboard_link": "/transactions",
        "business_question": "How frequently do transactions occur across different cities with insufficient travel elapsed time?",
        "sql": """SELECT 
    location_city,
    COUNT(*) AS txn_count,
    SUM(CASE WHEN is_location_changed = 1 THEN 1 ELSE 0 END) AS location_change_events,
    SUM(CASE WHEN is_location_changed = 1 AND time_since_last_txn_sec < 1800 THEN 1 ELSE 0 END) AS impossible_travel_alerts,
    ROUND(AVG(amount), 2) AS avg_amount_inr
FROM transactions
GROUP BY location_city
ORDER BY impossible_travel_alerts DESC;""",
        "explanation": "Detects impossible velocity across geographic regions where time delta between distinct city IPs is under 30 minutes.",
        "expected_interpretation": "Pinpoints distributed account takeovers or proxy/VPN hopping fraud vectors."
    },
    {
        "id": 14,
        "title": "Risk Category Distribution & Alert Tiers",
        "category": "Risk Governance",
        "dashboard_link": "/dashboard",
        "business_question": "What is the breakdown of processed transactions across Low, Medium, High, and Critical risk tiers?",
        "sql": """SELECT 
    d.risk_level,
    COUNT(t.id) AS transaction_count,
    ROUND(SUM(t.amount), 2) AS aggregate_value_inr,
    ROUND(AVG(d.ensemble_risk_score), 2) AS avg_risk_score,
    SUM(CASE WHEN t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) AS simulated_fraud_count,
    ROUND(SUM(CASE WHEN t.is_fraud_simulated = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(t.id), 2) AS ground_truth_precision_pct
FROM transactions t
JOIN detection_results d ON t.id = d.transaction_id
GROUP BY d.risk_level
ORDER BY avg_risk_score DESC;""",
        "explanation": "Validates the tiering calibration of the multi-model ensemble risk engine.",
        "expected_interpretation": "Demonstrates high concentration of true simulated fraud within the Critical and High tiers."
    },
    {
        "id": 15,
        "title": "Detection Method Agreement & Consensus Analysis",
        "category": "Model Performance",
        "dashboard_link": "/detection-lab",
        "business_question": "How often do IQR, Isolation Forest, and Time-Series detectors agree on flagged transactions?",
        "sql": """SELECT 
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
ORDER BY consensus_precision_pct DESC;""",
        "explanation": "Evaluates multi-model consensus. When 2 or 3 models independently flag a record, precision increases markedly.",
        "expected_interpretation": "Confirms the core thesis that ensemble consensus suppresses single-method false alarms."
    },
    {
        "id": 16,
        "title": "Flagged Transaction Value by Merchant Vertical",
        "category": "Category Analytics",
        "dashboard_link": "/dashboard",
        "business_question": "What is the total flagged monetary exposure across specific merchant verticals?",
        "sql": """SELECT 
    t.merchant_category,
    COUNT(t.id) AS flagged_txns,
    ROUND(SUM(t.amount), 2) AS flagged_exposure_inr,
    ROUND(AVG(t.amount), 2) AS avg_flagged_ticket_inr,
    ROUND(MAX(t.amount), 2) AS max_flagged_ticket_inr
FROM transactions t
JOIN detection_results d ON t.id = d.transaction_id
WHERE d.risk_level IN ('HIGH', 'CRITICAL')
GROUP BY t.merchant_category
ORDER BY flagged_exposure_inr DESC;""",
        "explanation": "Quantifies financial capital at risk within flagged alerts, grouped by merchant category.",
        "expected_interpretation": "Guides merchant-specific risk controls, such as requiring Step-Up 2FA for luxury and crypto transactions."
    },
    {
        "id": 17,
        "title": "Investigation Queue Status & Operational Workload",
        "category": "Operations & Governance",
        "dashboard_link": "/transactions",
        "business_question": "What is the current operational backlog across investigation statuses (New, Under Review, Reviewed, Escalated)?",
        "sql": """SELECT 
    i.review_status,
    COUNT(i.id) AS alert_count,
    ROUND(SUM(t.amount), 2) AS value_under_review_inr,
    ROUND(AVG(d.ensemble_risk_score), 2) AS avg_queue_risk_score,
    SUM(CASE WHEN d.risk_level = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_priority_cases
FROM investigations i
JOIN transactions t ON i.transaction_id = t.id
JOIN detection_results d ON t.id = d.transaction_id
GROUP BY i.review_status
ORDER BY alert_count DESC;""",
        "explanation": "Tracks analyst capacity, case progression, and potential backlog risks in real time.",
        "expected_interpretation": "Assures compliance teams that Critical and High alerts are actively investigated and not idling in 'New'."
    },
    {
        "id": 18,
        "title": "False Positive Analysis: Legitimate High-Value Spenders",
        "category": "Model Performance",
        "dashboard_link": "/detection-lab",
        "business_question": "Which un-compromised transactions were incorrectly flagged as high risk, and what triggered the false alert?",
        "sql": """SELECT 
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
LIMIT 10;""",
        "explanation": "Audits model errors where benign customer transactions triggered alerts, causing analyst overhead.",
        "expected_interpretation": "Informs model hyperparameter tuning (e.g. lowering Isolation Forest contamination or raising IQR bounds)."
    },
    {
        "id": 19,
        "title": "Precision, Recall, and Ground-Truth Confusion Metrics",
        "category": "Model Performance",
        "dashboard_link": "/detection-lab",
        "business_question": "What is the empirical classification performance of the ensemble model against the independent ground-truth labels?",
        "sql": """SELECT 
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
JOIN detection_results d ON t.id = d.transaction_id;""",
        "explanation": "Calculates direct classification metrics natively in SQL against the separate simulated fraud ground truth.",
        "expected_interpretation": "Provides the quantitative benchmark demonstrating how well the platform isolates malicious activity."
    },
    {
        "id": 20,
        "title": "Bi-Weekly Period-over-Period Risk Shift",
        "category": "Temporal Trends",
        "dashboard_link": "/dashboard",
        "business_question": "How did transaction volume, flagged value, and alert rates evolve between the first and second halves of the dataset?",
        "sql": """WITH period_partitioned AS (
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
ORDER BY observation_period ASC;""",
        "explanation": "Executes period-over-period drift analysis to evaluate whether fraud frequency or volume is accelerating over time.",
        "expected_interpretation": "Allows risk leadership to evaluate macroeconomic or attacker behavioral drifts over time."
    },
    {
        "id": 21,
        "title": "Saved Analyst Credentials & Authentication Audit Log",
        "category": "Security & Audit",
        "dashboard_link": "/sql-insights",
        "business_question": "Which analyst accounts and login credentials have been saved in the platform dataset?",
        "sql": """SELECT 
    id,
    email,
    provider,
    full_name,
    role,
    login_count,
    last_login_at,
    created_at
FROM users
ORDER BY last_login_at DESC;""",
        "explanation": "Audits all authenticated platform operators and risk analysts saved in the PostgreSQL/SQLite user table.",
        "expected_interpretation": "Tracks platform operator credentials, primary Gmail logins vs Google/GitHub OAuth, and active investigator sessions."
    }
]

def execute_analytical_query(db: Session, query_id: int) -> Dict[str, Any]:
    """
    Executes a predefined analytical SQL query against the active database,
    measuring exact execution latency and returning formatted column/row payloads.
    """
    query_obj = next((q for q in SQL_QUERIES if q["id"] == query_id), None)
    if not query_obj:
        raise ValueError(f"Query ID {query_id} not found in SQL Library.")

    sql_code = query_obj["sql"]
    start_time = time.perf_counter()

    result = db.execute(text(sql_code))
    rows = result.fetchall()
    columns = list(result.keys())
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    formatted_rows = []
    for r in rows:
        row_dict = {}
        for col, val in zip(columns, r):
            if isinstance(val, (int, float, str, bool)) or val is None:
                row_dict[col] = val
            else:
                row_dict[col] = str(val)
        formatted_rows.append(row_dict)

    return {
        "query_id": query_obj["id"],
        "title": query_obj["title"],
        "executed_sql": sql_code,
        "execution_time_ms": elapsed_ms,
        "row_count": len(formatted_rows),
        "columns": columns,
        "rows": formatted_rows,
        "explanation": query_obj["explanation"],
        "interpretation": query_obj["expected_interpretation"]
    }
