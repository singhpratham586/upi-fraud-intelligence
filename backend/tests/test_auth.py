import pytest
from app.database import SessionLocal
from app.routers.auth import login_with_gmail, login_with_oauth, list_dataset_users
from app.schemas.auth import GmailLoginRequest, OAuthLoginRequest
from fastapi import HTTPException

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_gmail_registration_and_login(db):
    # 1. Register / login with new Gmail user
    req = GmailLoginRequest(
        email="test.risk.analyst@gmail.com",
        password="secure_password_99",
        full_name="Test Risk Analyst"
    )
    res = login_with_gmail(req, db)
    assert res.success is True
    assert res.user.email == "test.risk.analyst@gmail.com"
    assert res.user.provider == "gmail"
    assert res.user.role == "Risk Analyst"
    assert res.token is not None

    # 2. Login again with correct password
    res2 = login_with_gmail(req, db)
    assert res2.success is True
    assert res2.user.login_count >= 2

    # 3. Login with wrong password should raise 401
    bad_req = GmailLoginRequest(
        email="test.risk.analyst@gmail.com",
        password="wrong_password_xyz"
    )
    with pytest.raises(HTTPException) as exc_info:
        login_with_gmail(bad_req, db)
    assert exc_info.value.status_code == 401

def test_oauth_google_and_github(db):
    # Test Google OAuth login
    google_req = OAuthLoginRequest(
        provider="google",
        email="google.user@gmail.com",
        full_name="Google Analyst",
        avatar_url="https://lh3.googleusercontent.com/test-avatar"
    )
    g_res = login_with_oauth(google_req, db)
    assert g_res.success is True
    assert g_res.user.provider == "google"

    # Test GitHub OAuth login
    github_req = OAuthLoginRequest(
        provider="github",
        email="github.developer@github.com",
        full_name="GitHub Developer",
        avatar_url="https://avatars.githubusercontent.com/u/12345"
    )
    gh_res = login_with_oauth(github_req, db)
    assert gh_res.success is True
    assert gh_res.user.provider == "github"

def test_list_saved_credentials_dataset(db):
    users = list_dataset_users(db)
    assert len(users) >= 1
    # Verify records have obfuscated password hints and metadata
    for u in users:
        assert u.email is not None
        assert u.provider in ["gmail", "google", "github"]
        assert u.password_hint is not None
