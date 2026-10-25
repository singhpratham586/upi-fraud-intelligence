import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "upi_fraud.db").replace("\\", "/")

class Settings(BaseModel):
    APP_NAME: str = "UPI Fraud Intelligence — Transaction Risk Analytics Platform"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    DEFAULT_DATASET_SIZE: int = int(os.getenv("DEFAULT_DATASET_SIZE", "12500"))
    RANDOM_SEED: int = int(os.getenv("RANDOM_SEED", "42"))
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()
