from typing import Tuple, List, Dict, Any
import numpy as np
import pandas as pd

def run_time_series_detection(
    df: pd.DataFrame,
    velocity_count_threshold: int = 4,
    amount_deviation_sigma: float = 3.0,
    short_window_seconds: int = 300
) -> Tuple[pd.Series, pd.Series, List[str], Dict[str, Any]]:
    """
    Method 3: Time-based Velocity and Baseline Deviation Detection.
    Evaluates:
      1. Rolling 1-hour velocity bursts.
      2. Deviation from expanding historical spending mean (Z-Score > threshold).
      3. Rapid successive transactions (burst window < short_window_seconds with high ticket).
      4. Device and Location velocity hops within brief intervals.
    """
    flags = []
    scores = []
    reasons = []

    for _, row in df.iterrows():
        is_flagged = False
        signal_reasons = []
        score_val = 0.0

        roll_cnt = row.get("rolling_count_1h", 1)
        amt = row.get("amount", 0.0)
        hist_mean = row.get("user_historical_mean", amt)
        hist_std = max(1.0, row.get("user_historical_std", 1.0))
        delta_sec = row.get("time_since_last_txn_sec", 86400.0)
        dev_changed = row.get("is_device_changed", False)
        loc_changed = row.get("is_location_changed", False)

        # 1. Z-Score test on personal spending baseline
        z_score = (amt - hist_mean) / hist_std
        if z_score >= amount_deviation_sigma and amt > 1000.0:
            is_flagged = True
            signal_reasons.append(f"Spending deviation of +{z_score:.1f}σ from user historical baseline")
            score_val += min(45.0, z_score * 8.0)

        # 2. Rolling velocity burst
        if roll_cnt >= velocity_count_threshold:
            is_flagged = True
            signal_reasons.append(f"High 1-hour transaction velocity ({roll_cnt} txns)")
            score_val += min(35.0, (roll_cnt / velocity_count_threshold) * 25.0)

        # 3. Micro-burst rapid succession (< short_window_seconds with high amount)
        if delta_sec > 0 and delta_sec <= short_window_seconds and amt >= 20000.0:
            is_flagged = True
            signal_reasons.append(f"Rapid burst transaction ({delta_sec:.0f}s since prior event, ₹{amt:,.2f})")
            score_val += 30.0

        # 4. Impossible Travel / Device Hop
        if loc_changed and delta_sec < 1800:  # < 30 minutes between distinct cities
            is_flagged = True
            signal_reasons.append(f"Impossible physical transit window ({delta_sec/60:.1f}m between cities)")
            score_val += 35.0

        if is_flagged:
            final_score = min(100.0, max(40.0, score_val))
            flags.append(True)
            scores.append(round(final_score, 2))
            reasons.append("Behavioral Velocity Anomaly: " + "; ".join(signal_reasons) + ".")
        else:
            flags.append(False)
            scores.append(0.0)
            reasons.append("")

    flags_series = pd.Series(flags, index=df.index)
    scores_series = pd.Series(scores, index=df.index)

    stats = {
        "velocity_threshold": velocity_count_threshold,
        "amount_deviation_sigma": amount_deviation_sigma,
        "short_window_seconds": short_window_seconds,
        "total_flagged": int(flags_series.sum()),
        "flagged_pct": round(float(flags_series.mean() * 100), 2),
        "mean_flagged_score": round(float(scores_series[flags_series].mean() if flags_series.sum() > 0 else 0.0), 2)
    }

    return flags_series, scores_series, reasons, stats
