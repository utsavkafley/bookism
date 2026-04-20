import { Link } from 'react-router-dom';
import type { Book } from '../api/books';
import './BookCard.css';

interface Props {
  book: Book;
  /** 'shelf' renders as a standing spine+cover (desktop). 'list' is the compact row (mobile). */
  variant?: 'shelf' | 'list';
}

export default function BookCard({ book, variant = 'shelf' }: Props) {
  if (variant === 'list') {
    return (
      <Link to={`/book/${book.id}`} className="book-card-list">
        <div className="bcl-cover">
          {book.cover_url ? (
            <img src={book.cover_url} alt="" loading="lazy" />
          ) : (
            <div className="bcl-cover-placeholder">{book.title[0]}</div>
          )}
        </div>
        <div className="bcl-info">
          <h3>{book.title}</h3>
          {book.author && <p className="author">{book.author}</p>}
          {book.year_read && <p className="year">Read {book.year_read}</p>}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/book/${book.id}`} className="book-card-shelf" title={book.title}>
      <div className="shelf-book">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} loading="lazy" />
        ) : (
          <div className="shelf-spine">
            <span className="spine-title">{book.title}</span>
            {book.author && <span className="spine-author">{book.author}</span>}
          </div>
        )}
      </div>
      <div className="shelf-caption">
        <div className="shelf-title">{book.title}</div>
        {book.author && <div className="shelf-author">{book.author}</div>}
      </div>
    </Link>
  );
}
