/**
 * Minimal IANA-timezone helpers built on `Intl` — no dependency. Timed calendar events
 * are stored as ISO strings with an explicit offset (e.g. `2026-09-01T14:00:00+02:00`)
 * plus the IANA `timeZone` they were entered in, so the wall-clock time is stable across
 * DST and the instant is unambiguous.
 */

const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function resolveBrowserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Offset of `zone` from UTC, in minutes, at the given instant (positive = ahead of UTC). */
export function zoneOffsetMinutes(instant: Date, zone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** Interpret a `YYYY-MM-DDTHH:mm` wall-clock string as a time in `zone` → a UTC instant. */
export function wallTimeToInstant(wall: string, zone: string): Date {
  const match = WALL_RE.exec(wall);
  if (!match) return new Date(NaN);
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const guessUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offset1 = zoneOffsetMinutes(new Date(guessUtc), zone);
  let ms = guessUtc - offset1 * 60_000;
  const offset2 = zoneOffsetMinutes(new Date(ms), zone);
  if (offset2 !== offset1) ms = guessUtc - offset2 * 60_000;
  return new Date(ms);
}

/** Render an instant as the wall clock in `zone`. */
export function instantToWall(instant: Date, zone: string): { date: string; time: string } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/** `YYYY-MM-DDTHH:mm` wall time in `zone` → an ISO 8601 string with the correct offset. */
export function wallTimeToIso(wall: string, zone: string): string {
  const instant = wallTimeToInstant(wall, zone);
  if (Number.isNaN(instant.getTime())) return "";
  return `${wall}:00${formatOffset(zoneOffsetMinutes(instant, zone))}`;
}

/** An ISO instant string → `{ date, time }` wall clock in `zone` (for editing). */
export function isoToWall(iso: string, zone: string): { date: string; time: string } {
  return instantToWall(new Date(iso), zone);
}
