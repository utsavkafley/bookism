import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  searchBooks,
  createBook,
  type SearchResult,
} from '../api/books';
import './SearchPage.css';

export default function SearchPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchBooks(query)
        .then(setResults)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  async function handleSelect(result: SearchResult) {
    const key = result.open_library_key || result.title;
    setAdding(key);
    try {
      const book = await createBook({
        open_library_key: result.open_library_key,
        title: result.title,
        author: result.author,
        cover_url: result.cover_url,
        page_count: result.page_count,
        publish_year: result.publish_year,
        isbn: result.isbn,
        status: 'to_read',
      });
      navigate(`/book/${book.id}`);
    } catch (e) {
      setError((e as Error).message);
      setAdding(null);
    }
  }

  return (
    <div className="search-page">
      <h2>Search Open Library</h2>
      <input
        type="text"
        placeholder="Search by title or author..."
        className="search-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
        }}
        autoFocus
      />

      {loading && <p className="state-msg">Searching...</p>}
      {error && <p className="state-msg error">{error}</p>}
      {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
        <p className="state-msg">No results.</p>
      )}

      <div className="search-results">
        {results.map((r) => {
          const key = r.open_library_key || r.title;
          return (
            <button
              key={key}
              className={`result-row ${adding === key ? 'adding' : ''}`}
              onClick={() => handleSelect(r)}
              disabled={adding !== null}
            >
              <div className="cover">
                {r.cover_url ? (
                  <img src={r.cover_url} alt="" loading="lazy" />
                ) : (
                  <div className="cover-placeholder">{r.title[0]}</div>
                )}
              </div>
              <div className="info">
                <h3>{r.title}</h3>
                {r.author && <p className="author">{r.author}</p>}
                {r.publish_year && <p className="meta">{r.publish_year}</p>}
              </div>
              {adding === key && <span className="adding-badge">Adding...</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
