import { useId } from "react";
import type { DatedValue } from "../analytics-insights";

interface TrendChartProps {
  points: DatedValue[];
  /** Series name, e.g. "Life Score". */
  label: string;
  unit?: string;
  height?: number;
}

const PAD = { top: 12, right: 12, bottom: 22, left: 34 };
const VIEW_W = 640;

function fmtDate(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return iso;
  return new Date(time).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Dependency-free SVG line chart for one time series (Layer 8). Readable axes,
 * a subtle grid, one gold series line, hover dots with a native `<title>`, and a
 * screen-reader summary that carries the same facts as the visual — nothing
 * essential lives only in a tooltip.
 */
export function TrendChart({ points, label, unit = "", height = 220 }: TrendChartProps) {
  const gradientId = useId();
  const sorted = [...points]
    .filter((p) => !Number.isNaN(Date.parse(p.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  if (sorted.length < 2) {
    return (
      <p className="text-muted border-border rounded-lg border border-dashed p-6 text-center text-sm">
        Not enough entries to plot a trend yet — at least two are needed.
      </p>
    );
  }

  const values = sorted.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotW = VIEW_W - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (i / (sorted.length - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - min) / range) * plotH;

  const line = sorted.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const area = `${line} L ${x(sorted.length - 1)} ${PAD.top + plotH} L ${x(0)} ${PAD.top + plotH} Z`;

  const first = sorted[0]!;
  const last = sorted.at(-1)!;
  const mid = sorted[Math.floor((sorted.length - 1) / 2)]!;
  const summary = `${label} over ${sorted.length} entries from ${fmtDate(first.date)} to ${fmtDate(
    last.date,
  )}: ranged ${min} to ${max}${unit ? ` ${unit}` : ""}, latest ${last.value}${
    unit ? ` ${unit}` : ""
  }.`;

  const gridValues = [max, (max + min) / 2, min];

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={summary}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridValues.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={y(v)}
              x2={VIEW_W - PAD.right}
              y2={y(v)}
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray={i === 2 ? undefined : "3 4"}
            />
            <text
              x={PAD.left - 6}
              y={y(v)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-[var(--color-subtle)] text-[10px] tabular-nums"
            >
              {Math.round(v * 10) / 10}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {sorted.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={i === sorted.length - 1 ? 3.5 : 2.5} fill="var(--color-primary)">
            <title>{`${fmtDate(p.date)}: ${p.value}${unit ? ` ${unit}` : ""}`}</title>
          </circle>
        ))}

        {[first, mid, last].map((p, i) => (
          <text
            key={i}
            x={i === 0 ? PAD.left : i === 1 ? VIEW_W / 2 : VIEW_W - PAD.right}
            y={height - 6}
            textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"}
            className="fill-[var(--color-subtle)] text-[10px]"
          >
            {fmtDate(p.date)}
          </text>
        ))}
      </svg>
      <figcaption className="text-subtle mt-2 text-xs">{summary}</figcaption>
    </figure>
  );
}
