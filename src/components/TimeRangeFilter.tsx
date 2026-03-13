import { TimeRange } from '../lib/statistics';
import DateTimePicker from './DateTimePicker';

interface TimeRangeFilterProps {
  value: TimeRange | null;
  onChange: (range: TimeRange | null) => void;
}

export default function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  const handleFrom = (from: Date | null) => {
    const to = value?.to ?? null;
    if (!from && !to) { onChange(null); return; }
    onChange({ from, to });
  };

  const handleTo = (to: Date | null) => {
    const from = value?.from ?? null;
    if (!from && !to) { onChange(null); return; }
    onChange({ from, to });
  };

  const hasAny = !!(value?.from || value?.to);

  return (
    <div className="time-range-filter">
      <div className="time-range-header">
        <h4>⏱ Time Range</h4>
        {hasAny && (
          <button className="time-range-clear" onClick={() => onChange(null)} title="Clear time range">✕</button>
        )}
      </div>
      <div className="time-range-pickers">
        <DateTimePicker value={value?.from ?? null} onChange={handleFrom} placeholder="From…" />
        <span className="time-range-sep">→</span>
        <DateTimePicker value={value?.to ?? null} onChange={handleTo} placeholder="To…" />
      </div>
    </div>
  );
}
