import { nanoid } from 'nanoid';
import { db } from '../db/database';
import { generateEmbedding, type Note } from '@eywa/core';
import { updateHeadingChunks } from './headingService';
import {
  type FileSystemFile,
  type FileSystemDirectory,
  readMarkdownFiles,
  extractTitleFromMarkdown,
  verifyDirectoryPermission,
} from './fileSystemService';

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function importMarkdownFiles(
  workspaceId: string,
  directory: FileSystemDirectory
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (!(await verifyDirectoryPermission(directory.handle))) {
    result.errors.push('Permission denied to read directory');
    return result;
  }

  const files = await readMarkdownFiles(directory);
  const existingNotes = await db.notes
    .where('workspaceId')
    .equals(workspaceId)
    .toArray();

  const notesByPath = new Map(
    existingNotes
      .filter(note => note.title)
      .map(note => [note.title, note])
  );

  for (const file of files) {
    try {
      await importSingleFile(workspaceId, file, notesByPath, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to import ${file.name}: ${errorMessage}`);
    }
  }

  return result;
}

async function importSingleFile(
  workspaceId: string,
  file: FileSystemFile,
  notesByPath: Map<string, Note>,
  result: ImportResult
): Promise<void> {
  const title = extractTitleFromMarkdown(file.content);
  const existingNote = notesByPath.get(file.path);

  if (existingNote) {
    if (existingNote.updatedAt >= file.lastModified) {
      result.skipped++;
      return;
    }

    const embedding = file.content.trim()
      ? await generateEmbedding(file.content)
      : undefined;

    await db.notes.update(existingNote.id, {
      content: file.content,
      title,
      updatedAt: file.lastModified,
      embedding,
    });

    await updateHeadingChunks(existingNote.id, file.content);
    result.updated++;
  } else {
    const now = Date.now();
    const embedding = file.content.trim()
      ? await generateEmbedding(file.content)
      : undefined;

    const note: Note = {
      id: nanoid(),
      workspaceId,
      title: file.path,
      content: file.content,
      createdAt: file.lastModified,
      updatedAt: file.lastModified,
      tags: extractTags(file.content),
      thumbsUp: 0,
      thumbsDown: 0,
      viewCount: 0,
      lastViewedAt: now,
      embedding,
    };

    await db.notes.add(note);
    await updateHeadingChunks(note.id, file.content);
    result.imported++;
  }
}

function extractTags(content: string): string[] {
  const tagRegex = /#(\w+)/g;
  const tags = new Set<string>();
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    if (match[1].length > 2) {
      tags.add(match[1].toLowerCase());
    }
  }

  return Array.from(tags);
}

export async function syncWorkspaceFiles(
  workspaceId: string,
  directory: FileSystemDirectory
): Promise<ImportResult> {
  return await importMarkdownFiles(workspaceId, directory);
}
