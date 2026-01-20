import { useState, useEffect, useRef } from 'react';
import type { RecommendationScore } from '@eywa/core';

interface UseAsyncRecommendationsOptions {
  debounceMs?: number;
  onError?: (error: Error) => void;
}

export function useAsyncRecommendations({
  debounceMs = 10000,
  onError,
}: UseAsyncRecommendationsOptions = {}) {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [status, setStatus] = useState<'idle' | 'waiting' | 'computing'>('idle');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const computeFnRef = useRef<(() => Promise<RecommendationScore[]>) | null>(null);

  const clearTimers = () => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const compute = (computeFn: () => Promise<RecommendationScore[]>) => {
    assert(typeof computeFn === 'function', 'computeFn must be a function');
    
    clearTimers();
    
    computeFnRef.current = computeFn;
    setStatus('waiting');
    setRemainingTime(debounceMs / 1000);

    const startTime = Date.now();

    countdownIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((debounceMs - elapsed) / 1000));
      setRemainingTime(remaining);
    }, 1000);

    debounceTimerRef.current = window.setTimeout(async () => {
      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      setRemainingTime(0);
      setStatus('computing');
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await new Promise(r => requestIdleCallback(r as IdleRequestCallback, { timeout: 100 }));

        if (controller.signal.aborted) {
          return;
        }

        const results = await computeFn();

        if (!controller.signal.aborted) {
          setRecommendations(results);
          setStatus('idle');
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const error = err instanceof Error ? err : new Error('Unknown error');
          setError(error);
          setStatus('idle');
          if (onError) {
            onError(error);
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    assert(debounceTimerRef.current !== null, 'Timer should be set');
    assert(countdownIntervalRef.current !== null, 'Countdown interval should be set');
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    remainingTime,
    status,
    compute,
    cancel: clearTimers,
  };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
