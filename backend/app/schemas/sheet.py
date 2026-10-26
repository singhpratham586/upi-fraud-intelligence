from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.schemas.analytics import AnalyticsDashboardData

class EvaluateSheetRequest(BaseModel):
    filename: str = Field(..., description="Uploaded spreadsheet filename (e.g. transactions.xlsx or dataset.csv)")
    file_base64: Optional[str] = Field(None, description="Base64 encoded binary file data")
    csv_text: Optional[str] = Field(None, description="Raw CSV string data if applicable")
    persist_to_db: bool = Field(False, description="Whether to permanently ingest this sheet into the database")

class EvaluateSheetResponse(BaseModel):
    status: str
    filename: str
    total_records: int
    mapped_columns: Dict[str, str]
    dashboard_data: AnalyticsDashboardData
    preview_transactions: List[Dict[str, Any]]
    persisted_to_db: bool
    execution_time_ms: float
