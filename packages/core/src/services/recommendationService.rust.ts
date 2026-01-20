import { invoke } from '@tauri-apps/api/tauri';
import {
  Note,
  HeadingChunk,
  RecommendationScore,
  WorkspaceSettings,
} from '../types/note';

declare const window: any;

export async function recommendNotesRust(
  currentNote: Note,
  allNotes: Note[],
  relations: Map<string, number>,
  settings: WorkspaceSettings
): Promise<RecommendationScore[]> {
  const relationsObj = Object.fromEntries(relations);

  const result = await invoke<RecommendationScore[]>('recommend_notes', {
    currentNote,
    allNotes,
    relations: relationsObj,
    settings,
  });

  return result;
}

export async function recommendHeadingsRust(
  currentHeadingText: string,
  currentEmbedding: number[],
  allChunks: HeadingChunk[],
  currentNoteId: string,
  settings: WorkspaceSettings
): Promise<RecommendationScore[]> {
  const result = await invoke<RecommendationScore[]>('recommend_headings', {
    currentHeadingText,
    currentEmbedding,
    allChunks,
    currentNoteId,
    settings,
  });

  return result;
}

export async function calculateCosineSimilarityRust(
  a: number[],
  b: number[]
): Promise<number> {
  return await invoke<number>('calculate_cosine_similarity', { a, b });
}

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in (window as any);
}
