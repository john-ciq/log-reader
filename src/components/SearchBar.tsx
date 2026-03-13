import { useState, RefObject } from 'react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  useRegex: boolean;
  onRegexChange: (useRegex: boolean) => void;
  onConvertToFilter?: () => void;
  inputRef?: RefObject<HTMLInputElement>;
}

export default function SearchBar({
  query,
  onQueryChange,
  useRegex,
  onRegexChange,
  onConvertToFilter,
  inputRef,
}: SearchBarProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onQueryChange(value);

    if (useRegex && value.trim()) {
      try {
        new RegExp(value);
        setError(null);
      } catch (err) {
        setError(`Invalid regex: ${(err as Error).message}`);
      }
    } else {
      setError(null);
    }
  };

  const handleClear = () => {
    onQueryChange('');
    setError(null);
    inputRef?.current?.focus();
  };

  return (
    <div className="search-bar">
      <div className="search-input-group">
        <div className="search-input-wrap">
          <input
            ref={inputRef}
            type="text"
            placeholder={useRegex ? "Enter regex pattern..." : "Search logs..."}
            value={query}
            onChange={handleChange}
            className={`search-input ${error ? 'error' : ''}`}
          />
          {query && (
            <button className="search-clear-btn" onClick={handleClear} title="Clear search" tabIndex={-1}>✕</button>
          )}
        </div>
        <button
          className={`regex-toggle ${useRegex ? 'active' : ''}`}
          onClick={() => onRegexChange(!useRegex)}
          title="Toggle regex mode"
        >
          .*
        </button>
        {onConvertToFilter && (
          <button
            className="add-filter-btn"
            onClick={onConvertToFilter}
            disabled={!query.trim()}
            title="Add current search as a filter"
          >
            + Filter
          </button>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
