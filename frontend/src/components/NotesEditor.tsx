import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { JSONContent } from '@tiptap/react';
import './NotesEditor.css';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  initialContent: JSONContent | null;
  onSave: (content: JSONContent) => Promise<void>;
  footer?: (api: EditorFooterApi) => React.ReactNode;
}

export interface EditorFooterApi {
  getContent: () => JSONContent;
  clear: () => void;
  isEmpty: boolean;
}

const DEBOUNCE_MS = 800;

export default function NotesEditor({ initialContent, onSave, footer }: Props) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isEmpty, setIsEmpty] = useState(true);
  const timerRef = useRef<number | null>(null);
  const latestContentRef = useRef<JSONContent | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || '',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      latestContentRef.current = json;
      setIsEmpty(editor.isEmpty);
      setSaveState('saving');
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(async () => {
        try {
          await onSave(latestContentRef.current as JSONContent);
          setSaveState('saved');
        } catch {
          setSaveState('error');
        }
      }, DEBOUNCE_MS);
    },
    onCreate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
    },
  });

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        if (latestContentRef.current) {
          onSave(latestContentRef.current).catch(() => {});
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!editor) return null;

  return (
    <div className="notes-editor">
      <div className="toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="Italic"
        >
          <i>I</i>
        </button>
        <span className="divider" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          title="Heading"
        >
          H
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="Bulleted list"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          title="Numbered list"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'active' : ''}
          title="Quote"
        >
          ❝
        </button>
        <span className="save-status">{statusLabel(saveState)}</span>
      </div>
      <EditorContent editor={editor} className="editor-content" />
      {footer && (
        <div className="editor-footer">
          {footer({
            getContent: () => editor.getJSON(),
            clear: () => {
              editor.commands.clearContent();
              setIsEmpty(true);
            },
            isEmpty,
          })}
        </div>
      )}
    </div>
  );
}

function statusLabel(state: SaveState): string {
  switch (state) {
    case 'saving':
      return 'Saving...';
    case 'saved':
      return 'Saved';
    case 'error':
      return 'Save failed';
    default:
      return '';
  }
}
