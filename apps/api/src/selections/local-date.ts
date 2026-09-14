import type { LocalDate } from '@choose-dish/contract';

/**
 * Selections, the no-repeat window and history retention are all defined in the
 * user's local calendar, never in instants — at UTC+7 an instant-based cutoff
 * lands on the wrong day for up to seven hours of every day.
 */
export type { LocalDate } from '@choose-dish/contract';

export function toLocalDate(instant: Date, timezone: string): LocalDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** Civil-date arithmetic: no timezone is involved once we already hold a LocalDate. */
export function shiftLocalDate(localDate: LocalDate, days: number): LocalDate {
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** `count` consecutive local dates ending at `localDate`, newest first. */
export function recentLocalDates(localDate: LocalDate, count: number): LocalDate[] {
  return Array.from({ length: count }, (_, offset) => shiftLocalDate(localDate, -offset));
}

export function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
