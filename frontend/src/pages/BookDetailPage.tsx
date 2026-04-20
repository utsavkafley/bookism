import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JSONContent } from '@tiptap/react';
import {
  getBook,
  updateBook,
  deleteBook,
  type Book,
  type BookStatus,
} from '../api/books';
import { listPosts, createPost, type Post } from '../api/posts';
import NotesEditor from '../components/NotesEditor';
import PostsSection, { isEmptyDoc } from '../components/PostsSection';
import './BookDetailPage.css';

const STATUS_LABELS: Record<BookStatus, string> = {
  currently_reading: 'Currently Reading',
  finished: 'Finished',
  to_read: 'To Read',
};

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getBook(Number(id)), listPosts(Number(id))])
      .then(([b, p]) => {
        setBook(b);
        setPosts(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: BookStatus) {
    if (!book) return;
    const updates: Parameters<typeof updateBook>[1] = { status: newStatus };
    if (newStatus === 'finished' && !book.year_read) {
      updates.year_read = new Date().getFullYear();
    }
    if (newStatus !== 'finished' && book.year_read) {
      updates.year_read = null;
    }
    try {
      const updated = await updateBook(book.id, updates);
      setBook(updated);
      setActionError(null);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function handleYearChange(year: number | null) {
    if (!book) return;
    try {
      const updated = await updateBook(book.id, { year_read: year });
      setBook(updated);
      setActionError(null);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function handleDelete() {
    if (!book) return;
    if (!confirm(`Remove "${book.title}" from your library?`)) return;
    try {
      await deleteBook(book.id);
      navigate('/library');
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function handlePost(getContent: () => JSONContent, clear: () => void) {
    if (!book) return;
    const content = getContent();
    if (isEmptyDoc(content)) return;
    setPosting(true);
    try {
      const newPost = await createPost(book.id, content);
      setPosts((prev) => [newPost, ...prev]);
      clear();
      // Also clear the draft in the book's notes column
      await updateBook(book.id, { notes: null });
      setActionError(null);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <p className="state-msg">Loading...</p>;
  if (error) return <p className="state-msg error">{error}</p>;
  if (!book) return <p className="state-msg">Book not found.</p>;

  return (
    <div className="book-detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {actionError && <p className="state-msg error">{actionError}</p>}

      <div className="book-header">
        <div className="cover">
          {book.cover_url ? (
            <img src={book.cover_url} alt="" />
          ) : (
            <div className="cover-placeholder">{book.title[0]}</div>
          )}
        </div>
        <div className="info">
          <h2>{book.title}</h2>
          {book.author && <p className="author">{book.author}</p>}
          <dl className="meta">
            {book.publish_year && (
              <>
                <dt>Published</dt>
                <dd>{book.publish_year}</dd>
              </>
            )}
            {book.page_count && (
              <>
                <dt>Pages</dt>
                <dd>{book.page_count}</dd>
              </>
            )}
          </dl>

          <div className="status-row">
            <label>Status</label>
            <select
              value={book.status}
              onChange={(e) => handleStatusChange(e.target.value as BookStatus)}
            >
              {(Object.keys(STATUS_LABELS) as BookStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {book.status === 'finished' && (
            <div className="status-row">
              <label>Year read</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={book.year_read ?? ''}
                onChange={(e) =>
                  handleYearChange(e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
          )}

          <button className="delete-btn" onClick={handleDelete}>
            Remove from library
          </button>
        </div>
      </div>

      <div className="notes-section">
        <div className="section-heading">
          <h3>Draft</h3>
          <span className="section-hint">Auto-saves. Post to snapshot it below.</span>
        </div>
        <NotesEditor
          initialContent={(book.notes as JSONContent | null) ?? null}
          onSave={async (content) => {
            await updateBook(book.id, { notes: content });
          }}
          footer={({ getContent, clear, isEmpty }) => (
            <button
              className="btn-primary"
              onClick={() => handlePost(getContent, clear)}
              disabled={isEmpty || posting}
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          )}
        />

        <div className="section-heading section-heading-posts">
          <h3>Posts</h3>
        </div>
        <PostsSection posts={posts} onPostsChange={setPosts} />
      </div>
    </div>
  );
}
