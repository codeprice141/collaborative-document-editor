import secrets
import httpx
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])


class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    access_token: Optional[str] = None


class GitHubAuthRequest(BaseModel):
    code: str


@router.get("/oauth/config")
def get_oauth_config():
    """Returns public OAuth Client IDs for Google & GitHub."""
    return {
        "google_client_id": settings.GOOGLE_CLIENT_ID or "",
        "github_client_id": settings.GITHUB_CLIENT_ID or "",
    }


@router.post("/google", response_model=Token)
async def google_oauth_login(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Verifies Google ID Token or Access Token and logs in/registers the user."""
    email = None
    full_name = "Google User"

    if payload.id_token:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.id_token}")
            if res.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google ID token.",
                )
            data = res.json()
            email = data.get("email")
            full_name = data.get("name") or data.get("given_name") or "Google User"
    elif payload.access_token:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {payload.access_token}"},
            )
            if res.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google access token.",
                )
            data = res.json()
            email = data.get("email")
            full_name = data.get("name") or "Google User"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="id_token or access_token required for Google login.",
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email could not be retrieved.",
        )

    user = AuthService.get_by_email(db, email)
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            full_name=full_name,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/github", response_model=Token)
async def github_oauth_login(payload: GitHubAuthRequest, db: Session = Depends(get_db)):
    """Exchanges GitHub OAuth code for access token and logs in/registers user."""
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth is not configured on the server.",
        )

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": payload.code,
            },
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange GitHub code")
        token_data = token_res.json()
        gh_token = token_data.get("access_token")
        if not gh_token:
            raise HTTPException(status_code=400, detail="GitHub access token not received")

        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/json"},
        )
        user_data = user_res.json()
        email = user_data.get("email")
        full_name = user_data.get("name") or user_data.get("login") or "GitHub User"

        if not email:
            email_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/json"},
            )
            for em in email_res.json():
                if em.get("primary") and em.get("verified"):
                    email = em.get("email")
                    break

        if not email:
            raise HTTPException(status_code=400, detail="No verified email associated with GitHub account")

    user = AuthService.get_by_email(db, email)
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            full_name=full_name,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Registers a new user account."""
    existing_user = AuthService.get_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    user = AuthService.create_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates a user and returns a JWT access token."""
    user = AuthService.authenticate(db, login_in.email, login_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns profile information for the authenticated user."""
    return current_user


@router.get("/users", response_model=list[UserResponse])
def search_users(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search for team members by email or name to easily share documents."""
    query = db.query(User).filter(User.is_active == True)
    if q:
        query = query.filter(
            (User.email.ilike(f"%{q}%")) | (User.full_name.ilike(f"%{q}%"))
        )
    return query.limit(10).all()
