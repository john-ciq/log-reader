import { useState, useEffect, useRef } from 'react';

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDisplay(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DateTimePicker({ value, onChange, placeholder = 'Pick date & time…' }: DateTimePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [hours, setHours] = useState(value ? pad(value.getHours()) : '00');
  const [minutes, setMinutes] = useState(value ? pad(value.getMinutes()) : '00');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync inward when value prop changes from outside
  useEffect(() => {
    setSelectedDate(value);
    if (value) {
      setHours(pad(value.getHours()));
      setMinutes(pad(value.getMinutes()));
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const h = Math.min(23, Math.max(0, parseInt(hours, 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minutes, 10) || 0));
    const d = new Date(viewYear, viewMonth, day, h, m, 0, 0);
    setSelectedDate(d);
    onChange(d);
  };

  const handleTimeChange = (h: string, m: string) => {
    setHours(h);
    setMinutes(m);
    if (selectedDate) {
      const hh = Math.min(23, Math.max(0, parseInt(h, 10) || 0));
      const mm = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
      const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hh, mm, 0, 0);
      setSelectedDate(d);
      onChange(d);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    setHours('00');
    setMinutes('00');
    onChange(null);
  };

  // Build calendar cells: blanks + days
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selDay = selectedDate && selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth
    ? selectedDate.getDate() : null;

  return (
    <div className="dtp-container" ref={containerRef}>
      <div
        className={`dtp-field${open ? ' dtp-field--open' : ''}${value ? ' dtp-field--has-value' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="dtp-value">
          {value ? formatDisplay(value) : <span className="dtp-placeholder">{placeholder}</span>}
        </span>
        {value && (
          <button className="dtp-clear-btn" onClick={handleClear} title="Clear">✕</button>
        )}
        <span className="dtp-chevron">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="dtp-popup">
          <div className="dtp-cal-header">
            <button className="dtp-nav-btn" onClick={prevMonth}>‹</button>
            <span className="dtp-month-label">{MONTHS[viewMonth]} {viewYear}</span>
            <button className="dtp-nav-btn" onClick={nextMonth}>›</button>
          </div>

          <div className="dtp-cal-grid">
            {DAYS.map(d => (
              <span key={d} className="dtp-dow">{d}</span>
            ))}
            {cells.map((day, i) => day === null ? (
              <span key={`blank-${i}`} className="dtp-blank" />
            ) : (
              <button
                key={day}
                className={`dtp-day${day === selDay ? ' dtp-day--selected' : ''}`}
                onClick={() => selectDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="dtp-time-row">
            <span className="dtp-time-label">Time</span>
            <input
              className="dtp-time-input"
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={e => handleTimeChange(e.target.value.padStart(2, '0'), minutes)}
              onClick={e => e.stopPropagation()}
            />
            <span className="dtp-time-sep">:</span>
            <input
              className="dtp-time-input"
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={e => handleTimeChange(hours, e.target.value.padStart(2, '0'))}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
