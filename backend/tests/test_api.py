import pytest
from app.database import SessionLocal
from app.routers.analytics import get_overview_metrics, get_full_dashboard
from app.routers.transactions import list_transactions, get_transaction_detail
from app.routers.investigations import update_transaction_investigation
from app.routers.sql_insights import get_sql_query_catalog, run_sql_query
from app.routers.business_impact import simulate_impact
from app.schemas.transaction import InvestigationUpdate
from app.schemas.business_impact import BusinessImpactSimRequest

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_api_analytics_overview(db_session):
    overview = get_overview_metrics(merchant_category=None, risk_level=None, db=db_session)
    assert overview.total_transactions > 0
    assert overview.total_transaction_value > 0
    assert overview.simulated_fraud_count > 0
    assert overview.precision_pct >= 0.0

def test_api_full_dashboard(db_session):
    dashboard = get_full_dashboard(merchant_category=None, risk_level=None, db=db_session)
    assert len(dashboard.volume_trends) > 0
    assert len(dashboard.hourly_heatmap) == 168  # 7 * 24
    assert len(dashboard.category_breakdown) > 0
    assert len(dashboard.deterministic_insights) >= 2

def test_api_transactions_list_and_detail(db_session):
    txn_list = list_transactions(
        page=1,
        page_size=10,
        search=None,
        merchant_category=None,
        risk_level=None,
        review_status=None,
        min_amount=None,
        max_amount=None,
        sort_by="timestamp",
        sort_order="desc",
        db=db_session
    )
    assert txn_list.total > 0
    assert len(txn_list.transactions) == 10

    first_id = txn_list.transactions[0].id
    detail = get_transaction_detail(transaction_id=first_id, db=db_session)
    assert detail.id == first_id

def test_api_investigation_update(db_session):
    txn_list = list_transactions(
        page=1,
        page_size=1,
        search=None,
        merchant_category=None,
        risk_level=None,
        review_status=None,
        min_amount=None,
        max_amount=None,
        sort_by="timestamp",
        sort_order="desc",
        db=db_session
    )
    first_id = txn_list.transactions[0].id

    update_payload = InvestigationUpdate(
        review_status="Under Review",
        analyst_notes="Test note for status verification.",
        analyst_id="analyst_test_01"
    )
    result = update_transaction_investigation(
        transaction_id=first_id,
        payload=update_payload,
        db=db_session
    )
    assert result.review_status == "Under Review"
    assert result.analyst_notes == "Test note for status verification."

def test_api_sql_insights_catalog_and_execution(db_session):
    catalog = get_sql_query_catalog()
    assert len(catalog) >= 20

    # Execute Query #1
    res1 = run_sql_query(query_id=1, db=db_session)
    assert res1.query_id == 1
    assert len(res1.rows) == 1
    assert "total_transactions" in res1.rows[0]
    assert res1.execution_time_ms >= 0

def test_api_business_impact_simulation(db_session):
    sim_req = BusinessImpactSimRequest(
        cost_per_investigation=350.0,
        loss_recovery_rate_pct=85.0,
        unmitigated_loss_multiplier=1.2,
        risk_score_threshold=65.0,
        selected_model="ensemble"
    )
    res = simulate_impact(payload=sim_req, db=db_session)
    assert res.investigation_workload_alerts > 0
    assert res.estimated_loss_avoided > 0
    assert len(res.tradeoff_curve) > 5
