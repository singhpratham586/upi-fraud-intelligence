import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class GmailLoginRequest(BaseModel):
    email: str = Field(..., description="Gmail or professional email address")
    password: str = Field(..., min_length=4, description="User password")
    full_name: Optional[str] = Field(None, description="Full name (for first-time auto-registration)")

class OAuthLoginRequest(BaseModel):
    provider: str = Field(..., description="'google' or 'github'")
    email: str = Field(..., description="Email address received from OAuth provider")
    full_name: str = Field(..., description="Full display name from OAuth provider")
    avatar_url: Optional[str] = Field(None, description="Profile avatar URL")
    oauth_id: Optional[str] = Field(None, description="OAuth unique identifier")

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    provider: str
    avatar_url: Optional[str] = None
    role: str
    login_count: int
    last_login_at: datetime.datetime
    created_at: datetime.datetime

class AuthResponse(BaseModel):
    success: bool
    message: str
    token: str
    user: UserResponse

class StoredCredentialRecord(BaseModel):
    id: int
    email: str
    provider: str
    full_name: str
    role: str
    password_hint: str
    login_count: int
    last_login_at: datetime.datetime
    created_at: datetime.datetime
