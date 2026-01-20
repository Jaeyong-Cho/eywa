import { useLiveQuery } from 'dexie-react-hooks';
import { formatDistanceToNow } from 'date-fns';
import { db } from '../db/database';
import type { Workspace } from '@eywa/core';

interface NoteListProps {
  workspace: Workspace;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
}

export function NoteList({
  workspace,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
}: NoteListProps) {
  const notes = useLiveQuery(() =>
    db.notes
      .where('workspaceId')
      .equals(workspace.id)
      .reverse()
      .sortBy('updatedAt')
  );

  if (!notes) {
    return <div className="note-list">Loading notes...</div>;
  }

  function formatTimestamp(timestamp: number): string {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  }

  return (
    <div className="note-list">
      <div className="note-list-header">
        <h2>Notes</h2>
        <button className="create-note-btn" onClick={onCreateNote}>
          + New Note
        </button>
      </div>
      <div className="note-list-items">
        {notes.length === 0 ? (
          <div className="empty-state">
            No notes yet. Create your first note!
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`note-list-item ${
                selectedNoteId === note.id ? 'selected' : ''
              }`}
              onClick={() => onSelectNote(note.id)}
            >
              <div className="note-item-title">{note.title || 'Untitled'}</div>
              <div className="note-item-meta">
                {formatTimestamp(note.updatedAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
