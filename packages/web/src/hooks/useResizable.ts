import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizableOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth?: number;
  direction?: 'left' | 'right';
}

export function useResizable({
  initialWidth,
  minWidth,
  maxWidth,
  direction = 'left',
}: UseResizableOptions) {
  console.assert(initialWidth > 0, 'initialWidth must be positive');
  console.assert(minWidth > 0, 'minWidth must be positive');
  
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
      const deltaX = e.clientX - startXRef.current;
      const adjustedDelta = direction === 'right' ? deltaX : -deltaX;
      let newWidth = Math.max(minWidth, startWidthRef.current + adjustedDelta);
      
      if (maxWidth !== undefined) {
        newWidth = Math.min(maxWidth, newWidth);
      }
      
      console.assert(newWidth >= minWidth, 'newWidth must be >= minWidth');
      console.assert(!maxWidth || newWidth <= maxWidth, 'newWidth must be <= maxWidth if maxWidth is set');
      
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
