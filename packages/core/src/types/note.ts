export interface Note {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  thumbsUp: number;
  thumbsDown: number;
  viewCount: number;
  lastViewedAt: number;
  embedding?: number[];
  filePath?: string;
}

export interface HeadingChunk {
  id: string;
  noteId: string;
  heading: string;
  content: string;
  level: number;
  startLine: number;
  endLine: number;
  embedding?: number[];
}

export interface NoteRelation {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  sourceHeadingId?: string;
  targetHeadingId?: string;
  weight: number;
  createdAt: number;
}

export interface ViewHistory {
  id: string;
  noteId: string;
  viewedAt: number;
  durationMs: number;
}

export interface RecommendationScore {
  noteId: string;
  headingId?: string;
  score: number;
  reasons: RecommendationReason[];
}

export interface RecommendationReason {
  type: 'semantic' | 'tag' | 'recent' | 'relation' | 'engagement';
  weight: number;
  detail: string;
}

export interface Workspace {
  id: string;
  name: string;
  path: string;
  createdAt: number;
  lastAccessedAt: number;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  embeddingModel: string;
  maxRecommendations: number;
  semanticThreshold: number;
  autoSaveDelay: number;
}
