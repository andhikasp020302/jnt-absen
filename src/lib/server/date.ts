const TZ = 'Asia/Jakarta';

// Current date in Asia/Jakarta as YYYY-MM-DD and compact YYYYMMDD.
export function jakartaDate(d = new Date()): { iso: string; compact: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d); // en-CA -> YYYY-MM-DD
  return { iso: parts, compact: parts.replace(/-/g, '') };
}

// Add/subtract days from a YYYY-MM-DD string (UTC-safe arithmetic).
export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Day of week in Jakarta for today: 0=Sun .. 6=Sat.
export function jakartaDow(d = new Date()): number {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(d);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
}

// First day (YYYY-MM-01) of the month N months before the current Jakarta month.
export function monthStart(offset = 0, d = new Date()): string {
  const { iso } = jakartaDate(d);
  const [y, m] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 - offset, 1));
  return dt.toISOString().slice(0, 10);
}
