import { useState } from 'react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  useRegex: boolean;
  onRegexChange: (useRegex: boolean) => void;
}

export default function SearchBar({
  query,
  onQueryChange,
  useRegex,
  onRegexChange,
}: SearchBarProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onQueryChange(value);

    // Validate regex if regex mode is enabled
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

  return (
    <div className="search-bar">
      <div className="search-input-group">
        <input
          type="text"
          placeholder={useRegex ? "Enter regex pattern..." : "Search logs..."}
          value={query}
          onChange={handleChange}
          className={`search-input ${error ? 'error' : ''}`}
        />
        <button
          className={`regex-toggle ${useRegex ? 'active' : ''}`}
          onClick={() => onRegexChange(!useRegex)}
          title="Toggle regex mode"
        >
          .*
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
