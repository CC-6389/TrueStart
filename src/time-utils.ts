/** Parses "1 hr 46 minutes" / "45 minutes" / "2 hrs" into total minutes. Returns null for "TBC" etc. */
export function parseRuntimeToMinutes(text: string): number | null {
  const hourMatch = text.match(/(\d+)\s*hr/i);
  const minuteMatch = text.match(/(\d+)\s*min/i);

  if (!hourMatch && !minuteMatch) {
    return null;
  }

  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;

  return hours * 60 + minutes;
}

/** Parses a "HH:MM" string into minutes since midnight. */
export function parseClockTimeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

/** Formats minutes-since-midnight back into "HH:MM". */
export function formatMinutesToClockTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
