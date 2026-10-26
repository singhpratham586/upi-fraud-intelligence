import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    provider = Column(String(32), nullable=False, default="gmail")  # "gmail", "google", "github"
    avatar_url = Column(String(256), nullable=True)
    role = Column(String(32), nullable=False, default="Risk Analyst")
    login_count = Column(Integer, nullable=False, default=1)
    last_login_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
