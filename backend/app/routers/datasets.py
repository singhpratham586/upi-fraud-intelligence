import base64
import time
import io
import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import DatasetMetadata, Transaction
from scripts.generate_and_seed import seed_database
from app.schemas.sheet import EvaluateSheetRequest, EvaluateSheetResponse
from app.services.sheet_evaluator import (
    parse_uploaded_sheet,
    normalize_and_engineer_sheet,
    evaluate_sheet_dataframe,
    persist_evaluated_sheet_to_database
)

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("/info")
def get_dataset_info(db: Session = Depends(get_db)):
    meta = db.query(DatasetMetadata).order_by(DatasetMetadata.id.desc()).first()
    if not meta:
        return {"status": "none", "message": "No dataset metadata found."}
    return {
        "version": meta.version,
        "total_records": meta.total_records,
        "fraud_count": meta.fraud_count,
        "fraud_rate": meta.fraud_rate,
        "date_start": meta.date_start.isoformat(),
        "date_end": meta.date_end.isoformat(),
        "random_seed": meta.random_seed,
        "created_at": meta.created_at.isoformat()
    }

@router.post("/regenerate")
def regenerate_dataset(
    total_records: int = Query(12500, ge=1000, le=50000),
    random_seed: int = Query(42, ge=1),
    db: Session = Depends(get_db)
):
    try:
        seed_database(total_records=total_records, random_seed=random_seed)
        return {
            "status": "success",
            "message": f"Successfully regenerated and seeded dataset with {total_records} records (seed={random_seed})."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate dataset: {str(e)}")

@router.post("/evaluate-sheet", response_model=EvaluateSheetResponse)
def evaluate_sheet(req: EvaluateSheetRequest, db: Session = Depends(get_db)):
    """
    Accepts an uploaded Excel (.xlsx) or CSV file (via base64 or raw text),
    runs the full anomaly detection pipeline (IQR, Isolation Forest, Velocity Burst, Ensemble Scoring),
    and computes complete dashboard KPIs, temporal aggregations, and merchant risk distributions.
    """
    start_time = time.perf_counter()

    if not req.file_base64 and not req.csv_text:
        raise HTTPException(status_code=400, detail="Either file_base64 or csv_text must be provided.")

    try:
        # Decode file bytes
        if req.file_base64:
            # Strip data url prefix if present (e.g. data:application/...;base64,)
            b64_str = req.file_base64
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            file_bytes = base64.b64decode(b64_str)
        else:
            file_bytes = req.csv_text.encode("utf-8")

        # 1. Parse into raw dataframe
        raw_df = parse_uploaded_sheet(file_bytes, req.filename)
        if raw_df.empty:
            raise HTTPException(status_code=400, detail="The uploaded sheet contains no readable rows.")

        # 2. Normalize columns & engineer feature baselines
        clean_df, col_mapping = normalize_and_engineer_sheet(raw_df)

        # 3. Execute detection pipeline & aggregate dashboard visualizations
        eval_result = evaluate_sheet_dataframe(clean_df, req.filename)

        # 4. Optionally persist to SQLite/PostgreSQL
        persisted = False
        if req.persist_to_db:
            persist_evaluated_sheet_to_database(db, eval_result["clean_dataframe"], req.filename)
            persisted = True

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return EvaluateSheetResponse(
            status="success",
            filename=req.filename,
            total_records=eval_result["total_records"],
            mapped_columns=col_mapping,
            dashboard_data=eval_result["dashboard_data"],
            preview_transactions=eval_result["preview_transactions"],
            persisted_to_db=persisted,
            execution_time_ms=elapsed_ms
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate spreadsheet: {str(e)}")

@router.get("/sample-sheet")
def download_sample_sheet(db: Session = Depends(get_db)):
    """
    Returns 50 real transactions from the database formatted as CSV
    for analysts to download and test dropping into the evaluation drop box.
    """
    txns = db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(50).all()
    rows = []
    for t in txns:
        rows.append({
            "Transaction ID": t.id,
            "Timestamp": t.timestamp.isoformat(),
            "Sender ID": t.sender_id,
            "Sender Name": t.sender_name,
            "Receiver ID": t.receiver_id,
            "Receiver Name": t.receiver_name,
            "Merchant Category": t.merchant_category,
            "Amount (INR)": t.amount,
            "City": t.location_city,
            "Device": t.device_type,
            "Status": t.status,
            "Simulated Fraud": t.is_fraud_simulated
        })
    df = pd.DataFrame(rows)
    csv_str = df.to_csv(index=False)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_upi_transactions.csv"}
    )
