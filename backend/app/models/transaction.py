import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    sender_id = Column(String(64), nullable=False, index=True)
    sender_name = Column(String(128), nullable=False)
    receiver_id = Column(String(64), nullable=False, index=True)
    receiver_name = Column(String(128), nullable=False)
    receiver_type = Column(String(32), nullable=False, default="merchant")  # merchant, individual
    merchant_category = Column(String(64), nullable=False, index=True)
    amount = Column(Float, nullable=False, index=True)
    currency = Column(String(8), nullable=False, default="INR")
    status = Column(String(32), nullable=False, default="SUCCESS")  # SUCCESS, FAILED
    device_id = Column(String(64), nullable=False)
    device_type = Column(String(32), nullable=False, default="Android")  # Android, iOS, Web
    ip_address = Column(String(64), nullable=False)
    location_city = Column(String(64), nullable=False)
    channel = Column(String(32), nullable=False, default="UPI_APP")  # UPI_APP, QR_CODE, PAYMENT_GATEWAY
    is_device_changed = Column(Boolean, nullable=False, default=False)
    is_location_changed = Column(Boolean, nullable=False, default=False)
    time_since_last_txn_sec = Column(Float, nullable=False, default=0.0)
    rolling_count_1h = Column(Integer, nullable=False, default=1)
    rolling_amount_1h = Column(Float, nullable=False, default=0.0)
    rolling_count_24h = Column(Integer, nullable=False, default=1)
    rolling_amount_24h = Column(Float, nullable=False, default=0.0)
    user_historical_mean = Column(Float, nullable=False, default=0.0)
    user_historical_std = Column(Float, nullable=False, default=0.0)
    amount_to_mean_ratio = Column(Float, nullable=False, default=1.0)
    
    # Strictly separated simulated ground-truth label
    is_fraud_simulated = Column(Boolean, nullable=False, default=False, index=True)
    fraud_scenario_tag = Column(String(64), nullable=False, default="NONE")

    detection = relationship("DetectionResult", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
    investigation = relationship("Investigation", back_populates="transaction", uselist=False, cascade="all, delete-orphan")


class DetectionResult(Base):
    __tablename__ = "detection_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(64), ForeignKey("transactions.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    
    # Method 1: IQR
    iqr_flag = Column(Boolean, nullable=False, default=False)
    iqr_score = Column(Float, nullable=False, default=0.0)
    iqr_reason = Column(String(256), nullable=False, default="")

    # Method 2: Isolation Forest
    iforest_flag = Column(Boolean, nullable=False, default=False)
    iforest_score = Column(Float, nullable=False, default=0.0)
    iforest_reason = Column(String(256), nullable=False, default="")

    # Method 3: Rolling Time-Series
    timeseries_flag = Column(Boolean, nullable=False, default=False)
    timeseries_score = Column(Float, nullable=False, default=0.0)
    timeseries_reason = Column(String(256), nullable=False, default="")

    # Ensemble risk score (0-100) and risk level
    ensemble_risk_score = Column(Float, nullable=False, default=0.0, index=True)
    risk_level = Column(String(32), nullable=False, default="LOW", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    detection_signals = Column(Text, nullable=False, default="[]")  # JSON array string
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    transaction = relationship("Transaction", back_populates="detection")


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(64), ForeignKey("transactions.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    review_status = Column(String(32), nullable=False, default="New", index=True)  # New, Under Review, Reviewed, Escalated
    analyst_notes = Column(Text, nullable=True)
    analyst_id = Column(String(64), nullable=True, default="analyst_01")
    escalation_reason = Column(String(256), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    transaction = relationship("Transaction", back_populates="investigation")


class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(String(32), nullable=False)
    total_records = Column(Integer, nullable=False)
    fraud_count = Column(Integer, nullable=False)
    fraud_rate = Column(Float, nullable=False)
    date_start = Column(DateTime, nullable=False)
    date_end = Column(DateTime, nullable=False)
    random_seed = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
