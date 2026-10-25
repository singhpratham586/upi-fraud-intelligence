import pytest
import pandas as pd
from app.services.evaluation import compute_model_metrics, compute_method_agreement

def test_evaluation_metrics_arithmetic():
    y_true = pd.Series([True, True, False, False, True])
    y_pred = pd.Series([True, False, False, True, True])
    amounts = pd.Series([100.0, 200.0, 50.0, 75.0, 300.0])

    metrics = compute_model_metrics(y_true, y_pred, "TestModel", amounts)
    
    # TP: [0, 4] -> 2
    # FP: [3] -> 1
    # FN: [1] -> 1
    # TN: [2] -> 1
    assert metrics["true_positives"] == 2
    assert metrics["false_positives"] == 1
    assert metrics["false_negatives"] == 1
    assert metrics["true_negatives"] == 1
    assert metrics["precision"] == round((2 / 3) * 100, 2)
    assert metrics["recall"] == round((2 / 3) * 100, 2)
    assert metrics["evaluation_sample_size"] == 5

def test_method_agreement_logic():
    iqr = pd.Series([True, False, True])
    ifo = pd.Series([True, True, False])
    ts = pd.Series([True, False, False])

    agreement = compute_method_agreement(iqr, ifo, ts)
    assert agreement["all_three"] == 1  # index 0
    assert agreement["iforest_only"] == 1  # index 1
    assert agreement["iqr_only"] == 1  # index 2
    assert agreement["total_flagged"] == 3
