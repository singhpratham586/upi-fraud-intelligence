export interface DetectionResult {
  id: number;
  transaction_id: string;
  iqr_flag: boolean;
  iqr_score: number;
  iqr_reason: string;
  iforest_flag: boolean;
  iforest_score: number;
  iforest_reason: string;
  timeseries_flag: boolean;
  timeseries_score: number;
  timeseries_reason: string;
  ensemble_risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detection_signals: string;
  created_at: string;
}

export interface Investigation {
  id: number;
  transaction_id: string;
  review_status: 'New' | 'Under Review' | 'Reviewed' | 'Escalated';
  analyst_notes?: string | null;
  analyst_id?: string | null;
  escalation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  receiver_type: string;
  merchant_category: string;
  amount: number;
  currency: string;
  status: string;
  device_id: string;
  device_type: string;
  location_city: string;
  channel: string;
  is_device_changed: boolean;
  is_location_changed: boolean;
  time_since_last_txn_sec: number;
  rolling_count_1h: number;
  rolling_amount_1h: number;
  rolling_count_24h: number;
  rolling_amount_24h: number;
  user_historical_mean: number;
  user_historical_std: number;
  amount_to_mean_ratio: number;
  is_fraud_simulated: boolean;
  fraud_scenario_tag: string;
  detection?: DetectionResult | null;
  investigation?: Investigation | null;
}

export interface OverviewMetrics {
  total_transactions: number;
  total_transaction_value: number;
  flagged_transactions: number;
  flagged_rate_pct: number;
  simulated_fraud_count: number;
  simulated_fraud_rate_pct: number;
  estimated_flagged_value: number;
  false_positive_rate_pct: number;
  precision_pct: number;
  recall_pct: number;
  f1_score_pct: number;
  reviewed_count: number;
  pending_investigation_count: number;
}

export interface TrendPoint {
  date: string;
  total_count: number;
  total_amount: number;
  flagged_count: number;
  flagged_amount: number;
  fraud_simulated_count: number;
}

export interface HourlyHeatmapPoint {
  day_of_week: number;
  day_name: string;
  hour: number;
  total_count: number;
  flagged_count: number;
  avg_amount: number;
}

export interface CategoryBreakdownPoint {
  category: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
  flagged_count: number;
  fraud_simulated_count: number;
  flagged_rate_pct: number;
}

export interface AmountDistributionBin {
  range_label: string;
  min_val: number;
  max_val: number;
  normal_count: number;
  flagged_count: number;
  fraud_simulated_count: number;
}

export interface MethodAgreementStats {
  iqr_only: number;
  iforest_only: number;
  timeseries_only: number;
  iqr_and_iforest: number;
  iqr_and_timeseries: number;
  iforest_and_timeseries: number;
  all_three: number;
  total_flagged: number;
}

export interface HighRiskTrendPoint {
  date: string;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export interface InsightItem {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  observation: string;
  data_support: string;
  metric_value?: string | null;
}

export interface DashboardData {
  kpis: OverviewMetrics;
  volume_trends: TrendPoint[];
  hourly_heatmap: HourlyHeatmapPoint[];
  category_breakdown: CategoryBreakdownPoint[];
  amount_distribution: AmountDistributionBin[];
  method_agreement: MethodAgreementStats;
  high_risk_trends: HighRiskTrendPoint[];
  deterministic_insights: InsightItem[];
}

export interface ModelMetrics {
  model_name: string;
  total_alerts: number;
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  pr_auc?: number | null;
  evaluation_sample_size: number;
  flagged_amount_sum: number;
}

export interface AnomalyScoreHistogramBin {
  bin_range: string;
  bin_start: number;
  bin_end: number;
  count: number;
  fraud_simulated_count: number;
}

export interface DetectionRunResponse {
  status: string;
  total_evaluated: number;
  iqr_flagged: number;
  iforest_flagged: number;
  timeseries_flagged: number;
  ensemble_high_risk: number;
  model_comparison: ModelMetrics[];
  score_distribution: AnomalyScoreHistogramBin[];
}

export interface ThresholdTradeoffPoint {
  threshold: number;
  alert_volume: number;
  true_positives: number;
  false_positives: number;
  precision: number;
  recall: number;
  investigation_cost: number;
  loss_avoided: number;
  net_benefit: number;
}

export interface BusinessImpactSimResponse {
  selected_model: string;
  configured_threshold: number;
  investigation_workload_alerts: number;
  true_positives: number;
  false_positives: number;
  missed_simulated_fraud: number;
  simulated_fraud_amount_total: number;
  estimated_loss_avoided: number;
  total_investigation_cost: number;
  residual_unmitigated_loss: number;
  estimated_net_benefit: number;
  roi_percentage: number;
  tradeoff_curve: ThresholdTradeoffPoint[];
  formula_explanation: string;
}

export interface SQLQueryItem {
  id: number;
  title: string;
  business_question: string;
  sql: string;
  explanation: string;
  expected_interpretation: string;
  category: string;
  dashboard_link?: string | null;
}

export interface SQLQueryResult {
  query_id: number;
  title: string;
  executed_sql: string;
  execution_time_ms: number;
  row_count: number;
  columns: string[];
  rows: Record<string, any>[];
  explanation: string;
  interpretation: string;
}

export interface UserAccount {
  id: number;
  email: string;
  full_name: string;
  provider: 'gmail' | 'google' | 'github';
  avatar_url?: string | null;
  role: string;
  login_count: number;
  last_login_at: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: UserAccount;
}

export interface StoredCredentialRecord {
  id: number;
  email: string;
  provider: string;
  full_name: string;
  role: string;
  password_hint: string;
  login_count: number;
  last_login_at: string;
  created_at: string;
}
