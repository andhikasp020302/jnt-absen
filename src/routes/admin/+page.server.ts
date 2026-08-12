import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { monthStart } from '$lib/server/date';
import { resolveRange } from '$lib/server/range';

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ url }) => {
  const scope = url.searchParams.get('scope') || 'today';
  const month = url.searchParams.get('month');
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const { from, to, label } = resolveRange(scope, month);

  const rows = await db((sql) => sql`
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
  `);
  const hasNext = rows.length > PER_PAGE;

  // Ringkasan periode (untuk kartu statistik di tampilan desktop).
  const sum = await db((sql) => sql`
    select
      count(*)::int as total,
      count(*) filter (where type = 'in')::int as masuk,
      count(*) filter (where type = 'out')::int as pulang,
      count(distinct user_id)::int as karyawan
    from attendance
    where attendance_date between ${from} and ${to}
  `);
  const summary = sum[0] as { total: number; masuk: number; pulang: number; karyawan: number };

  // Month options for the picker (last 3 months).
  const months = [monthStart(0), monthStart(1), monthStart(2)].map((m) => m.slice(0, 7));

  return { rows: rows.slice(0, PER_PAGE), page, hasNext, scope, month, label, months, summary };
};
