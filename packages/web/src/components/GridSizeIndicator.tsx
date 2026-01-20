import { useEffect, useState } from 'react';

interface GridSizeIndicatorProps {
  containerWidth: number;
}

export function GridSizeIndicator({ containerWidth }: GridSizeIndicatorProps) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const minCardWidth = containerWidth >= 600 ? 320 : 280;
    const gap = 16;
    const padding = 40;
    const availableWidth = containerWidth - padding;
    
    const cols = Math.max(1, Math.floor((availableWidth + gap) / (minCardWidth + gap)));
    setColumns(cols);
  }, [containerWidth]);

  return (
    <div className="grid-size-indicator">
      {columns} {columns === 1 ? 'column' : 'columns'}
    </div>
  );
}
