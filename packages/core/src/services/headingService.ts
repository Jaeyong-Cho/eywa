import { nanoid } from 'nanoid';
import { HeadingChunk } from '../types/note';
import { generateEmbedding } from './embeddingService';

interface ParsedHeading {
  level: number;
  text: string;
  lineNumber: number;
}

export function extractHeadingsFromMarkdown(
  markdown: string
): ParsedHeading[] {
  const lines = markdown.split('\n');
  const headings: ParsedHeading[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      headings.push({ level, text, lineNumber: i });
    }
  }

  return headings;
}

function extractContentForHeading(
  lines: string[],
  startLine: number,
  nextHeadingLine: number | null
): string {
  const endLine = nextHeadingLine ?? lines.length;
  return lines.slice(startLine + 1, endLine).join('\n').trim();
}

export async function createHeadingChunks(
  noteId: string,
  markdown: string
): Promise<HeadingChunk[]> {
  const lines = markdown.split('\n');
  const parsedHeadings = extractHeadingsFromMarkdown(markdown);

  const chunks: HeadingChunk[] = [];

  for (let i = 0; i < parsedHeadings.length; i++) {
    const heading = parsedHeadings[i];
    const nextHeading = parsedHeadings[i + 1];
    const nextHeadingLine = nextHeading ? nextHeading.lineNumber : null;

    const content = extractContentForHeading(
      lines,
      heading.lineNumber,
      nextHeadingLine
    );

    const textForEmbedding = `${heading.text}\n${content}`;
    const embedding = textForEmbedding.trim()
      ? await generateEmbedding(textForEmbedding)
      : undefined;

    const chunk: HeadingChunk = {
      id: nanoid(),
      noteId,
      heading: heading.text,
      content,
      level: heading.level,
      startLine: heading.lineNumber,
      endLine: nextHeadingLine ?? lines.length,
      embedding,
    };

    chunks.push(chunk);
  }

  return chunks;
}
