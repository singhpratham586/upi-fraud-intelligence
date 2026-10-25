from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app.models.transaction import Transaction, DetectionResult, Investigation
from app.schemas.transaction import (
    TransactionResponse, TransactionListResponse,
    InvestigationUpdate, InvestigationResponse
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=TransactionListResponse)
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    search: Optional[str] = None,
    merchant_category: Optional[str] = None,
    risk_level: Optional[str] = None,
    review_status: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sort_by: str = Query("timestamp", description="timestamp, amount, ensemble_risk_score"),
    sort_order: str = Query("desc", description="asc or desc"),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).outerjoin(DetectionResult).outerjoin(Investigation)

    # Search filter
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.id.ilike(search_fmt),
                Transaction.sender_id.ilike(search_fmt),
                Transaction.sender_name.ilike(search_fmt),
                Transaction.receiver_id.ilike(search_fmt),
                Transaction.receiver_name.ilike(search_fmt),
                Transaction.location_city.ilike(search_fmt)
            )
        )

    # Category filter
    if merchant_category and merchant_category != "all":
        query = query.filter(Transaction.merchant_category == merchant_category)

    # Risk level filter
    if risk_level and risk_level != "all":
        query = query.filter(DetectionResult.risk_level == risk_level)

    # Review status filter
    if review_status and review_status != "all":
        query = query.filter(Investigation.review_status == review_status)

    # Amount filters
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)

    # Sorting
    sort_column = Transaction.timestamp
    if sort_by == "amount":
        sort_column = Transaction.amount
    elif sort_by == "ensemble_risk_score":
        sort_column = DetectionResult.ensemble_risk_score

    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size

    transactions = query.offset(offset).limit(page_size).all()

    return TransactionListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        transactions=[TransactionResponse.model_validate(t) for t in transactions]
    )

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction_detail(transaction_id: str, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found.")
    return TransactionResponse.model_validate(txn)
