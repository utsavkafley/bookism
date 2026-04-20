from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.database import get_db
from app.models.user import User
from app.models.book import Book
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


DEMO_BOOKS = [
    {
        "title": "Middlemarch",
        "author": "George Eliot",
        "open_library_key": "/works/OL109864W",
        "cover_url": "https://covers.openlibrary.org/b/id/8739161-L.jpg",
        "page_count": 904,
        "publish_year": 1871,
        "status": "finished",
        "year_read": 2023,
    },
    {
        "title": "Beloved",
        "author": "Toni Morrison",
        "open_library_key": "/works/OL46404W",
        "cover_url": "https://covers.openlibrary.org/b/id/8228691-L.jpg",
        "page_count": 321,
        "publish_year": 1987,
        "status": "finished",
        "year_read": 2024,
    },
    {
        "title": "The Remains of the Day",
        "author": "Kazuo Ishiguro",
        "open_library_key": "/works/OL45804W",
        "cover_url": "https://covers.openlibrary.org/b/id/8254091-L.jpg",
        "page_count": 258,
        "publish_year": 1989,
        "status": "finished",
        "year_read": 2024,
    },
    {
        "title": "Animal Farm",
        "author": "George Orwell",
        "open_library_key": "/works/OL37800334M",
        "cover_url": "https://covers.openlibrary.org/b/id/12707885-L.jpg",
        "page_count": 140,
        "publish_year": 1996,
        "status": "finished",
        "year_read": 2024,
    },
    {
        "title": "Pachinko",
        "author": "Min Jin Lee",
        "open_library_key": "/works/OL17811965W",
        "cover_url": "https://covers.openlibrary.org/b/id/10519874-L.jpg",
        "page_count": 496,
        "publish_year": 2017,
        "status": "to_read",
        "year_read": None,
    },
]


@router.post("/demo")
def demo_auth(db: Session = Depends(get_db)):
    """
    Signs the caller in as a shared demo user. Intended for recruiters /
    portfolio visitors who want to poke around without connecting Google.
    """
    user = db.query(User).filter(User.google_id == "demo").first()
    if not user:
        user = User(
            google_id="demo",
            email="demo@bookism.app",
            name="Demo Reader",
            avatar_url=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        for b in DEMO_BOOKS:
            db.add(Book(user_id=user.id, **b))
        db.commit()

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
