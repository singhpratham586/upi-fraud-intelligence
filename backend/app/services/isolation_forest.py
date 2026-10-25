from typing import Tuple, List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

def run_isolation_forest(
    df: pd.DataFrame,
    features: List[str] = None,
    contamination: float = 0.03,
    n_estimators: int = 100,
    random_seed: int = 42
) -> Tuple[pd.Series, pd.Series, List[str], Dict[str, Any]]:
    """
    Method 2: Isolation Forest Anomaly Detection.
    Isolates anomalies by randomly partitioning feature space.
    Anomalies require fewer splits and have shorter average path lengths in isolation trees.
    """
    default_features = [
        "amount", 
        "rolling_count_1h", 
        "rolling_amount_1h", 
        "amount_to_mean_ratio", 
        "time_since_last_txn_sec"
    ]
    if not features:
        features = default_features

    # Filter to available features in dataframe
    valid_features = [f for f in features if f in df.columns]
    if not valid_features:
        valid_features = ["amount"]

    X = df[valid_features].copy()
    # Fill any NaNs safely
    X = X.fillna(0.0)

    # Train Isolation Forest
    iso = IsolationForest(
        contamination=contamination,
        n_estimators=n_estimators,
        random_state=random_seed,
        n_jobs=-1
    )
    predictions = iso.fit_predict(X)
    # scikit-learn returns -1 for outliers, 1 for inliers
    flags = pd.Series(predictions == -1, index=df.index)

    # Decision function: lower values mean more anomalous (negative values are outliers)
    decision_scores = iso.decision_function(X)
    
    # Normalize score to 0 - 100 where 100 is most anomalous
    # Decision score typically ranges from ~ -0.3 (most anomalous) to +0.2 (normal)
    min_dec = float(decision_scores.min())
    max_dec = float(decision_scores.max())
    score_range = max(1e-5, max_dec - min_dec)

    normalized_scores = ((max_dec - decision_scores) / score_range) * 100.0
    scores = pd.Series(normalized_scores, index=df.index).round(2)

    reasons = []
    for flag, score, (_, row) in zip(flags, scores, df.iterrows()):
        if flag:
            top_drivers = []
            if row.get("amount_to_mean_ratio", 1.0) > 3.0:
                top_drivers.append(f"{row['amount_to_mean_ratio']}x mean spend")
            if row.get("rolling_count_1h", 1) > 3:
                top_drivers.append(f"{row['rolling_count_1h']} txns in 1hr")
            if row.get("is_location_changed", False):
                top_drivers.append("abrupt city jump")
            driver_text = f" Driven by {', '.join(top_drivers)}." if top_drivers else ""
            reasons.append(
                f"Multi-feature Isolation Anomaly (Score: {score:.1f}/100, Contamination: {contamination * 100:.1f}%).{driver_text}"
            )
        else:
            reasons.append("")

    stats = {
        "features_used": valid_features,
        "contamination": contamination,
        "n_estimators": n_estimators,
        "total_flagged": int(flags.sum()),
        "flagged_pct": round(float(flags.mean() * 100), 2),
        "min_decision_score": round(min_dec, 4),
        "max_decision_score": round(max_dec, 4),
        "mean_anomaly_score": round(float(scores.mean()), 2)
    }

    return flags, scores, reasons, stats
