import { nanoid } from 'nanoid';
import { db } from '../db/database';
import { generateEmbedding, type Note } from '@eywa/core';

export async function createNote(
  workspaceId: string,
  title: string,
  content: string = ''
): Promise<Note> {
  const now = Date.now();
  const embedding = content.trim() ? await generateEmbedding(content) : undefined;

  const note: Note = {
    id: nanoid(),
    workspaceId,
    title,
    content,
    createdAt: now,
    updatedAt: now,
    tags: [],
    thumbsUp: 0,
    thumbsDown: 0,
    viewCount: 0,
    lastViewedAt: now,
    embedding,
  };

  await db.notes.add(note);
  return note;
}

let embeddingQueue: Promise<void> = Promise.resolve();

export async function updateNote(
  id: string,
  updates: Partial<Note>
): Promise<void> {
  const existingNote = await db.notes.get(id);
  if (!existingNote) {
    throw new Error(`Note with id ${id} not found`);
  }

  const updatedData: Partial<Note> = {
    ...updates,
    updatedAt: Date.now(),
  };

  await db.notes.update(id, updatedData);

  if (updates.content !== undefined) {
    embeddingQueue = embeddingQueue.then(async () => {
      try {
        const embedding = updates.content && updates.content.trim()
          ? await generateEmbedding(updates.content)
          : undefined;
        
        await db.notes.update(id, { embedding });
      } catch (error) {
        console.error('Failed to generate embedding:', error);
      }
    });
  }
}

export async function deleteNote(id: string): Promise<void> {
  const note = await db.notes.get(id);
  if (!note) {
    throw new Error(`Note with id ${id} not found`);
  }

  await db.notes.delete(id);
  await db.headingChunks.where('noteId').equals(id).delete();
  await db.noteRelations
    .where('sourceNoteId')
    .equals(id)
    .or('targetNoteId')
    .equals(id)
    .delete();
}

export async function getNote(id: string): Promise<Note | undefined> {
  return await db.notes.get(id);
}

export async function getAllNotes(): Promise<Note[]> {
  return await db.notes.orderBy('updatedAt').reverse().toArray();
}

export async function recordNoteView(
  noteId: string,
  durationMs: number
): Promise<void> {
  const note = await db.notes.get(noteId);
  if (!note) {
    throw new Error(`Note with id ${noteId} not found`);
  }

  await db.notes.update(noteId, {
    viewCount: note.viewCount + 1,
    lastViewedAt: Date.now(),
  });

  await db.viewHistory.add({
    id: nanoid(),
    noteId,
    viewedAt: Date.now(),
    durationMs,
  });
}

export async function updateNoteEngagement(
  noteId: string,
  type: 'up' | 'down'
): Promise<void> {
  const note = await db.notes.get(noteId);
  if (!note) {
    throw new Error(`Note with id ${noteId} not found`);
  }

  const updates =
    type === 'up'
      ? { thumbsUp: note.thumbsUp + 1 }
      : { thumbsDown: note.thumbsDown + 1 };

  await db.notes.update(noteId, updates);
}
