from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SQLQueryItem(BaseModel):
    id: int
    title: str
    business_question: str
    sql: str
    explanation: str
    expected_interpretation: str
    category: str
    dashboard_link: Optional[str] = None

class SQLQueryResult(BaseModel):
    query_id: int
    title: str
    executed_sql: str
    execution_time_ms: float
    row_count: int
    columns: List[str]
    rows: List[Dict[str, Any]]
    explanation: str
    interpretation: str
