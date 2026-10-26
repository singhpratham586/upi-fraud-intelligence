import sys
import os
import json
import datetime
import pandas as pd

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import engine, Base, SessionLocal
from app.models.transaction import Transaction, DetectionResult, Investigation, DatasetMetadata
from app.models.user import User
from app.routers.auth import _hash_password
from app.services.data_generator import generate_synthetic_transactions
from app.services.iqr_detector import run_iqr_detection
from app.services.isolation_forest import run_isolation_forest
from app.services.time_series_detector import run_time_series_detection
from app.services.evaluation import compute_ensemble_scores

def seed_database(total_records: int = 12500, random_seed: int = 42):
    print(f"Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Ensure default analyst user exists in dataset
        if db.query(User).count() == 0:
            demo_user = User(
                email="analyst@gmail.com",
                password_hash=_hash_password("analyst123"),
                full_name="Lead Risk Analyst",
                provider="gmail",
                avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Lead%20Risk%20Analyst",
                role="Senior Risk Analyst",
                login_count=1,
                last_login_at=datetime.datetime.utcnow(),
                created_at=datetime.datetime.utcnow()
            )
            db.add(demo_user)
            db.commit()
            print("Seeded default analyst user account into dataset.")

        # Check if already seeded
        existing_count = db.query(Transaction).count()
        if existing_count >= total_records:
            print(f"Database already contains {existing_count} transactions. Skipping generation.")
            return

        print(f"Generating {total_records} synthetic UPI transactions (seed={random_seed})...")
        df, quality_report = generate_synthetic_transactions(total_records=total_records, random_seed=random_seed)
        print("Data Quality Report:")
        print(json.dumps(quality_report, indent=2))

        # Save CSV copy for portfolio reference
        data_dir = os.path.join(backend_dir, "data")
        os.makedirs(data_dir, exist_ok=True)
        csv_path = os.path.join(data_dir, "synthetic_upi_transactions.csv")
        df.to_csv(csv_path, index=False)
        print(f"Saved CSV archive to {csv_path}")

        print("Running Detection Methods...")
        # Method 1: IQR
        iqr_flags, iqr_scores, iqr_reasons, iqr_stats = run_iqr_detection(df, feature="amount", multiplier=1.5)
        print(f"  -> IQR detected {iqr_stats['total_outliers']} outliers ({iqr_stats['outlier_pct']}%)")

        # Method 2: Isolation Forest
        iforest_flags, iforest_scores, iforest_reasons, if_stats = run_isolation_forest(
            df, contamination=0.035, random_seed=random_seed
        )
        print(f"  -> Isolation Forest detected {if_stats['total_flagged']} anomalies ({if_stats['flagged_pct']}%)")

        # Method 3: Time Series
        ts_flags, ts_scores, ts_reasons, ts_stats = run_time_series_detection(df)
        print(f"  -> Time Series detected {ts_stats['total_flagged']} velocity anomalies ({ts_stats['flagged_pct']}%)")

        # Ensemble
        ensemble_scores, risk_levels, detection_signals = compute_ensemble_scores(
            df, iqr_flags, iqr_scores, iforest_flags, iforest_scores, ts_flags, ts_scores
        )

        print("Ingesting into database...")
        # Clear existing records cleanly
        db.query(Investigation).delete()
        db.query(DetectionResult).delete()
        db.query(Transaction).delete()
        db.query(DatasetMetadata).delete()
        db.commit()

        # Batch insert Transactions
        batch_size = 1000
        txn_objects = []
        detection_objects = []
        investigation_objects = []

        now = datetime.datetime.utcnow()

        for idx, row in df.iterrows():
            txn_id = row["id"]
            txn_obj = Transaction(
                id=txn_id,
                timestamp=row["timestamp"].to_pydatetime() if hasattr(row["timestamp"], "to_pydatetime") else row["timestamp"],
                sender_id=row["sender_id"],
                sender_name=row["sender_name"],
                receiver_id=row["receiver_id"],
                receiver_name=row["receiver_name"],
                receiver_type=row["receiver_type"],
                merchant_category=row["merchant_category"],
                amount=float(row["amount"]),
                currency=row["currency"],
                status=row["status"],
                device_id=row["device_id"],
                device_type=row["device_type"],
                ip_address=row["ip_address"],
                location_city=row["location_city"],
                channel=row["channel"],
                is_device_changed=bool(row["is_device_changed"]),
                is_location_changed=bool(row["is_location_changed"]),
                time_since_last_txn_sec=float(row["time_since_last_txn_sec"]),
                rolling_count_1h=int(row["rolling_count_1h"]),
                rolling_amount_1h=float(row["rolling_amount_1h"]),
                rolling_count_24h=int(row["rolling_count_24h"]),
                rolling_amount_24h=float(row["rolling_amount_24h"]),
                user_historical_mean=float(row["user_historical_mean"]),
                user_historical_std=float(row["user_historical_std"]),
                amount_to_mean_ratio=float(row["amount_to_mean_ratio"]),
                is_fraud_simulated=bool(row["is_fraud_simulated"]),
                fraud_scenario_tag=str(row["fraud_scenario_tag"])
            )
            txn_objects.append(txn_obj)

            # Detection Result
            det_obj = DetectionResult(
                transaction_id=txn_id,
                iqr_flag=bool(iqr_flags.loc[idx]),
                iqr_score=float(iqr_scores.loc[idx]),
                iqr_reason=str(iqr_reasons[idx]),
                iforest_flag=bool(iforest_flags.loc[idx]),
                iforest_score=float(iforest_scores.loc[idx]),
                iforest_reason=str(iforest_reasons[idx]),
                timeseries_flag=bool(ts_flags.loc[idx]),
                timeseries_score=float(ts_scores.loc[idx]),
                timeseries_reason=str(ts_reasons[idx]),
                ensemble_risk_score=float(ensemble_scores.loc[idx]),
                risk_level=str(risk_levels.loc[idx]),
                detection_signals=str(detection_signals.loc[idx]),
                created_at=now
            )
            detection_objects.append(det_obj)

            # Investigation Record
            # Populate realistic initial statuses for high risk items
            risk = risk_levels.loc[idx]
            if risk in ["CRITICAL", "HIGH"]:
                # Seed some sample analyst activity
                if idx % 7 == 0:
                    status = "Reviewed"
                    notes = "Confirmed legitimate high-ticket holiday booking by verified user; 2FA passed."
                elif idx % 5 == 0:
                    status = "Escalated"
                    notes = "Suspicious midnight device hop + crypto transfer. Escalated to Tier 2 Fraud Operations."
                elif idx % 3 == 0:
                    status = "Under Review"
                    notes = "Calling account holder to verify uncharacteristic transfer velocity."
                else:
                    status = "New"
                    notes = None
            else:
                status = "New"
                notes = None

            inv_obj = Investigation(
                transaction_id=txn_id,
                review_status=status,
                analyst_notes=notes,
                analyst_id="analyst_vikram" if notes else None,
                created_at=now,
                updated_at=now
            )
            investigation_objects.append(inv_obj)

        print(f"Bulk committing {len(txn_objects)} transactions...")
        db.bulk_save_objects(txn_objects)
        db.commit()

        print(f"Bulk committing {len(detection_objects)} detection results...")
        db.bulk_save_objects(detection_objects)
        db.commit()

        print(f"Bulk committing {len(investigation_objects)} investigation records...")
        db.bulk_save_objects(investigation_objects)
        db.commit()

        # Metadata
        meta = DatasetMetadata(
            version="v1.0-synthetic-prod",
            total_records=len(df),
            fraud_count=int(df["is_fraud_simulated"].sum()),
            fraud_rate=round(float(df["is_fraud_simulated"].mean() * 100), 2),
            date_start=df["timestamp"].min().to_pydatetime() if hasattr(df["timestamp"].min(), "to_pydatetime") else df["timestamp"].min(),
            date_end=df["timestamp"].max().to_pydatetime() if hasattr(df["timestamp"].max(), "to_pydatetime") else df["timestamp"].max(),
            random_seed=random_seed,
            created_at=now
        )
        db.add(meta)
        db.commit()

        print(f"Database successfully populated with {len(df)} transactions!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
