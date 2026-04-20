import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { JSONContent } from '@tiptap/react';
import { useState } from 'react';
import { updatePost, deletePost, type Post } from '../api/posts';
import './PostsSection.css';

interface Props {
  posts: Post[];
  onPostsChange: (posts: Post[]) => void;
}

export default function PostsSection({ posts, onPostsChange }: Props) {
  async function handleUpdate(postId: number, content: JSONContent) {
    const updated = await updatePost(postId, content);
    onPostsChange(posts.map((p) => (p.id === postId ? updated : p)));
  }

  async function handleDelete(postId: number) {
    if (!confirm('Delete this post?')) return;
    await deletePost(postId);
    onPostsChange(posts.filter((p) => p.id !== postId));
  }

  if (posts.length === 0) {
    return (
      <p className="posts-empty">
        No posts yet. Write a draft above, then Post to save a snapshot.
      </p>
    );
  }

  return (
    <div className="posts-list">
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          onUpdate={(content) => handleUpdate(post.id, content)}
          onDelete={() => handleDelete(post.id)}
        />
      ))}
    </div>
  );
}

function PostItem({
  post,
  onUpdate,
  onDelete,
}: {
  post: Post;
  onUpdate: (content: JSONContent) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (editing) {
    return (
      <PostEditor
        initialContent={post.content}
        onCancel={() => setEditing(false)}
        onSave={async (content) => {
          setSaving(true);
          try {
            await onUpdate(content);
            setEditing(false);
          } finally {
            setSaving(false);
          }
        }}
        saving={saving}
      />
    );
  }

  return (
    <article className="post-item">
      <PostContent content={post.content} />
      <footer className="post-meta">
        <time>{formatDate(post.created_at)}</time>
        <div className="post-actions">
          <button className="link-btn" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="link-btn danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </footer>
    </article>
  );
}

function PostContent({ content }: { content: JSONContent }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false,
  });
  if (!editor) return null;
  return <EditorContent editor={editor} className="post-content" />;
}

function PostEditor({
  initialContent,
  onSave,
  onCancel,
  saving,
}: {
  initialContent: JSONContent;
  onSave: (content: JSONContent) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
  });

  if (!editor) return null;

  return (
    <article className="post-item post-editing">
      <EditorContent editor={editor} className="post-content" />
      <footer className="post-meta">
        <div className="post-actions">
          <button
            className="btn-primary"
            onClick={() => onSave(editor.getJSON())}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="link-btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </footer>
    </article>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isEmptyDoc(doc: JSONContent | null | undefined): boolean {
  if (!doc || !doc.content || doc.content.length === 0) return true;
  const textContent = JSON.stringify(doc.content);
  return !/[a-zA-Z0-9]/.test(textContent);
}
