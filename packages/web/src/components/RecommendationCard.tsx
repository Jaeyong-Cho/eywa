import { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const truncatedPreview = contentPreview.length > 150
    ? contentPreview.slice(0, 150) + '...'
    : contentPreview;

  return (
    <div className={`recommendation-card ${mode === 'heading' ? 'heading-mode' : 'note-mode'}`}>
      <div className="card-header">
        <div className="card-title-section">
          {mode === 'heading' && hasHeading ? (
            <>
              <div className="card-title primary" onClick={() => setIsExpanded(!isExpanded)}>
                {heading.heading}
              </div>
              <div className="card-subtitle">
                from {displayTitle}
              </div>
            </>
          ) : (
            <>
              <div className="card-title primary" onClick={() => setIsExpanded(!isExpanded)}>
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
        <button
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
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
      )}

      {!isExpanded && (
        <div className="card-preview-collapsed">
          {truncatedPreview}
        </div>
      )}

      <div className="card-actions">
        <button
          className="card-action-btn primary"
          onClick={() => onOpenNote(note.id)}
        >
          Open Note
        </button>
        <div className="card-feedback">
          <button
            className="feedback-btn"
            onClick={() => onThumbsUp(note.id)}
            title="Helpful"
          >
            👍
          </button>
          <button
            className="feedback-btn"
            onClick={() => onThumbsDown(note.id)}
            title="Not helpful"
          >
            👎
          </button>
        </div>
      </div>
    </div>
  );
}
