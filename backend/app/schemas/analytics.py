from typing import List, Optional
from pydantic import BaseModel

class OverviewMetrics(BaseModel):
    total_transactions: int
    total_transaction_value: float
    flagged_transactions: int
    flagged_rate_pct: float
    simulated_fraud_count: int
    simulated_fraud_rate_pct: float
    estimated_flagged_value: float
    false_positive_rate_pct: float
    precision_pct: float
    recall_pct: float
    f1_score_pct: float
    reviewed_count: int
    pending_investigation_count: int

class TrendPoint(BaseModel):
    date: str
    total_count: int
    flagged_count: int
    fraud_simulated_count: int
    total_amount: float
    flagged_amount: float

class HourlyHeatmapPoint(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    day_name: str
    hour: int
    total_count: int
    flagged_count: int
    avg_amount: float

class CategoryBreakdownPoint(BaseModel):
    category: str
    transaction_count: int
    total_amount: float
    flagged_count: int
    fraud_simulated_count: int
    flagged_rate_pct: float
    avg_amount: float

class AmountDistributionBin(BaseModel):
    range_label: str
    min_val: float
    max_val: float
    normal_count: int
    flagged_count: int
    fraud_simulated_count: int

class MethodAgreementStats(BaseModel):
    iqr_only: int
    iforest_only: int
    timeseries_only: int
    iqr_and_iforest: int
    iqr_and_timeseries: int
    iforest_and_timeseries: int
    all_three: int
    total_flagged: int

class HighRiskTrendPoint(BaseModel):
    date: str
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int

class InsightItem(BaseModel):
    id: str
    type: str  # info, warning, success
    title: str
    observation: str
    data_support: str
    metric_value: Optional[str] = None

class AnalyticsDashboardData(BaseModel):
    kpis: OverviewMetrics
    volume_trends: List[TrendPoint]
    hourly_heatmap: List[HourlyHeatmapPoint]
    category_breakdown: List[CategoryBreakdownPoint]
    amount_distribution: List[AmountDistributionBin]
    method_agreement: MethodAgreementStats
    high_risk_trends: List[HighRiskTrendPoint]
    deterministic_insights: List[InsightItem]
