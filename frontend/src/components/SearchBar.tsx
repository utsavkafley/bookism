import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchBooks,
  createBook,
  type SearchResult,
} from '../api/books';
import './SearchBar.css';

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      searchBooks(query)
        .then((r) => {
          setResults(r.slice(0, 7));
          setActiveIdx(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Cmd+E / Ctrl+E to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function pickResult(result: SearchResult) {
    setAdding(true);
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
      setQuery('');
      setResults([]);
      setOpen(false);
      navigate(`/book/${book.id}`);
    } finally {
      setAdding(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim().length === 0) return;
      // Enter → go to /search with query (per spec)
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div className="searchbar" ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        className="searchbar-input"
        placeholder={`Search books  (${isMac ? '⌘' : 'Ctrl'}+E)`}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        disabled={adding}
      />

      {showDropdown && (
        <div className="searchbar-dropdown" role="listbox">
          {loading && results.length === 0 && (
            <div className="dropdown-state">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="dropdown-state">No results</div>
          )}
          {results.map((r, idx) => {
            const key = r.open_library_key || r.title;
            return (
              <button
                key={key}
                type="button"
                className={`dropdown-item ${idx === activeIdx ? 'active' : ''}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => pickResult(r)}
                disabled={adding}
              >
                <div className="dd-cover">
                  {r.cover_url ? (
                    <img src={r.cover_url} alt="" loading="lazy" />
                  ) : (
                    <div className="dd-cover-placeholder">{r.title[0]}</div>
                  )}
                </div>
                <div className="dd-info">
                  <div className="dd-title">{r.title}</div>
                  {r.author && <div className="dd-author">{r.author}</div>}
                </div>
              </button>
            );
          })}
          {results.length > 0 && (
            <button
              type="button"
              className={`dropdown-more ${activeIdx === results.length ? 'active' : ''}`}
              onMouseEnter={() => setActiveIdx(results.length)}
              onClick={() => {
                navigate(`/search?q=${encodeURIComponent(query)}`);
                setOpen(false);
              }}
            >
              More results →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
