import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createBook, type SearchResult, type BookStatus } from '../api/books';
import './BookPreviewPage.css';

const STATUS_LABELS: { key: BookStatus; label: string }[] = [
  { key: 'currently_reading', label: 'Currently Reading' },
  { key: 'to_read', label: 'To Read' },
  { key: 'finished', label: 'Finished' },
];

export default function BookPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = (location.state as { result: SearchResult } | null)?.result;

  const [status, setStatus] = useState<BookStatus>('to_read');
  const [yearRead, setYearRead] = useState<number>(new Date().getFullYear());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!result) {
    navigate('/search', { replace: true });
    return null;
  }

  async function handleAdd() {
    setAdding(true);
    setError(null);
    try {
      const book = await createBook({
        open_library_key: result!.open_library_key,
        title: result!.title,
        author: result!.author,
        cover_url: result!.cover_url,
        page_count: result!.page_count,
        publish_year: result!.publish_year,
        isbn: result!.isbn,
        status,
        ...(status === 'finished' ? { year_read: yearRead } : {}),
      });
      navigate(`/book/${book.id}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setAdding(false);
    }
  }

  return (
    <div className="preview-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="preview-book">
        <div className="preview-cover">
          {result.cover_url ? (
            <img src={result.cover_url} alt="" />
          ) : (
            <div className="preview-cover-placeholder">{result.title[0]}</div>
          )}
        </div>

        <div className="preview-info">
          <h2>{result.title}</h2>
          {result.author && <p className="preview-author">{result.author}</p>}
          <dl className="preview-meta">
            {result.publish_year && (
              <>
                <dt>Published</dt>
                <dd>{result.publish_year}</dd>
              </>
            )}
            {result.page_count && (
              <>
                <dt>Pages</dt>
                <dd>{result.page_count}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      <div className="preview-add">
        <div className="status-options">
          {STATUS_LABELS.map(({ key, label }) => (
            <label key={key} className={`status-option ${status === key ? 'selected' : ''}`}>
              <input
                type="radio"
                name="status"
                value={key}
                checked={status === key}
                onChange={() => setStatus(key)}
              />
              {label}
            </label>
          ))}
        </div>

        {status === 'finished' && (
          <div className="year-row">
            <label>Year read</label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={yearRead}
              onChange={(e) => setYearRead(Number(e.target.value))}
            />
          </div>
        )}

        {error && <p className="preview-error">{error}</p>}

        <button className="btn-primary" onClick={handleAdd} disabled={adding}>
          {adding ? 'Adding...' : 'Add to Library'}
        </button>
      </div>
    </div>
  );
}
