import { useLiveQuery } from 'dexie-react-hooks';
import ReactMarkdown from 'react-markdown';
import { db } from '../db/database';
import type { RecommendationScore } from '@eywa/core';

interface RecommendationCardProps {
  recommendation: RecommendationScore;
  mode: 'note' | 'heading';
  onOpenNote: (noteId: string) => void;
  onThumbsUp: (noteId: string) => void;
  onThumbsDown: (noteId: string) => void;
}

export function RecommendationCard({
  recommendation,
  mode,
  onOpenNote,
  onThumbsUp,
  onThumbsDown,
}: RecommendationCardProps) {

  const note = useLiveQuery(
    async () => {
      return await db.notes.get(recommendation.noteId);
    },
    [recommendation.noteId]
  );

  const heading = useLiveQuery(
    async () => {
      if (!recommendation.headingId) {
        return null;
      }
      return await db.headingChunks.get(recommendation.headingId);
    },
    [recommendation.headingId]
  );

  if (!note) {
    return null;
  }

  const displayTitle = note.title || 'Untitled';
  const hasHeading = !!heading;
  const contentPreview = hasHeading
    ? heading.content
    : note.content;

  return (
    <div className={`recommendation-card ${mode === 'heading' ? 'heading-mode' : 'note-mode'}`}>
      <div className="card-header">
        <div className="card-title-section">
          {mode === 'heading' && hasHeading ? (
            <>
              <div className="card-title primary">
                {heading.heading}
              </div>
              <div className="card-subtitle">
                from {displayTitle}
              </div>
            </>
          ) : (
            <>
              <div className="card-title primary">
                {displayTitle}
              </div>
              {hasHeading && (
                <div className="card-subtitle">
                  → {heading.heading}
                </div>
              )}
            </>
          )}
          <div className="card-meta">
            <span className="card-score">{(recommendation.score * 100).toFixed(0)}%</span>
            {hasHeading && (
              <span className="card-badge">H{heading.level}</span>
            )}
          </div>
        </div>
      </div>

      <div className="card-content">
        <div className="card-preview">
          <ReactMarkdown>
            {hasHeading ? `## ${heading.heading}\n\n${heading.content}` : contentPreview}
          </ReactMarkdown>
        </div>
        <div className="card-reasons">
          {recommendation.reasons.slice(0, 3).map((reason, idx) => (
            <span key={idx} className="reason-pill">
              {reason.detail}
            </span>
          ))}
        </div>
      </div>

      <div className="card-actions">
        <button
          className="card-action-btn primary"
          onClick={() => onOpenNote(note.id)}
        >
          Open Note
        </button>
        <div className="card-feedback">
          <button
            className="feedback-btn thumbs-up"
            onClick={() => onThumbsUp(note.id)}
            title="Helpful"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
          </button>
          <button
            className="feedback-btn thumbs-down"
            onClick={() => onThumbsDown(note.id)}
            title="Not helpful"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
