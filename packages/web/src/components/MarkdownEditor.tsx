import { useState, useEffect, useRef } from 'react';
import { Note } from '../types/note';
import { TagManager } from './TagManager';

interface MarkdownEditorProps {
  note: Note;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function MarkdownEditor({
  note,
  onContentChange,
  onTitleChange,
  onAddTag,
  onRemoveTag,
}: MarkdownEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);

  function handleTitleChange(newTitle: string): void {
    setTitle(newTitle);
    onTitleChange(newTitle);
  }

  function handleContentChange(newContent: string): void {
    setContent(newContent);
    onContentChange(newContent);
  }

  return (
    <div className="markdown-editor">
      <input
        ref={titleRef}
        type="text"
        className="note-title"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Note title"
      />
      <TagManager
        tags={note.tags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />
      <textarea
        ref={textareaRef}
        className="note-content"
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Write your note in markdown..."
      />
    </div>
  );
}
