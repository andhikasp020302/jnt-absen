import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { jakartaDate, jakartaDow, addDays, monthStart } from '$lib/server/date';

const PER_PAGE = 20;

// Resolve the selected filter into an inclusive [from, to] date range (Jakarta).
function resolveRange(scope: string, month: string | null) {
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

function nextMonthStart(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
}

export const load: PageServerLoad = async ({ url }) => {
  const scope = url.searchParams.get('scope') || 'today';
  const month = url.searchParams.get('month');
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const { from, to, label } = resolveRange(scope, month);

  const sql = db();
  const rows = await sql`
    select a.id, a.type, a.distance_m,
           u.name as karyawan,
           to_char(a.created_at at time zone 'Asia/Jakarta', 'DD Mon') as tanggal,
           to_char(a.created_at at time zone 'Asia/Jakarta', 'HH24:MI') as jam,
           l.name as lokasi
    from attendance a
    join users u on u.id = a.user_id
    left join locations l on l.id = a.location_id
    where a.attendance_date between ${from} and ${to}
    order by a.created_at desc
    limit ${PER_PAGE + 1} offset ${(page - 1) * PER_PAGE}
  `;
  const hasNext = rows.length > PER_PAGE;

  // Month options for the picker (last 3 months).
  const months = [monthStart(0), monthStart(1), monthStart(2)].map((m) => m.slice(0, 7));

  return { rows: rows.slice(0, PER_PAGE), page, hasNext, scope, month, label, months };
};
