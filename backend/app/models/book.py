from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship

from app.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    open_library_key = Column(String, nullable=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    page_count = Column(Integer, nullable=True)
    publish_year = Column(Integer, nullable=True)
    isbn = Column(String, nullable=True)
    status = Column(String, nullable=False, default="to_read")  # currently_reading | finished | to_read
    year_read = Column(Integer, nullable=True)
    notes = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
