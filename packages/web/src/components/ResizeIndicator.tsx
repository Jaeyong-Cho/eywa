interface ResizeIndicatorProps {
  isResizing: boolean;
  width: number;
}

export function ResizeIndicator({ isResizing, width }: ResizeIndicatorProps) {
  if (!isResizing) {
    return null;
  }

  return (
    <div className="resize-indicator">
      <div className="resize-indicator-content">
        {width}px
      </div>
    </div>
  );
}
