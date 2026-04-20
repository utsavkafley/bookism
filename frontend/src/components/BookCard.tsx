import { Link } from 'react-router-dom';
import type { Book } from '../api/books';
import './BookCard.css';

interface Props {
  book: Book;
}

export default function BookCard({ book }: Props) {
  return (
    <Link to={`/book/${book.id}`} className="book-card">
      <div className="book-cover">
        {book.cover_url ? (
          <img src={book.cover_url} alt="" loading="lazy" />
        ) : (
          <div className="cover-placeholder">{book.title[0]}</div>
        )}
      </div>
      <div className="book-info">
        <h3>{book.title}</h3>
        {book.author && <p className="author">{book.author}</p>}
        {book.year_read && <p className="year">Read {book.year_read}</p>}
      </div>
    </Link>
  );
}
