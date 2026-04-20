from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.book import Book
from app.models.post import Post

router = APIRouter(tags=["posts"])


class PostCreate(BaseModel):
    content: dict


class PostUpdate(BaseModel):
    content: dict


def _owned_book(db: Session, user: User, book_id: int) -> Book:
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


def _owned_post(db: Session, user: User, post_id: int) -> Post:
    post = (
        db.query(Post)
        .join(Book, Post.book_id == Book.id)
        .filter(Post.id == post_id, Book.user_id == user.id)
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/books/{book_id}/posts")
def list_posts(
    book_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _owned_book(db, user, book_id)
    return (
        db.query(Post)
        .filter(Post.book_id == book_id)
        .order_by(Post.created_at.desc())
        .all()
    )


@router.post("/books/{book_id}/posts", status_code=201)
def create_post(
    book_id: int,
    body: PostCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _owned_book(db, user, book_id)
    post = Post(book_id=book_id, content=body.content)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.patch("/posts/{post_id}")
def update_post(
    post_id: int,
    body: PostUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = _owned_post(db, user, post_id)
    post.content = body.content
    db.commit()
    db.refresh(post)
    return post


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = _owned_post(db, user, post_id)
    db.delete(post)
    db.commit()
