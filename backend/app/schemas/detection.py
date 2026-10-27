from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class IQRConfig(BaseModel):
    feature: str = Field(default="amount", description="Feature to test: amount, rolling_amount_1h, amount_to_mean_ratio")
    multiplier: float = Field(default=1.5, ge=1.0, le=5.0, description="IQR multiplier (typically 1.5 for outliers, 3.0 for extreme)")

class IForestConfig(BaseModel):
    contamination: float = Field(default=0.03, ge=0.001, le=0.20, description="Contamination factor")
    features: List[str] = Field(
        default=["amount", "rolling_count_1h", "rolling_amount_1h", "amount_to_mean_ratio", "time_since_last_txn_sec"],
        description="Features to train Isolation Forest"
    )
    n_estimators: int = Field(default=100, ge=50, le=300)
    random_seed: int = Field(default=42)

class TimeSeriesConfig(BaseModel):
    velocity_count_threshold: int = Field(default=4, ge=2, le=20, description="Max 1-hour transaction count threshold")
    amount_deviation_sigma: float = Field(default=3.0, ge=1.5, le=6.0, description="Std dev multiples from historical mean")
    short_window_seconds: int = Field(default=300, description="Burst window in seconds (e.g. 5 minutes)")

class DetectionRunRequest(BaseModel):
    iqr: Optional[IQRConfig] = None
    iforest: Optional[IForestConfig] = None
    timeseries: Optional[TimeSeriesConfig] = None

class ModelMetrics(BaseModel):
    model_name: str
    total_alerts: int
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    pr_auc: Optional[float] = None
    evaluation_sample_size: int
    flagged_amount_sum: float

class AnomalyScoreHistogramBin(BaseModel):
    bin_range: str
    bin_start: float
    bin_end: float
    count: int
    fraud_simulated_count: int

class DetectionRunResponse(BaseModel):
    status: str
    total_evaluated: int
    iqr_flagged: int
    iforest_flagged: int
    timeseries_flagged: int
    ensemble_high_risk: int
    model_comparison: List[ModelMetrics]
    score_distribution: List[AnomalyScoreHistogramBin]

class GovernancePolicyBenchmark(BaseModel):
    policy_name: str
    policy_key: str
    description: str
    iqr_multiplier: float
    iforest_contamination: float
    velocity_threshold: int
    total_alerts: int
    true_positives: int
    false_positives: int
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    flagged_amount_sum: float
    estimated_fraud_prevented: float
    estimated_investigation_cost: float
    net_business_value: float
    suitability: str

class GovernanceBenchmarksResponse(BaseModel):
    status: str
    total_records: int
    simulated_fraud_count: int
    total_fraud_volume: float
    policies: List[GovernancePolicyBenchmark]
    optimal_policy: str
    strategic_guidance: str
