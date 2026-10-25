from typing import List, Optional
from pydantic import BaseModel, Field

class BusinessImpactSimRequest(BaseModel):
    cost_per_investigation: float = Field(default=350.0, ge=10.0, le=10000.0, description="Cost in INR per investigated alert")
    loss_recovery_rate_pct: float = Field(default=85.0, ge=0.0, le=100.0, description="Estimated percentage of fraud loss averted if caught")
    unmitigated_loss_multiplier: float = Field(default=1.2, ge=1.0, le=3.0, description="Indirect cost multiplier for uncaught fraud (chargebacks, operational overhead)")
    selected_model: str = Field(default="ensemble", description="ensemble, iqr, iforest, timeseries")
    risk_score_threshold: float = Field(default=65.0, ge=10.0, le=95.0, description="Risk threshold for triggering alert")

class ThresholdTradeoffPoint(BaseModel):
    threshold: float
    alert_volume: int
    true_positives: int
    false_positives: int
    precision: float
    recall: float
    investigation_cost: float
    loss_avoided: float
    net_benefit: float

class BusinessImpactSimResponse(BaseModel):
    selected_model: str
    configured_threshold: float
    investigation_workload_alerts: int
    true_positives: int
    false_positives: int
    missed_simulated_fraud: int
    simulated_fraud_amount_total: float
    estimated_loss_avoided: float
    total_investigation_cost: float
    residual_unmitigated_loss: float
    estimated_net_benefit: float
    roi_percentage: float
    tradeoff_curve: List[ThresholdTradeoffPoint]
    formula_explanation: str
