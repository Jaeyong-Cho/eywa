import {
  Note,
  HeadingChunk,
  RecommendationScore,
  RecommendationReason,
  WorkspaceSettings,
} from '../types/note';
import { calculateCosineSimilarity } from './embeddingService';

const DEFAULT_SCORE_WEIGHTS = {
  semantic: 0.4,
  tag: 0.2,
  recent: 0.2,
  relation: 0.15,
  engagement: 0.05,
};

const RECENT_VIEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function calculateTagSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 || tags2.length === 0) {
    return 0;
  }

  const set1 = new Set(tags1);
  const set2 = new Set(tags2);
  const intersection = [...set1].filter((tag) => set2.has(tag));

  return intersection.length / Math.max(tags1.length, tags2.length);
}

function calculateRecencyScore(lastViewedAt: number): number {
  const timeSinceView = Date.now() - lastViewedAt;
  if (timeSinceView > RECENT_VIEW_THRESHOLD_MS) {
    return 0;
  }

  return 1 - timeSinceView / RECENT_VIEW_THRESHOLD_MS;
}

function calculateEngagementScore(note: Note): number {
  const totalEngagement = note.thumbsUp + note.thumbsDown;
  if (totalEngagement === 0) {
    return 0.5;
  }

  return note.thumbsUp / totalEngagement;
}

interface RecommendationContext {
  currentNote: Note;
  allNotes: Note[];
  relations: Map<string, number>;
  settings?: WorkspaceSettings;
}

export function recommendNotes(
  context: RecommendationContext
): RecommendationScore[] {
  const { currentNote, allNotes, relations, settings } = context;
  const maxRecommendations = settings?.maxRecommendations ?? 5;
  const semanticThreshold = settings?.semanticThreshold ?? 0.1;

  const otherNotes = allNotes.filter((note) => note.id !== currentNote.id);
  const scores: RecommendationScore[] = [];

  for (const note of otherNotes) {
    const reasons: RecommendationReason[] = [];
    let totalScore = 0;

    if (currentNote.embedding && note.embedding) {
      const semanticScore = calculateCosineSimilarity(
        currentNote.embedding,
        note.embedding
      );

      if (semanticScore > semanticThreshold) {
        const weightedScore = semanticScore * DEFAULT_SCORE_WEIGHTS.semantic;
        totalScore += weightedScore;
        reasons.push({
          type: 'semantic',
          weight: weightedScore,
          detail: `${(semanticScore * 100).toFixed(0)}% content similarity`,
        });
      }
    }

    const tagScore = calculateTagSimilarity(currentNote.tags, note.tags);
    if (tagScore > 0) {
      const weightedScore = tagScore * DEFAULT_SCORE_WEIGHTS.tag;
      totalScore += weightedScore;
      reasons.push({
        type: 'tag',
        weight: weightedScore,
        detail: `Shared tags`,
      });
    }

    const recencyScore = calculateRecencyScore(note.lastViewedAt);
    if (recencyScore > 0) {
      const weightedScore = recencyScore * DEFAULT_SCORE_WEIGHTS.recent;
      totalScore += weightedScore;
      reasons.push({
        type: 'recent',
        weight: weightedScore,
        detail: `Recently viewed`,
      });
    }

    const relationWeight = relations.get(note.id) ?? 0;
    if (relationWeight > 0) {
      const weightedScore = relationWeight * DEFAULT_SCORE_WEIGHTS.relation;
      totalScore += weightedScore;
      reasons.push({
        type: 'relation',
        weight: weightedScore,
        detail: `Linked notes`,
      });
    }

    const engagementScore = calculateEngagementScore(note);
    const weightedEngagement =
      engagementScore * DEFAULT_SCORE_WEIGHTS.engagement;
    totalScore += weightedEngagement;
    reasons.push({
      type: 'engagement',
      weight: weightedEngagement,
      detail: `${note.thumbsUp} positive feedback`,
    });

    if (totalScore > 0) {
      scores.push({
        noteId: note.id,
        score: totalScore,
        reasons,
      });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, maxRecommendations);
}

export function recommendHeadings(
  currentHeading: string,
  currentEmbedding: number[] | undefined,
  allChunks: HeadingChunk[],
  currentNoteId: string,
  limit: number = 5
): RecommendationScore[] {
  const scores: RecommendationScore[] = [];

  for (const chunk of allChunks) {
    if (chunk.noteId === currentNoteId) {
      continue;
    }

    if (!currentEmbedding || !chunk.embedding) {
      continue;
    }

    const similarity = calculateCosineSimilarity(
      currentEmbedding,
      chunk.embedding
    );

    if (similarity > 0.3) {
      scores.push({
        noteId: chunk.noteId,
        headingId: chunk.id,
        score: similarity,
        reasons: [
          {
            type: 'semantic',
            weight: similarity,
            detail: `Similar to: ${chunk.heading}`,
          },
        ],
      });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, limit);
}
