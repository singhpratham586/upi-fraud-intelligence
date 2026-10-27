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
from app.schemas.network import NetworkGraphResponse, NetworkNode, NetworkEdge, NetworkGraphSummary
import json

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

@router.get("/network-graph", response_model=NetworkGraphResponse)
def get_transaction_network_graph(
    limit: int = Query(50, ge=10, le=200),
    risk_level: Optional[str] = None,
    min_amount: Optional[float] = None,
    category: Optional[str] = None,
    focus_mules: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Constructs an interactive subgraph of senders, receivers/merchants, and transaction edges,
    computing in-degree centrality, mule syndicate flags, and risk-weighted connections.
    """
    query = db.query(Transaction).join(DetectionResult)

    if focus_mules:
        # Prioritize repeated recipients or mule scenario tags
        query = query.filter(
            or_(
                Transaction.fraud_scenario_tag == "MULE_RECEIVER",
                DetectionResult.ensemble_risk_score >= 50.0
            )
        )

    if risk_level and risk_level != "all":
        query = query.filter(DetectionResult.risk_level == risk_level)

    if min_amount is not None and min_amount > 0:
        query = query.filter(Transaction.amount >= min_amount)

    if category and category != "all":
        query = query.filter(Transaction.merchant_category == category)

    txns = query.order_by(desc(DetectionResult.ensemble_risk_score), desc(Transaction.timestamp)).limit(limit).all()

    nodes_dict = {}
    edges_list = []
    receiver_payers = {}
    total_volume = 0.0
    critical_or_high_edges = 0

    for t in txns:
        total_volume += t.amount
        score = t.detection.ensemble_risk_score if t.detection else 0.0
        lvl = t.detection.risk_level if t.detection else "LOW"
        if lvl in ["CRITICAL", "HIGH"]:
            critical_or_high_edges += 1

        # Track payers per receiver for mule detection
        if t.receiver_id not in receiver_payers:
            receiver_payers[t.receiver_id] = set()
        receiver_payers[t.receiver_id].add(t.sender_id)

        # Parse signals
        signals = []
        if t.detection and t.detection.detection_signals:
            try:
                signals = json.loads(t.detection.detection_signals)
            except Exception:
                signals = [t.detection.detection_signals]

        # Edge
        edge = NetworkEdge(
            id=f"edge_{t.id}",
            source=t.sender_id,
            target=t.receiver_id,
            transaction_id=t.id,
            amount=round(t.amount, 2),
            timestamp=t.timestamp.isoformat(),
            risk_score=round(score, 1),
            risk_level=lvl,
            signals=signals if isinstance(signals, list) else [],
            status=t.status
        )
        edges_list.append(edge)

        # Sender Node
        if t.sender_id not in nodes_dict:
            nodes_dict[t.sender_id] = {
                "id": t.sender_id,
                "label": t.sender_name or t.sender_id,
                "type": "sender",
                "risk_level": lvl,
                "transaction_count": 0,
                "total_amount": 0.0,
                "city": t.location_city,
                "category": None
            }
        nodes_dict[t.sender_id]["transaction_count"] += 1
        nodes_dict[t.sender_id]["total_amount"] += t.amount
        if lvl in ["CRITICAL", "HIGH"] or (nodes_dict[t.sender_id]["risk_level"] not in ["CRITICAL", "HIGH"] and lvl == "MEDIUM"):
            nodes_dict[t.sender_id]["risk_level"] = lvl

        # Receiver Node
        node_type = "merchant" if t.receiver_type == "merchant" else "receiver"
        if t.receiver_id not in nodes_dict:
            nodes_dict[t.receiver_id] = {
                "id": t.receiver_id,
                "label": t.receiver_name or t.receiver_id,
                "type": node_type,
                "risk_level": lvl,
                "transaction_count": 0,
                "total_amount": 0.0,
                "city": t.location_city,
                "category": t.merchant_category
            }
        nodes_dict[t.receiver_id]["transaction_count"] += 1
        nodes_dict[t.receiver_id]["total_amount"] += t.amount
        if lvl in ["CRITICAL", "HIGH"] or (nodes_dict[t.receiver_id]["risk_level"] not in ["CRITICAL", "HIGH"] and lvl == "MEDIUM"):
            nodes_dict[t.receiver_id]["risk_level"] = lvl

    # Mark suspected mule nodes (>= 3 distinct senders or high risk concentration)
    mule_count = 0
    formatted_nodes = []
    for node_id, data in nodes_dict.items():
        distinct_senders = len(receiver_payers.get(node_id, set()))
        is_mule = data["type"] != "sender" and (distinct_senders >= 3 or (distinct_senders >= 2 and data["risk_level"] in ["CRITICAL", "HIGH"]))
        if is_mule:
            mule_count += 1

        formatted_nodes.append(
            NetworkNode(
                id=data["id"],
                label=data["label"],
                type=data["type"],
                risk_level=data["risk_level"],
                transaction_count=data["transaction_count"],
                total_amount=round(data["total_amount"], 2),
                is_mule_suspect=is_mule,
                city=data["city"],
                category=data["category"]
            )
        )

    summary = NetworkGraphSummary(
        total_nodes=len(formatted_nodes),
        total_edges=len(edges_list),
        total_volume_inr=round(total_volume, 2),
        mule_suspect_nodes=mule_count,
        high_or_critical_edges=critical_or_high_edges
    )

    return NetworkGraphResponse(
        nodes=formatted_nodes,
        edges=edges_list,
        summary=summary
    )

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction_detail(transaction_id: str, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found.")
    return TransactionResponse.model_validate(txn)
