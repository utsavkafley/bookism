import { apiFetch } from './client';

export type BookStatus = 'currently_reading' | 'finished' | 'to_read';

export interface Book {
  id: number;
  open_library_key: string | null;
  title: string;
  author: string | null;
  cover_url: string | null;
  page_count: number | null;
  publish_year: number | null;
  isbn: string | null;
  status: BookStatus;
  year_read: number | null;
  notes: unknown | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  open_library_key: string | null;
  title: string;
  author: string | null;
  cover_url: string | null;
  page_count: number | null;
  publish_year: number | null;
  isbn: string | null;
}

export interface BookCreate {
  open_library_key?: string | null;
  title: string;
  author?: string | null;
  cover_url?: string | null;
  page_count?: number | null;
  publish_year?: number | null;
  isbn?: string | null;
  status: BookStatus;
}

export function searchBooks(q: string) {
  return apiFetch<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`);
}

export function listBooks(params: { status?: BookStatus; year_read?: number } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.year_read) query.set('year_read', String(params.year_read));
  const qs = query.toString();
  return apiFetch<Book[]>(`/books${qs ? `?${qs}` : ''}`);
}

export function getBook(id: number) {
  return apiFetch<Book>(`/books/${id}`);
}

export function createBook(body: BookCreate) {
  return apiFetch<Book>('/books', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateBook(id: number, body: Partial<Pick<Book, 'status' | 'year_read' | 'notes'>>) {
  return apiFetch<Book>(`/books/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteBook(id: number) {
  return apiFetch<void>(`/books/${id}`, { method: 'DELETE' });
}
