from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score, precision_recall_curve, auc

def compute_model_metrics(
    y_true: pd.Series,
    y_pred: pd.Series,
    model_name: str,
    amounts: pd.Series
) -> Dict[str, Any]:
    """
    Computes rigorous classification metrics comparing model flags against ground truth.
    y_true: binary series of ground truth simulated fraud
    y_pred: binary series of model flags
    """
    y_true = y_true.astype(bool)
    y_pred = y_pred.astype(bool)

    tp = int((y_true & y_pred).sum())
    fp = int((~y_true & y_pred).sum())
    fn = int((y_true & ~y_pred).sum())
    tn = int((~y_true & ~y_pred).sum())

    total_alerts = int(y_pred.sum())
    total_eval = len(y_true)

    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    fpr = float(fp / max(1, (fp + tn)))

    flagged_amt = float(amounts[y_pred].sum()) if total_alerts > 0 else 0.0

    return {
        "model_name": model_name,
        "total_alerts": total_alerts,
        "true_positives": tp,
        "false_positives": fp,
        "true_negatives": tn,
        "false_negatives": fn,
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "false_positive_rate": round(fpr * 100, 2),
        "evaluation_sample_size": total_eval,
        "flagged_amount_sum": round(flagged_amt, 2)
    }

def compute_ensemble_scores(
    df: pd.DataFrame,
    iqr_flags: pd.Series,
    iqr_scores: pd.Series,
    iforest_flags: pd.Series,
    iforest_scores: pd.Series,
    ts_flags: pd.Series,
    ts_scores: pd.Series
) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """
    Combines individual detector signals into a calibrated ensemble risk score (0-100)
    and categorical risk levels: LOW, MEDIUM, HIGH, CRITICAL.
    """
    ensemble_scores = []
    risk_levels = []
    signals_list = []

    for idx in df.index:
        iq_f = bool(iqr_flags.loc[idx])
        if_f = bool(iforest_flags.loc[idx])
        ts_f = bool(ts_flags.loc[idx])

        iq_s = float(iqr_scores.loc[idx])
        if_s = float(iforest_scores.loc[idx])
        ts_s = float(ts_scores.loc[idx])

        signals = []
        if iq_f:
            signals.append("IQR_AMOUNT_OUTLIER")
        if if_f:
            signals.append("ISOLATION_FOREST_ANOMALY")
        if ts_f:
            signals.append("TIME_SERIES_VELOCITY_BURST")

        # Contextual boosts
        row = df.loc[idx]
        if row.get("is_location_changed", False):
            signals.append("LOCATION_HOP")
        if row.get("is_device_changed", False):
            signals.append("NEW_DEVICE")
        if row.get("merchant_category") in ["jewelry_luxury", "crypto_p2p_simulation"]:
            signals.append("HIGH_RISK_MERCHANT")

        # Weighted calculation
        agreement_count = int(iq_f) + int(if_f) + int(ts_f)
        raw_score = (0.25 * iq_s) + (0.35 * if_s) + (0.40 * ts_s)

        # Multi-model consensus bonus
        if agreement_count == 3:
            raw_score = max(raw_score, 88.0)
        elif agreement_count == 2:
            raw_score = max(raw_score, 70.0)
        elif agreement_count == 1:
            raw_score = max(raw_score, 45.0)

        # Cap at 100
        final_score = min(100.0, max(0.0, round(raw_score, 1)))

        # Risk level binning
        if final_score >= 80.0:
            level = "CRITICAL"
        elif final_score >= 60.0:
            level = "HIGH"
        elif final_score >= 35.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        import json
        ensemble_scores.append(final_score)
        risk_levels.append(level)
        signals_list.append(json.dumps(signals))

    return (
        pd.Series(ensemble_scores, index=df.index),
        pd.Series(risk_levels, index=df.index),
        pd.Series(signals_list, index=df.index)
    )

def compute_method_agreement(
    iqr_flags: pd.Series,
    iforest_flags: pd.Series,
    ts_flags: pd.Series
) -> Dict[str, int]:
    """Computes intersection and agreement counts between the three detection algorithms."""
    iqr = iqr_flags.astype(bool)
    ifo = iforest_flags.astype(bool)
    ts = ts_flags.astype(bool)

    any_flag = iqr | ifo | ts

    return {
        "iqr_only": int((iqr & ~ifo & ~ts).sum()),
        "iforest_only": int((~iqr & ifo & ~ts).sum()),
        "timeseries_only": int((~iqr & ~ifo & ts).sum()),
        "iqr_and_iforest": int((iqr & ifo & ~ts).sum()),
        "iqr_and_timeseries": int((iqr & ~ifo & ts).sum()),
        "iforest_and_timeseries": int((~iqr & ifo & ts).sum()),
        "all_three": int((iqr & ifo & ts).sum()),
        "total_flagged": int(any_flag.sum())
    }
