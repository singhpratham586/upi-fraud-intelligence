from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class NetworkNode(BaseModel):
    id: str
    label: str
    type: str  # sender, receiver, merchant
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    transaction_count: int
    total_amount: float
    is_mule_suspect: bool = False
    city: Optional[str] = None
    category: Optional[str] = None

class NetworkEdge(BaseModel):
    id: str
    source: str
    target: str
    transaction_id: str
    amount: float
    timestamp: str
    risk_score: float
    risk_level: str
    signals: List[str]
    status: str

class NetworkGraphSummary(BaseModel):
    total_nodes: int
    total_edges: int
    total_volume_inr: float
    mule_suspect_nodes: int
    high_or_critical_edges: int

class NetworkGraphResponse(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]
    summary: NetworkGraphSummary
