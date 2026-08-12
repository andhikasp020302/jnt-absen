import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

const PER_PAGE = 15;

export const load: PageServerLoad = async ({ locals, url }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const sql = db();
  const rows = await sql`
    select a.id, a.type, a.distance_m,
           to_char(a.created_at at time zone 'Asia/Jakarta', 'DD Mon YYYY') as tanggal,
           to_char(a.created_at at time zone 'Asia/Jakarta', 'HH24:MI') as jam,
           l.name as lokasi
    from attendance a
    left join locations l on l.id = a.location_id
    where a.user_id = ${locals.user!.id}
    order by a.created_at desc
    limit ${PER_PAGE + 1} offset ${(page - 1) * PER_PAGE}
  `;
  const hasNext = rows.length > PER_PAGE;
  return { rows: rows.slice(0, PER_PAGE), page, hasNext };
};
