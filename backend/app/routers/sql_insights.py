from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.sql_insights import SQLQueryItem, SQLQueryResult
from app.services.sql_library import SQL_QUERIES, execute_analytical_query

router = APIRouter(prefix="/sql-insights", tags=["SQL Insights"])

@router.get("", response_model=List[SQLQueryItem])
def get_sql_query_catalog():
    """Returns the library of predefined analytical SQL queries."""
    return [SQLQueryItem(**q) for q in SQL_QUERIES]

@router.get("/{query_id}/execute", response_model=SQLQueryResult)
def run_sql_query(query_id: int, db: Session = Depends(get_db)):
    """Executes the chosen analytical SQL query directly on the active database."""
    try:
        result = execute_analytical_query(db, query_id)
        return SQLQueryResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database execution error: {str(e)}")
