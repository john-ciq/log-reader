import { useMemo, useRef, useState } from 'react';
import { LogEntry } from '../lib/parser';
import { TimeRange } from '../lib/statistics';

interface LogDensityHistogramProps {
  entries: LogEntry[];
  timeRange: TimeRange | null;
  onTimeRangeChange: (range: TimeRange | null) => void;
}

const BINS = 80;
const HEIGHT = 60;
const LEVEL_COLORS: Record<string, string> = {
  error: '#e05252',
  warn:  '#e09a52',
  warning: '#e09a52',
  info:  '#5299e0',
  debug: '#7a7a7a',
  log:   '#5ab55a',
};
const DEFAULT_COLOR = '#888';

export default function LogDensityHistogram({ entries, timeRange, onTimeRangeChange }: LogDensityHistogramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);

  const { bins, minTime, maxTime } = useMemo(() => {
    if (entries.length === 0) return { bins: [], minTime: 0, maxTime: 0 };
    const times = entries.map(e => e.timestamp.getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    if (minTime === maxTime) return { bins: [], minTime, maxTime };

    const binSize = (maxTime - minTime) / BINS;
    const bins: Array<Record<string, number>> = Array.from({ length: BINS }, () => ({}));

    for (const entry of entries) {
      const t = entry.timestamp.getTime();
      const idx = Math.min(BINS - 1, Math.floor((t - minTime) / binSize));
      const lvl = entry.level.toLowerCase();
      bins[idx][lvl] = (bins[idx][lvl] || 0) + 1;
    }
    return { bins, minTime, maxTime };
  }, [entries]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...bins.map(b => Object.values(b).reduce((a, v) => a + v, 0)));
  }, [bins]);

  if (entries.length === 0 || bins.length === 0) return null;

  const svgWidth = BINS * 2; // logical units; SVG will stretch via viewBox
  const barW = svgWidth / BINS;

  const timeToX = (t: number) => ((t - minTime) / (maxTime - minTime)) * svgWidth;

  const selLeft = dragStart !== null && dragCurrent !== null
    ? Math.min(dragStart, dragCurrent)
    : timeRange?.from ? timeToX(timeRange.from.getTime()) : null;
  const selRight = dragStart !== null && dragCurrent !== null
    ? Math.max(dragStart, dragCurrent)
    : timeRange?.to ? timeToX(timeRange.to.getTime()) : null;

  const getSvgX = (clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const frac = (clientX - rect.left) / rect.width;
    return frac * svgWidth;
  };

  const xToTime = (x: number): number => {
    return minTime + (x / svgWidth) * (maxTime - minTime);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const x = getSvgX(e.clientX);
    setDragStart(x);
    setDragCurrent(x);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragStart === null) return;
    setDragCurrent(getSvgX(e.clientX));
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragStart === null) return;
    const endX = getSvgX(e.clientX);
    const x1 = Math.min(dragStart, endX);
    const x2 = Math.max(dragStart, endX);
    setDragStart(null);
    setDragCurrent(null);
    if (Math.abs(x2 - x1) < 1) {
      onTimeRangeChange(null);
      return;
    }
    onTimeRangeChange({ from: new Date(xToTime(x1)), to: new Date(xToTime(x2)) });
  };

  const handleMouseLeave = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragStart !== null) handleMouseUp(e);
  };

  return (
    <div className="histogram-wrapper">
      <svg
        ref={svgRef}
        className="log-density-histogram"
        viewBox={`0 0 ${svgWidth} ${HEIGHT}`}
        preserveAspectRatio="none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair' }}
      >
        {bins.map((bin, i) => {
          const x = i * barW;
          const levels = Object.entries(bin).sort(([a], [b]) => {
            const order = ['error', 'warn', 'warning', 'info', 'log', 'debug'];
            return order.indexOf(a) - order.indexOf(b);
          });
          let stackY = HEIGHT;
          return (
            <g key={i}>
              {levels.map(([lvl, cnt]) => {
                const segH = (cnt / maxCount) * HEIGHT;
                stackY -= segH;
                return (
                  <rect
                    key={lvl}
                    x={x}
                    y={stackY}
                    width={barW - 0.5}
                    height={segH}
                    fill={LEVEL_COLORS[lvl] || DEFAULT_COLOR}
                    opacity={0.85}
                  />
                );
              })}
            </g>
          );
        })}

        {selLeft !== null && selRight !== null && (
          <rect
            x={selLeft}
            y={0}
            width={Math.max(0, selRight - selLeft)}
            height={HEIGHT}
            fill="var(--histogram-sel-fill, rgba(99,130,220,0.2))"
            stroke="var(--histogram-sel-stroke, rgba(99,130,220,0.8))"
            strokeWidth={0.5}
          />
        )}
      </svg>
      {timeRange && (
        <button className="histogram-clear-btn" onClick={() => onTimeRangeChange(null)} title="Clear time range selection">✕</button>
      )}
    </div>
  );
}
