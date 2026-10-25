from typing import Tuple, List, Dict, Any
import numpy as np
import pandas as pd

def run_iqr_detection(
    df: pd.DataFrame,
    feature: str = "amount",
    multiplier: float = 1.5
) -> Tuple[pd.Series, pd.Series, List[str], Dict[str, Any]]:
    """
    Method 1: Interquartile Range (IQR) Outlier Detection.
    Formula:
      IQR = Q3 - Q1
      Lower Bound = Q1 - (multiplier * IQR)
      Upper Bound = Q3 + (multiplier * IQR)
    Returns:
      flags: Boolean Series (True = Outlier)
      scores: Float Series (normalized outlier intensity)
      reasons: List of explanatory strings
      stats: Summary stats of the IQR process
    """
    if feature not in df.columns:
        feature = "amount"

    series = df[feature].astype(float)
    q1 = float(np.percentile(series, 25))
    q3 = float(np.percentile(series, 75))
    iqr = q3 - q1
    lower_bound = q1 - (multiplier * iqr)
    upper_bound = q3 + (multiplier * iqr)

    # UPI transactions are typically flagged on the upper bound (high values / velocity)
    flags = series > upper_bound

    # Score calculation: how far above the upper bound, normalized 0 - 100
    spread = max(1.0, upper_bound - q3)
    raw_scores = np.where(flags, np.minimum(100.0, 50.0 + ((series - upper_bound) / spread) * 25.0), 0.0)
    scores = pd.Series(raw_scores, index=df.index).round(2)

    reasons = []
    for val, flag in zip(series, flags):
        if flag:
            reasons.append(
                f"Statistical Outlier: {feature} (₹{val:,.2f}) exceeds Q3 + {multiplier}×IQR threshold of ₹{upper_bound:,.2f}."
            )
        else:
            reasons.append("")

    stats = {
        "feature": feature,
        "multiplier": multiplier,
        "q1": round(q1, 2),
        "q3": round(q3, 2),
        "iqr": round(iqr, 2),
        "lower_bound": round(lower_bound, 2),
        "upper_bound": round(upper_bound, 2),
        "total_outliers": int(flags.sum()),
        "outlier_pct": round(float(flags.mean() * 100), 2)
    }

    return flags, scores, reasons, stats
