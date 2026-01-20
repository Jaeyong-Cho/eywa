import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizableOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth?: number;
}

export function useResizable({
  initialWidth,
  minWidth,
  maxWidth,
}: UseResizableOptions) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(initialWidth);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    function handleMouseMove(e: MouseEvent): void {
      const deltaX = startXRef.current - e.clientX;
      let newWidth = Math.max(minWidth, startWidthRef.current + deltaX);
      
      if (maxWidth !== undefined) {
        newWidth = Math.min(maxWidth, newWidth);
      }
      
      setWidth(newWidth);
    }

    function handleMouseUp(): void {
      setIsResizing(false);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return {
    width,
    isResizing,
    handleMouseDown,
  };
}
