import { jakartaDate, jakartaDow, addDays, monthStart } from './date';

function nextMonthStart(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
}

// Resolve the selected filter into an inclusive [from, to] date range (Jakarta).
export function resolveRange(scope: string, month: string | null) {
  const { iso: today } = jakartaDate();
  if (scope === 'week') {
    const dow = jakartaDow();
    const back = (dow + 6) % 7; // days since Monday
    return { from: addDays(today, -back), to: today, label: 'Minggu ini' };
  }
  if (scope === 'month') {
    return { from: monthStart(0), to: today, label: 'Bulan ini' };
  }
  if (scope === 'pick' && month) {
    // Only allow the last 3 months (current + 2 previous).
    const allowed = [monthStart(0), monthStart(1), monthStart(2)].map((m) => m.slice(0, 7));
    if (allowed.includes(month)) {
      const from = month + '-01';
      const curMonth = monthStart(0).slice(0, 7);
      const to = month === curMonth ? today : addDays(nextMonthStart(from), -1);
      return { from, to, label: month };
    }
  }
  return { from: today, to: today, label: 'Hari ini' };
}
