export interface SparklinePoint {
  date: string;
  value: number;
}

export interface SparklineProps {
  points: SparklinePoint[];
  ariaLabel: string;
  height?: number;
  width?: number;
  targetValue?: number | null;
  className?: string;
}

/**
 * A small dependency-free SVG line chart for a time series. No library — the app has no
 * charting dependency yet and this covers every "trend over time" need across Layer 12
 * (a KPI's entries, the Life Score history) without adding one.
 */
export function Sparkline({
  points,
  ariaLabel,
  height = 48,
  width = 240,
  targetValue,
  className,
}: SparklineProps) {
  if (points.length === 0) return null;

  const values = points.map((point) => point.value);
  const candidates =
    targetValue !== null && targetValue !== undefined ? [...values, targetValue] : values;
  const min = Math.min(...candidates);
  const max = Math.max(...candidates);
  const range = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  const toY = (value: number) => height - ((value - min) / range) * height;

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${index * stepX} ${toY(point.value)}`)
    .join(" ");
  const targetY = targetValue !== null && targetValue !== undefined ? toY(targetValue) : null;
  const lastPoint = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
      className={className}
    >
      {targetY !== null ? (
        <line
          x1={0}
          y1={targetY}
          x2={width}
          y2={targetY}
          stroke="var(--color-border-strong)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      ) : null}
      <path
        d={path}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPoint ? (
        <circle
          cx={(points.length - 1) * stepX}
          cy={toY(lastPoint.value)}
          r={2.5}
          fill="var(--color-primary)"
        />
      ) : null}
    </svg>
  );
}
