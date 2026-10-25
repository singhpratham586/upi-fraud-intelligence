import pytest
import pandas as pd
from app.services.data_generator import generate_synthetic_transactions
from app.services.iqr_detector import run_iqr_detection
from app.services.isolation_forest import run_isolation_forest
from app.services.time_series_detector import run_time_series_detection

@pytest.fixture(scope="module")
def sample_dataset():
    df, _ = generate_synthetic_transactions(total_records=300, random_seed=42)
    return df

def test_iqr_detector(sample_dataset):
    flags, scores, reasons, stats = run_iqr_detection(sample_dataset, feature="amount", multiplier=1.5)
    assert len(flags) == len(sample_dataset)
    assert len(scores) == len(sample_dataset)
    assert stats["upper_bound"] > stats["q3"]
    assert stats["total_outliers"] >= 0
    assert (scores[flags] >= 50.0).all()

def test_isolation_forest_detector(sample_dataset):
    flags, scores, reasons, stats = run_isolation_forest(sample_dataset, contamination=0.05, random_seed=42)
    assert len(flags) == len(sample_dataset)
    assert len(scores) == len(sample_dataset)
    assert stats["total_flagged"] > 0
    assert (scores >= 0.0).all() and (scores <= 100.0).all()

def test_time_series_detector(sample_dataset):
    flags, scores, reasons, stats = run_time_series_detection(
        sample_dataset, velocity_count_threshold=3, amount_deviation_sigma=2.5
    )
    assert len(flags) == len(sample_dataset)
    assert len(scores) == len(sample_dataset)
    assert "velocity_threshold" in stats
