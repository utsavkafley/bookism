from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.book import Book

router = APIRouter(prefix="/books", tags=["books"])


class BookCreate(BaseModel):
    open_library_key: Optional[str] = None
    title: str
    author: Optional[str] = None
    cover_url: Optional[str] = None
    page_count: Optional[int] = None
    publish_year: Optional[int] = None
    isbn: Optional[str] = None
    status: str = "to_read"


class BookUpdate(BaseModel):
    status: Optional[str] = None
    year_read: Optional[int] = None
    notes: Optional[dict] = None


@router.get("")
def list_books(
    status: Optional[str] = Query(None),
    year_read: Optional[int] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Book).filter(Book.user_id == user.id)
    if status:
        query = query.filter(Book.status == status)
    if year_read:
        query = query.filter(Book.year_read == year_read)
    return query.order_by(Book.updated_at.desc()).all()


@router.post("", status_code=201)
def create_book(
    body: BookCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = Book(user_id=user.id, **body.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.get("/{book_id}")
def get_book(
    book_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.patch("/{book_id}")
def update_book(
    book_id: int,
    body: BookUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(book, key, value)

    db.commit()
    db.refresh(book)
    return book


@router.delete("/{book_id}", status_code=204)
def delete_book(
    book_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    db.delete(book)
    db.commit()
