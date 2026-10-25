from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import DatasetMetadata
from scripts.generate_and_seed import seed_database

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
