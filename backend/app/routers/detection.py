from typing import List, Dict, Any
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import Transaction, DetectionResult
from app.schemas.detection import (
    DetectionRunRequest, DetectionRunResponse,
    ModelMetrics, AnomalyScoreHistogramBin,
    GovernancePolicyBenchmark, GovernanceBenchmarksResponse
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

@router.get("/governance-benchmarks", response_model=GovernanceBenchmarksResponse)
def get_governance_benchmarks(db: Session = Depends(get_db)):
    """
    Evaluates three versioned policy regimes (Conservative, Balanced, Aggressive)
    against independent ground truth to establish governance trade-offs between
    analyst triage burden and fraud exposure.
    """
    df = _load_transactions_dataframe(db)
    if len(df) == 0:
        return GovernanceBenchmarksResponse(
            status="no_data",
            total_records=0,
            simulated_fraud_count=0,
            total_fraud_volume=0.0,
            policies=[],
            optimal_policy="Balanced Baseline",
            strategic_guidance="No transaction records currently available for benchmarking."
        )

    y_true = df["is_fraud_simulated"]
    amounts = df["amount"]
    total_fraud_cnt = int(y_true.sum())
    total_fraud_vol = float(amounts[y_true].sum())

    policy_specs = [
        {
            "key": "conservative",
            "name": "Conservative Policy (Low Operational Friction)",
            "description": "Strict detection thresholds flagging only acute statistical outliers. Minimizes customer contact friction and analyst triage queues.",
            "iqr_multiplier": 2.2,
            "iforest_contamination": 0.02,
            "velocity_threshold": 6,
            "suitability": "Lean fraud response units with restricted investigation headcount prioritizing precision."
        },
        {
            "key": "balanced",
            "name": "Balanced Baseline Policy (Production Calibrated)",
            "description": "Standard multi-model ensemble calibrated across statistical IQR, isolation trees, and velocity bursts.",
            "iqr_multiplier": 1.5,
            "iforest_contamination": 0.035,
            "velocity_threshold": 4,
            "suitability": "Standard fintech production operations balancing comprehensive coverage with SLA compliance."
        },
        {
            "key": "aggressive",
            "name": "Aggressive Policy (Loss Minimization)",
            "description": "Sensitive risk boundary capturing low-velocity probes and edge-case anomalies. Generates higher alert queues.",
            "iqr_multiplier": 1.2,
            "iforest_contamination": 0.05,
            "velocity_threshold": 3,
            "suitability": "High-risk merchant flows, festive peak campaigns, or elevated threat environments."
        }
    ]

    benchmarks: List[GovernancePolicyBenchmark] = []

    for spec in policy_specs:
        iqr_f, iqr_s, _, _ = run_iqr_detection(df, feature="amount", multiplier=spec["iqr_multiplier"])
        if_f, if_s, _, _ = run_isolation_forest(df, contamination=spec["iforest_contamination"], n_estimators=100, random_seed=42)
        ts_f, ts_s, _, _ = run_time_series_detection(df, velocity_count_threshold=spec["velocity_threshold"], amount_deviation_sigma=3.0, short_window_seconds=300)
        
        _, risk_levels, _ = compute_ensemble_scores(df, iqr_f, iqr_s, if_f, if_s, ts_f, ts_s)
        flagged = risk_levels.isin(["HIGH", "CRITICAL"])
        
        m = compute_model_metrics(y_true, flagged, spec["name"], amounts)
        
        tp_amt = float(amounts[flagged & y_true].sum())
        est_fraud_prevented = round(tp_amt * 0.85, 2)
        est_inv_cost = round(int(flagged.sum()) * 150.0, 2)
        net_val = round(est_fraud_prevented - est_inv_cost, 2)

        benchmarks.append(GovernancePolicyBenchmark(
            policy_name=spec["name"],
            policy_key=spec["key"],
            description=spec["description"],
            iqr_multiplier=spec["iqr_multiplier"],
            iforest_contamination=spec["iforest_contamination"],
            velocity_threshold=spec["velocity_threshold"],
            total_alerts=m["total_alerts"],
            true_positives=m["true_positives"],
            false_positives=m["false_positives"],
            precision=m["precision"],
            recall=m["recall"],
            f1_score=m["f1_score"],
            false_positive_rate=m["false_positive_rate"],
            flagged_amount_sum=m["flagged_amount_sum"],
            estimated_fraud_prevented=est_fraud_prevented,
            estimated_investigation_cost=est_inv_cost,
            net_business_value=net_val,
            suitability=spec["suitability"]
        ))

    # Determine highest net business value policy
    best_policy = max(benchmarks, key=lambda b: b.net_business_value)

    guidance = (
        f"The {best_policy.policy_name} achieves the highest net business return of ₹{best_policy.net_business_value:,.2f} "
        f"by recovering ₹{best_policy.estimated_fraud_prevented:,.2f} in simulated exposure while containing operational review costs "
        f"to ₹{best_policy.estimated_investigation_cost:,.2f} ({best_policy.total_alerts:,} total alerts at ₹150/case). "
        f"Model governance committee recommends operating at this baseline."
    )

    return GovernanceBenchmarksResponse(
        status="success",
        total_records=len(df),
        simulated_fraud_count=total_fraud_cnt,
        total_fraud_volume=round(total_fraud_vol, 2),
        policies=benchmarks,
        optimal_policy=best_policy.policy_name,
        strategic_guidance=guidance
    )
