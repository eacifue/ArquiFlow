// ScheduleTask dates are date-only ("YYYY-MM-DD"). Parsing/formatting must stay
// in local time — using `new Date(isoString)` or `.toISOString()` interprets/
// emits UTC, which shifts the date by a day for any timezone west of UTC.

export function parseLocalDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
