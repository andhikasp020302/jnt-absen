import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const users = await db((sql) => sql`
    select id, name, status,
           to_char(created_at at time zone 'Asia/Jakarta', 'DD Mon YYYY') as tanggal
    from users
    where role = 'employee'
    order by
      case status when 'pending' then 0 when 'approved' then 1 else 2 end,
      name
  `);
  return { users };
};
