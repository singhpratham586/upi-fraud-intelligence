import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import Investigation, Transaction
from app.schemas.transaction import InvestigationUpdate, InvestigationResponse

router = APIRouter(prefix="/transactions", tags=["Investigations"])

@router.patch("/{transaction_id}/review", response_model=InvestigationResponse)
def update_transaction_investigation(
    transaction_id: str,
    payload: InvestigationUpdate,
    db: Session = Depends(get_db)
):
    valid_statuses = ["New", "Under Review", "Reviewed", "Escalated"]
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

    db.commit()
    db.refresh(inv)

    return InvestigationResponse.model_validate(inv)
