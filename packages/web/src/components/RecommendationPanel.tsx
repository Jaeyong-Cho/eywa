import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import {
  recommendNotes,
  recommendHeadings,
  extractHeadingsFromMarkdown,
  type RecommendationScore,
  type Note,
  type Workspace,
} from '@eywa/core';
import { updateNoteEngagement } from '../services/noteService';
import { RecommendationCard } from './RecommendationCard';
import { ResizeIndicator } from './ResizeIndicator';
import { GridSizeIndicator } from './GridSizeIndicator';
import { useResizable } from '../hooks/useResizable';

interface RecommendationPanelProps {
  currentNoteId: string;
  currentNote: Note;
  workspace: Workspace;
  onSelectNote: (noteId: string) => void;
}

export function RecommendationPanel({
  currentNoteId,
  currentNote,
  workspace,
  onSelectNote,
}: RecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<
    RecommendationScore[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'note' | 'heading'>('heading');
  const [debugInfo, setDebugInfo] = useState<string>('');

  const { width, isResizing, handleMouseDown } = useResizable({
    initialWidth: 400,
    minWidth: 300,
  });

  const notes = useLiveQuery(() =>
    db.notes.where('workspaceId').equals(workspace.id).toArray()
  );

  const allHeadingChunks = useLiveQuery(() =>
    db.headingChunks.toArray()
  );

  useEffect(() => {
    async function loadRecommendations(): Promise<void> {
      if (!currentNote.content.trim() || !notes) {
        setRecommendations([]);
        return;
      }

      setLoading(true);

      if (mode === 'heading') {
        await loadHeadingRecommendations();
      } else {
        await loadNoteRecommendations();
      }

      setLoading(false);
    }

    async function loadHeadingRecommendations(): Promise<void> {
      if (!allHeadingChunks) {
        setDebugInfo('No heading chunks available');
        return;
      }

      const currentNoteChunks = await db.headingChunks
        .where('noteId')
        .equals(currentNoteId)
        .toArray();

      if (currentNoteChunks.length === 0) {
        setDebugInfo('Current note has no heading chunks. Add headings with # to get recommendations.');
        setRecommendations([]);
        return;
      }

      const lastChunk = currentNoteChunks[currentNoteChunks.length - 1];
      
      if (!lastChunk.embedding) {
        setDebugInfo('Current heading has no embedding. Please wait for embedding generation.');
        setRecommendations([]);
        return;
      }

      setDebugInfo(`Comparing against ${allHeadingChunks.length} heading chunks`);

      const scores = recommendHeadings(
        lastChunk.heading,
        lastChunk.embedding,
        allHeadingChunks,
        currentNoteId,
        workspace.settings.maxRecommendations
      );

      setDebugInfo(`Found ${scores.length} recommendations`);
      setRecommendations(scores);
    }

    async function loadNoteRecommendations(): Promise<void> {
      if (!notes) {
        return;
      }

      const relations = await db.noteRelations
        .where('sourceNoteId')
        .equals(currentNoteId)
        .toArray();

      const relationMap = new Map<string, number>();
      for (const rel of relations) {
        relationMap.set(rel.targetNoteId, rel.weight);
      }

      const scores = recommendNotes({
        currentNote,
        allNotes: notes,
        relations: relationMap,
        settings: workspace.settings,
      });

      setRecommendations(scores);
    }

    const debounceTimer = setTimeout(loadRecommendations, 500);
    return () => clearTimeout(debounceTimer);
  }, [currentNoteId, currentNote, workspace, notes, allHeadingChunks, mode]);

  async function handleThumbsUp(noteId: string): Promise<void> {
    await updateNoteEngagement(noteId, 'up');
  }

  async function handleThumbsDown(noteId: string): Promise<void> {
    await updateNoteEngagement(noteId, 'down');
  }

  return (
    <div className="recommendation-panel" style={{ width: `${width}px` }}>
      <div
        className={`resize-handle ${isResizing ? 'resizing' : ''}`}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
      <ResizeIndicator isResizing={isResizing} width={width} />
      <div className="recommendation-header">
        <div className="header-top">
          <h3>Recommendations</h3>
          <GridSizeIndicator containerWidth={width} />
        </div>
        <div className="recommendation-mode-toggle">
          <button
            className={`mode-btn ${mode === 'heading' ? 'active' : ''}`}
            onClick={() => setMode('heading')}
          >
            Headings
          </button>
          <button
            className={`mode-btn ${mode === 'note' ? 'active' : ''}`}
            onClick={() => setMode('note')}
          >
            Notes
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">Loading recommendations...</div>
      )}

      {!loading && debugInfo && recommendations.length === 0 && (
        <div className="debug-info">{debugInfo}</div>
      )}

      {!loading && recommendations.length === 0 && !debugInfo && (
        <div className="empty-recommendations">
          Start writing to see related {mode === 'heading' ? 'headings' : 'notes'}
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="recommendation-cards">
          {recommendations.map((rec, index) => (
            <RecommendationCard
              key={`${rec.noteId}-${rec.headingId || index}`}
              recommendation={rec}
              mode={mode}
              onOpenNote={onSelectNote}
              onThumbsUp={handleThumbsUp}
              onThumbsDown={handleThumbsDown}
            />
          ))}
        </div>
      )}
    </div>
  );
}
