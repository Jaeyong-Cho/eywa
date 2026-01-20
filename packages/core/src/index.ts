export * from './types/note';

export {
  initializeEmbeddingModel,
  generateEmbedding,
  calculateCosineSimilarity,
  isEmbeddingInitialized,
} from './services/embeddingService';

export {
  extractHeadingsFromMarkdown,
  createHeadingChunks,
} from './services/headingService';

export {
  recommendNotes,
  recommendHeadings,
} from './services/recommendationService';

export {
  createWorkspace,
  updateWorkspaceSettings,
  updateWorkspaceAccess,
  validateWorkspaceSettings,
} from './services/workspaceService';
