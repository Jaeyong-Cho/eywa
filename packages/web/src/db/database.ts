import Dexie, { Table } from 'dexie';
import type {
  Note,
  HeadingChunk,
  NoteRelation,
  ViewHistory,
  Workspace,
} from '@eywa/core';

class EywaDatabase extends Dexie {
  workspaces!: Table<Workspace, string>;
  notes!: Table<Note, string>;
  headingChunks!: Table<HeadingChunk, string>;
  noteRelations!: Table<NoteRelation, string>;
  viewHistory!: Table<ViewHistory, string>;

  constructor() {
    super('EywaDB');
    
    this.version(1).stores({
      notes: 'id, title, createdAt, updatedAt, lastViewedAt',
      headingChunks: 'id, noteId, heading, level',
      noteRelations: 'id, sourceNoteId, targetNoteId, weight',
      viewHistory: 'id, noteId, viewedAt',
    });

    this.version(2).stores({
      workspaces: 'id, name, lastAccessedAt',
      notes: 'id, workspaceId, title, createdAt, updatedAt, lastViewedAt',
      headingChunks: 'id, noteId, heading, level',
      noteRelations: 'id, sourceNoteId, targetNoteId, weight',
      viewHistory: 'id, noteId, viewedAt',
    }).upgrade(async (tx) => {
      const notes = await tx.table('notes').toArray();
      const defaultWorkspaceId = 'default-workspace';
      
      await tx.table('workspaces').add({
        id: defaultWorkspaceId,
        name: 'Default Workspace',
        path: '/',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        settings: {
          embeddingModel: 'Xenova/all-MiniLM-L6-v2',
          maxRecommendations: 5,
          semanticThreshold: 0.1,
          autoSaveDelay: 500,
        },
      });

      for (const note of notes) {
        await tx.table('notes').update(note.id, {
          workspaceId: defaultWorkspaceId,
        });
      }
    });
  }
}

export const db = new EywaDatabase();
