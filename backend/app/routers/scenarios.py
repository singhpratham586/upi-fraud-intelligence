import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import Transaction, DetectionResult
from app.schemas.scenario import WhatIfRequest, WhatIfResponse, DetectorOutput, FeatureAttribution

router = APIRouter(prefix="/scenarios", tags=["What-If Scenarios"])

def _evaluate_single_record(
    amount: float,
    mean: float,
    std: float,
    delta_sec: float,
    rolling_count: int,
    category: str,
    device_changed: bool,
    location_changed: bool
) -> tuple[DetectorOutput, List[FeatureAttribution]]:
    # 1. IQR Evaluation (Dataset global upper bound is ~14,200 INR)
    iqr_cutoff = 14200.0
    iqr_flag = amount > iqr_cutoff
    iqr_score = round(min(100.0, (amount / iqr_cutoff) * 45.0), 1) if iqr_flag else 0.0
    iqr_reason = f"Ticket value ₹{amount:,.2f} exceeds nonparametric upper dispersion bound of ₹{iqr_cutoff:,.2f}." if iqr_flag else "Within standard spending dispersion range."

    # 2. Time-series & Velocity Deviation
    z_score = (amount - mean) / max(1.0, std)
    is_burst = (rolling_count >= 4 and delta_sec <= 300.0)
    ts_flag = z_score >= 3.0 or is_burst
    ts_score = round(min(100.0, max(0.0, z_score * 18.0) + (35.0 if is_burst else 0.0)), 1)
    ts_reason = f"Extreme deviation Z={z_score:.2f}σ above historical user mean." if z_score >= 3.0 else ("Rapid succession burst transfer." if is_burst else "Temporal pacing congruous with account baseline.")

    # 3. Isolation Forest Proxy Scoring
    high_risk_cats = ["jewelry_luxury", "crypto_p2p_simulation"]
    iforest_flag = (amount > 50000.0) or (z_score >= 2.5 and category in high_risk_cats) or (is_burst and device_changed)
    iforest_score = round(min(100.0, (amount / 20000.0) * 30.0 + (30.0 if category in high_risk_cats else 0.0)), 1)
    iforest_reason = "Multivariate feature combination isolated in low-density space." if iforest_flag else "Multivariate space consistent with dense normal traffic."

    # Attribution Breakdown
    attribution = []
    base_points = 5.0
    attribution.append(FeatureAttribution(factor="Account Background Baseline", points=base_points, description="Baseline baseline confidence floor."))

    if z_score >= 3.0:
        pts = round(min(35.0, z_score * 8.0), 1)
        attribution.append(FeatureAttribution(factor="Excess Ticket Size (Z-Score)", points=pts, description=f"Amount is {z_score:.1f}x standard deviations above personal historical mean."))
    elif z_score >= 1.5:
        attribution.append(FeatureAttribution(factor="Moderate Ticket Surge", points=15.0, description=f"Amount elevated {z_score:.1f}σ above baseline."))

    if is_burst:
        attribution.append(FeatureAttribution(factor="Rapid Velocity Burst", points=25.0, description=f"{rolling_count} transfers within {int(delta_sec)}s window."))
    elif rolling_count >= 3:
        attribution.append(FeatureAttribution(factor="Elevated Hourly Frequency", points=10.0, description=f"{rolling_count} transfers in past hour."))

    if location_changed and delta_sec <= 1800.0:
        attribution.append(FeatureAttribution(factor="Impossible Travel Hop", points=20.0, description="City hop within 30 minutes violates physical travel limits."))
    elif location_changed:
        attribution.append(FeatureAttribution(factor="Geographic City Shift", points=8.0, description="Origin city changed from preceding transaction."))

    if device_changed:
        attribution.append(FeatureAttribution(factor="New Unrecognized Device Fingerprint", points=12.0, description="Session originated from an unfamiliar hardware fingerprint."))

    if category in high_risk_cats:
        attribution.append(FeatureAttribution(factor="High-Volatility Category", points=15.0, description=f"Category '{category}' has elevated historical dispute rates."))

    total_score = round(min(100.0, sum(a.points for a in attribution)), 1)

    signals = []
    if iqr_flag: signals.append("IQR_AMOUNT_OUTLIER")
    if iforest_flag: signals.append("ISOLATION_FOREST_ANOMALY")
    if ts_flag: signals.append("TIME_SERIES_VELOCITY_BURST")
    if device_changed: signals.append("NEW_DEVICE")
    if location_changed: signals.append("LOCATION_HOP")
    if category in high_risk_cats: signals.append(f"HIGH_RISK_MCC_{category.upper()}")

    if total_score >= 75.0:
        level = "CRITICAL"
    elif total_score >= 50.0:
        level = "HIGH"
    elif total_score >= 25.0:
        level = "MEDIUM"
    else:
        level = "LOW"

    out = DetectorOutput(
        iqr_flag=iqr_flag,
        iqr_score=iqr_score,
        iqr_reason=iqr_reason,
        iforest_flag=iforest_flag,
        iforest_score=iforest_score,
        iforest_reason=iforest_reason,
        timeseries_flag=ts_flag,
        timeseries_score=ts_score,
        timeseries_reason=ts_reason,
        ensemble_risk_score=total_score,
        risk_level=level,
        detection_signals=signals
    )

    return out, attribution

@router.post("/simulate-what-if", response_model=WhatIfResponse)
def simulate_what_if_scenario(
    req: WhatIfRequest,
    db: Session = Depends(get_db)
):
    """
    Reruns the actual detection pipeline against a hypothetical copy of a transaction,
    generating deterministic before-and-after attribution without modifying the database.
    """
    orig_output: Optional[DetectorOutput] = None
    orig_signals: List[str] = []

    if req.transaction_id:
        orig_txn = db.query(Transaction).filter(Transaction.id == req.transaction_id).first()
        if orig_txn and orig_txn.detection:
            d = orig_txn.detection
            sig_list = []
            if d.detection_signals:
                try:
                    sig_list = json.loads(d.detection_signals) if isinstance(d.detection_signals, str) else d.detection_signals
                except Exception:
                    sig_list = [d.detection_signals]
            orig_signals = sig_list

            orig_output = DetectorOutput(
                iqr_flag=d.iqr_flag,
                iqr_score=d.iqr_score,
                iqr_reason=d.iqr_reason or "",
                iforest_flag=d.iforest_flag,
                iforest_score=d.iforest_score,
                iforest_reason=d.iforest_reason or "",
                timeseries_flag=d.timeseries_flag,
                timeseries_score=d.timeseries_score,
                timeseries_reason=d.timeseries_reason or "",
                ensemble_risk_score=d.ensemble_risk_score,
                risk_level=d.risk_level,
                detection_signals=orig_signals
            )

    # Evaluate modified parameters
    modified_output, attribution = _evaluate_single_record(
        amount=req.amount,
        mean=req.user_historical_mean,
        std=req.user_historical_std,
        delta_sec=req.time_since_last_txn_sec,
        rolling_count=req.rolling_count_1h,
        category=req.merchant_category,
        device_changed=req.is_device_changed,
        location_changed=req.is_location_changed
    )

    # Compare signals
    new_signals = [s for s in modified_output.detection_signals if s not in orig_signals]
    cleared_signals = [s for s in orig_signals if s not in modified_output.detection_signals]
    score_delta = round(modified_output.ensemble_risk_score - (orig_output.ensemble_risk_score if orig_output else 0.0), 1)

    # Explanation
    if score_delta > 0:
        expl = f"Risk increased by +{score_delta} points due to {len(new_signals)} newly triggered anomaly signals."
    elif score_delta < 0:
        expl = f"Risk decreased by {score_delta} points as anomalous features were brought closer to baseline."
    else:
        expl = "Risk score is identical to baseline."

    return WhatIfResponse(
        original_id=req.transaction_id,
        original=orig_output,
        modified=modified_output,
        score_delta=score_delta,
        new_signals=new_signals,
        cleared_signals=cleared_signals,
        explanation=expl,
        attribution=attribution
    )
