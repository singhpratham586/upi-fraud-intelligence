from typing import List, Dict, Any
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import Transaction, DetectionResult
from app.schemas.detection import (
    DetectionRunRequest, DetectionRunResponse,
    ModelMetrics, AnomalyScoreHistogramBin
)
from app.services.iqr_detector import run_iqr_detection
from app.services.isolation_forest import run_isolation_forest
from app.services.time_series_detector import run_time_series_detection
from app.services.evaluation import compute_model_metrics, compute_ensemble_scores, compute_method_agreement

router = APIRouter(prefix="/detection", tags=["Detection Lab"])

def _load_transactions_dataframe(db: Session) -> pd.DataFrame:
    txns = db.query(Transaction).all()
    records = []
    for t in txns:
        records.append({
            "id": t.id,
            "timestamp": t.timestamp,
            "sender_id": t.sender_id,
            "receiver_id": t.receiver_id,
            "merchant_category": t.merchant_category,
            "amount": t.amount,
            "is_device_changed": t.is_device_changed,
            "is_location_changed": t.is_location_changed,
            "time_since_last_txn_sec": t.time_since_last_txn_sec,
            "rolling_count_1h": t.rolling_count_1h,
            "rolling_amount_1h": t.rolling_amount_1h,
            "rolling_count_24h": t.rolling_count_24h,
            "rolling_amount_24h": t.rolling_amount_24h,
            "user_historical_mean": t.user_historical_mean,
            "user_historical_std": t.user_historical_std,
            "amount_to_mean_ratio": t.amount_to_mean_ratio,
            "is_fraud_simulated": t.is_fraud_simulated
        })
    df = pd.DataFrame(records)
    return df

@router.get("/summary")
def get_detection_summary(db: Session = Depends(get_db)):
    txns = db.query(Transaction).all()
    dets = db.query(DetectionResult).all()

    if not txns or not dets:
        return {"status": "empty", "message": "No transactions or detection results found."}

    df_t = pd.DataFrame([{"id": t.id, "amount": t.amount, "is_fraud_simulated": t.is_fraud_simulated} for t in txns])
    df_d = pd.DataFrame([{
        "id": d.transaction_id,
        "iqr_flag": d.iqr_flag,
        "iforest_flag": d.iforest_flag,
        "timeseries_flag": d.timeseries_flag,
        "ensemble_risk_score": d.ensemble_risk_score,
        "risk_level": d.risk_level
    } for d in dets])

    df = pd.merge(df_t, df_d, on="id")
    y_true = df["is_fraud_simulated"]
    amounts = df["amount"]

    m1 = compute_model_metrics(y_true, df["iqr_flag"], "IQR Outlier Detection", amounts)
    m2 = compute_model_metrics(y_true, df["iforest_flag"], "Isolation Forest (Multi-Feature)", amounts)
    m3 = compute_model_metrics(y_true, df["timeseries_flag"], "Time-Series & Velocity Bursts", amounts)
    
    ensemble_flags = df["risk_level"].isin(["HIGH", "CRITICAL"])
    m_ens = compute_model_metrics(y_true, ensemble_flags, "Calibrated Ensemble Risk Engine", amounts)

    agreement = compute_method_agreement(df["iqr_flag"], df["iforest_flag"], df["timeseries_flag"])

    return {
        "status": "ready",
        "total_records": len(df),
        "simulated_fraud_ground_truth": int(y_true.sum()),
        "models": [m1, m2, m3, m_ens],
        "agreement": agreement
    }

@router.post("/run", response_model=DetectionRunResponse)
def run_interactive_detection(payload: DetectionRunRequest, db: Session = Depends(get_db)):
    df = _load_transactions_dataframe(db)
    if len(df) == 0:
        return DetectionRunResponse(
            status="no_data", total_evaluated=0, iqr_flagged=0,
            iforest_flagged=0, timeseries_flagged=0, ensemble_high_risk=0,
            model_comparison=[], score_distribution=[]
        )

    # 1. IQR
    iqr_feat = payload.iqr.feature if payload.iqr else "amount"
    iqr_mult = payload.iqr.multiplier if payload.iqr else 1.5
    iqr_flags, iqr_scores, iqr_reasons, iqr_stats = run_iqr_detection(df, feature=iqr_feat, multiplier=iqr_mult)

    # 2. Isolation Forest
    if_contam = payload.iforest.contamination if payload.iforest else 0.035
    if_feats = payload.iforest.features if payload.iforest else None
    if_estimators = payload.iforest.n_estimators if payload.iforest else 100
    if_seed = payload.iforest.random_seed if payload.iforest else 42
    iforest_flags, iforest_scores, iforest_reasons, if_stats = run_isolation_forest(
        df, features=if_feats, contamination=if_contam, n_estimators=if_estimators, random_seed=if_seed
    )

    # 3. Time Series
    ts_vel = payload.timeseries.velocity_count_threshold if payload.timeseries else 4
    ts_sigma = payload.timeseries.amount_deviation_sigma if payload.timeseries else 3.0
    ts_win = payload.timeseries.short_window_seconds if payload.timeseries else 300
    ts_flags, ts_scores, ts_reasons, ts_stats = run_time_series_detection(
        df, velocity_count_threshold=ts_vel, amount_deviation_sigma=ts_sigma, short_window_seconds=ts_win
    )

    # 4. Ensemble
    ensemble_scores, risk_levels, detection_signals = compute_ensemble_scores(
        df, iqr_flags, iqr_scores, iforest_flags, iforest_scores, ts_flags, ts_scores
    )

    # Compute Metrics
    y_true = df["is_fraud_simulated"]
    amounts = df["amount"]

    m1 = compute_model_metrics(y_true, iqr_flags, "IQR Outlier Detection", amounts)
    m2 = compute_model_metrics(y_true, iforest_flags, "Isolation Forest", amounts)
    m3 = compute_model_metrics(y_true, ts_flags, "Time-Series & Velocity Bursts", amounts)
    m_ens = compute_model_metrics(y_true, risk_levels.isin(["HIGH", "CRITICAL"]), "Calibrated Ensemble Risk Engine", amounts)

    # Histogram Bins for Ensemble Score (0-10, 10-20, ... 90-100)
    score_bins = []
    for b in range(0, 100, 10):
        b_start = float(b)
        b_end = float(b + 10)
        mask = (ensemble_scores >= b_start) & (ensemble_scores < b_end if b < 90 else ensemble_scores <= 100)
        cnt = int(mask.sum())
        frd = int((mask & y_true).sum())
        score_bins.append(AnomalyScoreHistogramBin(
            bin_range=f"{b}-{b+10}",
            bin_start=b_start,
            bin_end=b_end,
            count=cnt,
            fraud_simulated_count=frd
        ))

    return DetectionRunResponse(
        status="success",
        total_evaluated=len(df),
        iqr_flagged=int(iqr_flags.sum()),
        iforest_flagged=int(iforest_flags.sum()),
        timeseries_flagged=int(ts_flags.sum()),
        ensemble_high_risk=int(risk_levels.isin(["HIGH", "CRITICAL"]).sum()),
        model_comparison=[
            ModelMetrics(**m1),
            ModelMetrics(**m2),
            ModelMetrics(**m3),
            ModelMetrics(**m_ens)
        ],
        score_distribution=score_bins
    )
