import pytest
import pandas as pd
from app.services.data_generator import generate_synthetic_transactions

def test_synthetic_data_generation():
    df, report = generate_synthetic_transactions(total_records=200, random_seed=42)
    
    assert len(df) == 200
    assert report["duplicate_ids"] == 0
    assert len(report["null_counts"]) == 0
    assert "is_fraud_simulated" in df.columns
    assert "fraud_scenario_tag" in df.columns
    assert df["amount"].min() > 0

    # Ensure chronological order
    timestamps = list(df["timestamp"])
    assert timestamps == sorted(timestamps)

    # Check engineered features
    assert "rolling_count_1h" in df.columns
    assert "rolling_amount_1h" in df.columns
    assert "user_historical_mean" in df.columns
    assert "amount_to_mean_ratio" in df.columns
    assert "time_since_last_txn_sec" in df.columns
    assert (df["rolling_count_1h"] >= 1).all()
