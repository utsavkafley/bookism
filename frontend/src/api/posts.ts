import { apiFetch } from './client';
import type { JSONContent } from '@tiptap/react';

export interface Post {
  id: number;
  book_id: number;
  content: JSONContent;
  created_at: string;
  updated_at: string;
}

export function listPosts(bookId: number) {
  return apiFetch<Post[]>(`/books/${bookId}/posts`);
}

export function createPost(bookId: number, content: JSONContent) {
  return apiFetch<Post>(`/books/${bookId}/posts`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function updatePost(postId: number, content: JSONContent) {
  return apiFetch<Post>(`/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

export function deletePost(postId: number) {
  return apiFetch<void>(`/posts/${postId}`, { method: 'DELETE' });
}
