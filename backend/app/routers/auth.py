import hashlib
import datetime
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    GmailLoginRequest,
    OAuthLoginRequest,
    AuthResponse,
    UserResponse,
    StoredCredentialRecord
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def _hash_password(password: str) -> str:
    salt = "upi_risk_analyst_platform_salt"
    return hashlib.sha256(f"{salt}_{password}".encode("utf-8")).hexdigest()

def _format_name_from_email(email: str) -> str:
    handle = email.split("@")[0]
    parts = handle.replace(".", " ").replace("_", " ").replace("-", " ").split()
    return " ".join([p.capitalize() for p in parts]) if parts else "Analyst"

@router.post("/login", response_model=AuthResponse)
def login_with_gmail(req: GmailLoginRequest, db: Session = Depends(get_db)):
    """
    Primary Authentication: Sign in or register with Gmail / Email credentials.
    Persists credentials and user profile directly into the application dataset.
    """
    email = req.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Valid email address is required.")
    
    # Check if user already exists in database
    user = db.query(User).filter(User.email == email).first()
    pwd_hash = _hash_password(req.password)

    if user:
        # User exists - verify password if originally set with password
        if user.password_hash and user.password_hash != pwd_hash and not user.password_hash.startswith("oauth_"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password for this registered Gmail account."
            )
        
        # Update user session stats in dataset
        user.last_login_at = datetime.datetime.utcnow()
        user.login_count = (user.login_count or 0) + 1
        if user.password_hash.startswith("oauth_"):
            # Upgrade / add password credential
            user.password_hash = pwd_hash
        db.commit()
        db.refresh(user)
        message = f"Welcome back, {user.full_name}! Successfully logged in via Gmail."
    else:
        # First-time user - auto-register and persist in dataset
        full_name = req.full_name.strip() if req.full_name else _format_name_from_email(email)
        user = User(
            email=email,
            password_hash=pwd_hash,
            full_name=full_name,
            provider="gmail",
            avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={full_name}",
            role="Risk Analyst",
            login_count=1,
            last_login_at=datetime.datetime.utcnow(),
            created_at=datetime.datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        message = f"Account created and saved in dataset! Welcome, {user.full_name}."

    token = secrets.token_hex(24)

    return AuthResponse(
        success=True,
        message=message,
        token=token,
        user=UserResponse.model_validate(user)
    )

@router.post("/oauth", response_model=AuthResponse)
def login_with_oauth(req: OAuthLoginRequest, db: Session = Depends(get_db)):
    """
    OAuth Authentication for Google and GitHub.
    Persists profile, provider metadata, and login records into the dataset.
    """
    provider = req.provider.lower()
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Unsupported OAuth provider.")

    email = req.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Valid email from OAuth provider is required.")

    user = db.query(User).filter(User.email == email).first()

    if user:
        user.provider = provider
        user.login_count = (user.login_count or 0) + 1
        user.last_login_at = datetime.datetime.utcnow()
        if req.avatar_url:
            user.avatar_url = req.avatar_url
        if req.full_name and not user.full_name:
            user.full_name = req.full_name
        db.commit()
        db.refresh(user)
        message = f"Signed in with {provider.capitalize()} as {user.full_name}."
    else:
        # Create and persist new user in dataset
        pwd_hash = f"oauth_{provider}_{secrets.token_hex(8)}"
        avatar = req.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={req.full_name}"
        user = User(
            email=email,
            password_hash=pwd_hash,
            full_name=req.full_name or _format_name_from_email(email),
            provider=provider,
            avatar_url=avatar,
            role="Risk Analyst",
            login_count=1,
            last_login_at=datetime.datetime.utcnow(),
            created_at=datetime.datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        message = f"Authenticated via {provider.capitalize()} and saved in database dataset."

    token = secrets.token_hex(24)

    return AuthResponse(
        success=True,
        message=message,
        token=token,
        user=UserResponse.model_validate(user)
    )

@router.get("/users", response_model=List[StoredCredentialRecord])
def list_dataset_users(db: Session = Depends(get_db)):
    """
    Returns all authenticated user accounts and credential records saved in the dataset.
    Allows risk managers to inspect registered analysts and login history.
    """
    users = db.query(User).order_by(desc(User.last_login_at)).all()
    results = []
    for u in users:
        # Obfuscated password hint for security while demonstrating data persistence
        hint = "OAuth Managed Token" if u.password_hash.startswith("oauth_") else f"SHA256:{u.password_hash[:8]}..."
        results.append(StoredCredentialRecord(
            id=u.id,
            email=u.email,
            provider=u.provider,
            full_name=u.full_name,
            role=u.role,
            password_hint=hint,
            login_count=u.login_count,
            last_login_at=u.last_login_at,
            created_at=u.created_at
        ))
    return results

@router.post("/logout")
def logout():
    return {"success": True, "message": "Successfully logged out."}
