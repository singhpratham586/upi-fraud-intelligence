from typing import List, Dict, Any
import numpy as np
import pandas as pd

def simulate_business_impact(
    df: pd.DataFrame,
    scores: pd.Series,
    y_true: pd.Series,
    amounts: pd.Series,
    cost_per_investigation: float = 350.0,
    loss_recovery_rate_pct: float = 85.0,
    unmitigated_loss_multiplier: float = 1.2,
    selected_threshold: float = 65.0,
    selected_model: str = "ensemble"
) -> Dict[str, Any]:
    """
    Connects technical anomaly detection performance to simulated fintech economic impact.
    Calculates workload, alert volume, averted losses, operational investigation expenses,
    and net financial benefit across operational decision thresholds.
    """
    y_true = y_true.astype(bool)
    recovery_rate = loss_recovery_rate_pct / 100.0

    # 1. Point estimate for configured threshold
    alerts_mask = scores >= selected_threshold
    tp_mask = alerts_mask & y_true
    fp_mask = alerts_mask & (~y_true)
    fn_mask = (~alerts_mask) & y_true

    total_alerts = int(alerts_mask.sum())
    tp_count = int(tp_mask.sum())
    fp_count = int(fp_mask.sum())
    fn_count = int(fn_mask.sum())

    total_simulated_fraud_val = float(amounts[y_true].sum())
    detected_fraud_val = float(amounts[tp_mask].sum())
    missed_fraud_val = float(amounts[fn_mask].sum())

    # Financial model calculations
    loss_avoided = detected_fraud_val * recovery_rate
    investigation_cost = total_alerts * cost_per_investigation
    residual_loss = missed_fraud_val * unmitigated_loss_multiplier
    net_benefit = loss_avoided - investigation_cost - residual_loss

    roi_pct = round(((loss_avoided - investigation_cost) / max(1.0, investigation_cost)) * 100, 2)

    # 2. Tradeoff Curve generation across thresholds (15 to 90 in steps of 5)
    tradeoff_curve = []
    test_thresholds = list(range(15, 95, 5))
    
    for th in test_thresholds:
        m_alerts = scores >= th
        m_tp = m_alerts & y_true
        m_fp = m_alerts & (~y_true)
        m_fn = (~m_alerts) & y_true

        c_alerts = int(m_alerts.sum())
        c_tp = int(m_tp.sum())
        c_fp = int(m_fp.sum())

        c_precision = round((c_tp / max(1, c_alerts)) * 100, 2)
        c_recall = round((c_tp / max(1, int(y_true.sum()))) * 100, 2)

        c_det_val = float(amounts[m_tp].sum())
        c_miss_val = float(amounts[m_fn].sum())

        c_loss_avoided = c_det_val * recovery_rate
        c_inv_cost = c_alerts * cost_per_investigation
        c_net_benefit = c_loss_avoided - c_inv_cost - (c_miss_val * unmitigated_loss_multiplier)

        tradeoff_curve.append({
            "threshold": float(th),
            "alert_volume": c_alerts,
            "true_positives": c_tp,
            "false_positives": c_fp,
            "precision": c_precision,
            "recall": c_recall,
            "investigation_cost": round(c_inv_cost, 2),
            "loss_avoided": round(c_loss_avoided, 2),
            "net_benefit": round(c_net_benefit, 2)
        })

    formula_text = (
        "Estimated Net Benefit = (Detected Fraud Value × Recovery Rate) - "
        "(Total Alerts × Cost per Investigation) - (Missed Fraud Value × Unmitigated Loss Multiplier). "
        "Calculated strictly on simulated UPI transaction distributions for analytical decision support."
    )

    return {
        "selected_model": selected_model,
        "configured_threshold": selected_threshold,
        "investigation_workload_alerts": total_alerts,
        "true_positives": tp_count,
        "false_positives": fp_count,
        "missed_simulated_fraud": fn_count,
        "simulated_fraud_amount_total": round(total_simulated_fraud_val, 2),
        "estimated_loss_avoided": round(loss_avoided, 2),
        "total_investigation_cost": round(investigation_cost, 2),
        "residual_unmitigated_loss": round(residual_loss, 2),
        "estimated_net_benefit": round(net_benefit, 2),
        "roi_percentage": roi_pct,
        "tradeoff_curve": tradeoff_curve,
        "formula_explanation": formula_text
    }
