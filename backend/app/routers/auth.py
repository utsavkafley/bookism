from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.database import get_db
from app.models.user import User
from app.auth import create_token
from app.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google")
async def google_auth(body: dict, db: Session = Depends(get_db)):
    """
    Receives a Google OAuth authorization code from the frontend,
    exchanges it for user info, and returns a JWT.
    """
    code = body.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{FRONTEND_URL}/auth/callback",
                "grant_type": "authorization_code",
            },
        )

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code")

    token_data = token_res.json()
    access_token = token_data.get("access_token")

    # Get user info
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info")

    user_info = user_res.json()

    # Find or create user
    user = db.query(User).filter(User.google_id == user_info["id"]).first()
    if not user:
        user = User(
            google_id=user_info["id"],
            email=user_info["email"],
            name=user_info.get("name", ""),
            avatar_url=user_info.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_token(user.id)
    return {
        "token": jwt_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
        },
    }
