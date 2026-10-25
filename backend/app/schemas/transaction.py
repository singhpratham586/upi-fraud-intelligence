from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class InvestigationUpdate(BaseModel):
    review_status: str = Field(..., description="New, Under Review, Reviewed, Escalated")
    analyst_notes: Optional[str] = None
    analyst_id: Optional[str] = "analyst_01"
    escalation_reason: Optional[str] = None

class InvestigationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: str
    review_status: str
    analyst_notes: Optional[str] = None
    analyst_id: Optional[str] = None
    escalation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class DetectionResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: str
    iqr_flag: bool
    iqr_score: float
    iqr_reason: str
    iforest_flag: bool
    iforest_score: float
    iforest_reason: str
    timeseries_flag: bool
    timeseries_score: float
    timeseries_reason: str
    ensemble_risk_score: float
    risk_level: str
    detection_signals: str
    created_at: datetime

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    sender_id: str
    sender_name: str
    receiver_id: str
    receiver_name: str
    receiver_type: str
    merchant_category: str
    amount: float
    currency: str
    status: str
    device_id: str
    device_type: str
    location_city: str
    channel: str
    is_device_changed: bool
    is_location_changed: bool
    time_since_last_txn_sec: float
    rolling_count_1h: int
    rolling_amount_1h: float
    rolling_count_24h: int
    rolling_amount_24h: float
    user_historical_mean: float
    user_historical_std: float
    amount_to_mean_ratio: float
    is_fraud_simulated: bool
    fraud_scenario_tag: str
    
    # Associated records
    detection: Optional[DetectionResultResponse] = None
    investigation: Optional[InvestigationResponse] = None

class TransactionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    transactions: List[TransactionResponse]
