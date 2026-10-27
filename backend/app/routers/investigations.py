import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import Investigation, Transaction
from app.models.audit import AuditEvent
from app.schemas.transaction import InvestigationUpdate, InvestigationResponse
from pydantic import BaseModel, ConfigDict

class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: str
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    analyst_id: str
    analyst_name: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime.datetime

router = APIRouter(prefix="/transactions", tags=["Investigations"])

@router.patch("/{transaction_id}/review", response_model=InvestigationResponse)
def update_transaction_investigation(
    transaction_id: str,
    payload: InvestigationUpdate,
    db: Session = Depends(get_db)
):
    valid_statuses = ["New", "Under Review", "Reviewed", "Escalated", "Closed"]
    if payload.review_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid review status '{payload.review_status}'. Must be one of {valid_statuses}."
        )

    # Check if transaction exists
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found.")

    inv = db.query(Investigation).filter(Investigation.transaction_id == transaction_id).first()
    now = datetime.datetime.utcnow()

    prev_status = inv.review_status if inv else "New"

    if not inv:
        # Create new record if one didn't exist
        inv = Investigation(
            transaction_id=transaction_id,
            review_status=payload.review_status,
            analyst_notes=payload.analyst_notes,
            analyst_id=payload.analyst_id or "analyst_01",
            escalation_reason=payload.escalation_reason,
            created_at=now,
            updated_at=now
        )
        db.add(inv)
    else:
        inv.review_status = payload.review_status
        if payload.analyst_notes is not None:
            inv.analyst_notes = payload.analyst_notes
        if payload.analyst_id:
            inv.analyst_id = payload.analyst_id
        if payload.escalation_reason is not None:
            inv.escalation_reason = payload.escalation_reason
        inv.updated_at = now

    # Record persistent audit event
    action = "STATUS_CHANGE" if prev_status != payload.review_status else "NOTE_ADDED"
    if payload.review_status == "Escalated":
        action = "ESCALATION"
    elif payload.review_status == "Closed":
        action = "REVIEW_CLOSED"

    audit_entry = AuditEvent(
        transaction_id=transaction_id,
        action=action,
        previous_status=prev_status,
        new_status=payload.review_status,
        analyst_id=payload.analyst_id or "analyst_01",
        analyst_name="Risk Investigator",
        details=payload.analyst_notes or payload.escalation_reason or f"Transitioned from {prev_status} to {payload.review_status}",
        created_at=now
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(inv)

    return InvestigationResponse.model_validate(inv)

@router.get("/{transaction_id}/audit-trail", response_model=List[AuditEventResponse])
def get_transaction_audit_trail(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns full chronological audit events for a transaction.
    """
    events = db.query(AuditEvent).filter(AuditEvent.transaction_id == transaction_id).order_by(AuditEvent.created_at.desc()).all()
    return events
