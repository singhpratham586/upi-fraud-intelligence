import io
import pytest
import pandas as pd
from app.database import SessionLocal
from app.routers.datasets import evaluate_sheet
from app.schemas.sheet import EvaluateSheetRequest

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_evaluate_sheet_csv(db):
    csv_content = """Transaction_ID,Date,Amount,Sender,Receiver,Category,City,Device
TXN_101,2026-10-25 09:30:00,1200.50,CUST_001,MERCH_01,grocery,Mumbai,Android
TXN_102,2026-10-25 09:35:00,98500.00,CUST_002,MERCH_02,jewelry_luxury,Delhi,iOS
TXN_103,2026-10-25 09:40:00,450.00,CUST_003,MERCH_03,food_dining,Bengaluru,Android
TXN_104,2026-10-25 09:45:00,88000.00,CUST_004,MERCH_04,electronics,Mumbai,Web
TXN_105,2026-10-25 09:50:00,150.00,CUST_005,MERCH_05,grocery,Pune,Android
TXN_106,2026-10-25 09:55:00,350.00,CUST_006,MERCH_06,food_dining,Hyderabad,Android
"""
    req = EvaluateSheetRequest(
        filename="test_transactions.csv",
        csv_text=csv_content,
        persist_to_db=False
    )
    res = evaluate_sheet(req, db)
    assert res.status == "success"
    assert res.total_records == 6
    assert res.dashboard_data.kpis.total_transactions == 6
    assert res.dashboard_data.kpis.total_transaction_value > 100000
    assert len(res.dashboard_data.volume_trends) > 0
    assert len(res.dashboard_data.hourly_heatmap) == 7 * 24
    assert len(res.dashboard_data.category_breakdown) > 0
    assert len(res.preview_transactions) > 0
    assert res.persisted_to_db is False
