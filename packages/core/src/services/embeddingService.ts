import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

let embeddingPipeline: any = null;

export async function initializeEmbeddingModel(
  modelName: string = 'Xenova/all-MiniLM-L6-v2'
): Promise<void> {
  if (embeddingPipeline) {
    return;
  }

  embeddingPipeline = await pipeline(
    'feature-extraction',
    modelName
  );
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    await initializeEmbeddingModel();
  }

  if (!text.trim()) {
    throw new Error('Text cannot be empty');
  }

  const output = await embeddingPipeline(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}

export function calculateCosineSimilarity(
  embedding1: number[],
  embedding2: number[]
): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  if (embedding1.length === 0) {
    throw new Error('Embeddings cannot be empty');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const magnitude1 = Math.sqrt(norm1);
  const magnitude2 = Math.sqrt(norm2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

export function isEmbeddingInitialized(): boolean {
  return embeddingPipeline !== null;
}
