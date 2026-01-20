import { db } from '../db/database';
import { createHeadingChunks, type HeadingChunk } from '@eywa/core';

export async function updateHeadingChunks(
  noteId: string,
  markdown: string
): Promise<HeadingChunk[]> {
  const existingChunks = await db.headingChunks
    .where('noteId')
    .equals(noteId)
    .toArray();

  if (existingChunks.length > 0) {
    await db.headingChunks.where('noteId').equals(noteId).delete();
  }

  const chunks = await createHeadingChunks(noteId, markdown);

  if (chunks.length > 0) {
    await db.headingChunks.bulkAdd(chunks);
  }

  return chunks;
}

export async function getHeadingChunks(
  noteId: string
): Promise<HeadingChunk[]> {
  return await db.headingChunks.where('noteId').equals(noteId).toArray();
}
