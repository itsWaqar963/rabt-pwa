/**
 * Meetup schedule parsing for feed expiry.
 * Date-only rows expire at end of local calendar day (23:59:59.999).
 * Date+time rows expire at the parsed local start instant.
 */
export function parseMeetupDateTime(
  date: string | null | undefined,
  time: string | null | undefined,
): Date | null {
  if (!date?.trim()) return null;
  const d = date.trim();
  const t = time?.trim();
  if (t) {
    const parsed = new Date(`${d}T${t}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parts = d.split("-").map(Number);
  const [y, m, day] = parts;
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day, 23, 59, 59, 999);
}

export function isMeetupExpired(
  date: string | null | undefined,
  time: string | null | undefined,
  now: Date = new Date(),
): boolean {
  const expiry = parseMeetupDateTime(date, time);
  if (!expiry) return false;
  return expiry.getTime() < now.getTime();
}

export function isMeetupLive(
  date: string | null | undefined,
  time: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return !isMeetupExpired(date, time, now);
}
