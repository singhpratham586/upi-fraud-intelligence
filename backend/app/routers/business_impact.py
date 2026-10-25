from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import pandas as pd
from app.database import get_db
from app.models.transaction import Transaction, DetectionResult
from app.schemas.business_impact import BusinessImpactSimRequest, BusinessImpactSimResponse
from app.services.business_impact import simulate_business_impact

router = APIRouter(prefix="/business-impact", tags=["Business Impact"])

@router.post("/simulate", response_model=BusinessImpactSimResponse)
def simulate_impact(payload: BusinessImpactSimRequest, db: Session = Depends(get_db)):
    txns = db.query(Transaction).all()
    dets = db.query(DetectionResult).all()

    df_t = pd.DataFrame([{"id": t.id, "amount": t.amount, "is_fraud_simulated": t.is_fraud_simulated} for t in txns])
    df_d = pd.DataFrame([{
        "id": d.transaction_id,
        "ensemble_risk_score": d.ensemble_risk_score,
        "iqr_score": d.iqr_score,
        "iforest_score": d.iforest_score,
        "timeseries_score": d.timeseries_score
    } for d in dets])

    df = pd.merge(df_t, df_d, on="id")

    # Select score column based on requested model
    score_col = "ensemble_risk_score"
    if payload.selected_model == "iqr":
        score_col = "iqr_score"
    elif payload.selected_model == "iforest":
        score_col = "iforest_score"
    elif payload.selected_model == "timeseries":
        score_col = "timeseries_score"

    result = simulate_business_impact(
        df=df,
        scores=df[score_col],
        y_true=df["is_fraud_simulated"],
        amounts=df["amount"],
        cost_per_investigation=payload.cost_per_investigation,
        loss_recovery_rate_pct=payload.loss_recovery_rate_pct,
        unmitigated_loss_multiplier=payload.unmitigated_loss_multiplier,
        selected_threshold=payload.risk_score_threshold,
        selected_model=payload.selected_model
    )

    return BusinessImpactSimResponse(**result)
