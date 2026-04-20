import { useEffect, useMemo, useState } from 'react';
import { listBooks, type Book, type BookStatus } from '../api/books';
import BookCard from '../components/BookCard';
import './LibraryPage.css';

const TABS: { key: BookStatus; label: string }[] = [
  { key: 'currently_reading', label: 'Currently Reading' },
  { key: 'finished', label: 'Finished' },
  { key: 'to_read', label: 'To Read' },
];

export default function LibraryPage() {
  const [status, setStatus] = useState<BookStatus>('currently_reading');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listBooks({ status })
      .then(setBooks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    setYearFilter(null);
  }, [status]);

  const years = useMemo(() => {
    if (status !== 'finished') return [];
    const set = new Set<number>();
    books.forEach((b) => b.year_read && set.add(b.year_read));
    return Array.from(set).sort((a, b) => b - a);
  }, [books, status]);

  const visibleBooks = useMemo(() => {
    if (status !== 'finished' || yearFilter === null) return books;
    return books.filter((b) => b.year_read === yearFilter);
  }, [books, status, yearFilter]);

  return (
    <div className="library-page">
      <h2>My Library</h2>
      <div className="status-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${status === t.key ? 'active' : ''}`}
            onClick={() => setStatus(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status === 'finished' && years.length > 0 && (
        <div className="year-chips">
          <button
            className={`chip ${yearFilter === null ? 'active' : ''}`}
            onClick={() => setYearFilter(null)}
          >
            All
          </button>
          {years.map((y) => (
            <button
              key={y}
              className={`chip ${yearFilter === y ? 'active' : ''}`}
              onClick={() => setYearFilter(y)}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="state-msg">Loading...</p>
      ) : error ? (
        <p className="state-msg error">{error}</p>
      ) : visibleBooks.length === 0 ? (
        <p className="state-msg">
          {status === 'finished' && yearFilter !== null
            ? `No books read in ${yearFilter}.`
            : 'No books here yet.'}
        </p>
      ) : (
        <>
          <div className="shelf-view">
            <div className="shelf-row">
              {visibleBooks.map((book) => (
                <BookCard key={book.id} book={book} variant="shelf" />
              ))}
            </div>
            <div className="shelf-plank" aria-hidden="true" />
          </div>
          <div className="list-view">
            {visibleBooks.map((book) => (
              <BookCard key={book.id} book={book} variant="list" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
