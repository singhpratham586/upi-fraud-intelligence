from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class WhatIfRequest(BaseModel):
    transaction_id: Optional[str] = Field(None, description="Original transaction ID to clone and modify")
    amount: float = Field(..., ge=1.0, description="Hypothetical transaction amount in INR")
    time_since_last_txn_sec: float = Field(3600.0, ge=0.0, description="Inter-transaction delay in seconds")
    rolling_count_1h: int = Field(1, ge=1, description="Number of transfers sent in past 60 minutes")
    merchant_category: str = Field("grocery", description="Merchant vertical")
    is_device_changed: bool = Field(False, description="Whether sender switched device")
    is_location_changed: bool = Field(False, description="Whether sender hopped geographic location")
    user_historical_mean: float = Field(2500.0, ge=10.0, description="User baseline historical average ticket")
    user_historical_std: float = Field(800.0, ge=1.0, description="User baseline standard deviation")

class DetectorOutput(BaseModel):
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
    detection_signals: List[str]

class FeatureAttribution(BaseModel):
    factor: str
    points: float
    description: str

class WhatIfResponse(BaseModel):
    original_id: Optional[str]
    original: Optional[DetectorOutput] = None
    modified: DetectorOutput
    score_delta: float
    new_signals: List[str]
    cleared_signals: List[str]
    explanation: str
    attribution: List[FeatureAttribution]
