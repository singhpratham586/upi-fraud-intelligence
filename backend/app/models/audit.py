import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(64), index=True, nullable=False)
    action = Column(String(64), nullable=False)  # STATUS_CHANGE, NOTE_ADDED, ESCALATION, REVIEW_CLOSED
    previous_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=True)
    analyst_id = Column(String(64), nullable=False, default="analyst_01")
    analyst_name = Column(String(128), nullable=True, default="Lead Risk Analyst")
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
