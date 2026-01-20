import { useState, useEffect } from 'react';

interface RecommendationStatusProps {
  isLoading: boolean;
  remainingTime: number;
}

export function RecommendationStatus({ isLoading, remainingTime }: RecommendationStatusProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (remainingTime > 0) {
      const totalTime = 10000;
      const elapsed = totalTime - remainingTime;
      setProgress((elapsed / totalTime) * 100);
    } else {
      setProgress(0);
    }
  }, [remainingTime]);

  if (isLoading) {
    return (
      <div className="recommendation-status loading">
        <div className="status-dot pulsing"></div>
        <span>Updating recommendations...</span>
      </div>
    );
  }

  if (remainingTime > 0) {
    return (
      <div className="recommendation-status waiting">
        <div className="status-dot"></div>
        <span>Next update in {remainingTime}s</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    );
  }

  return null;
}
