import { useState } from 'react';

interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function TagManager({ tags, onAddTag, onRemoveTag }: TagManagerProps) {
  const [inputValue, setInputValue] = useState('');

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    const trimmedValue = inputValue.trim();

    if (trimmedValue === '') {
      return;
    }

    if (tags.includes(trimmedValue)) {
      setInputValue('');
      return;
    }

    onAddTag(trimmedValue);
    setInputValue('');
  }

  return (
    <div className="tag-manager">
      <div className="tag-list">
        {tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
            <button
              className="tag-remove"
              onClick={() => onRemoveTag(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="tag-input"
        placeholder="Add tag..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
