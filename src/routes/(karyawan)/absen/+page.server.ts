import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { jakartaDate } from '$lib/server/date';

export const load: PageServerLoad = async ({ locals }) => {
  const { iso } = jakartaDate();
  const rows = await db((sql) => sql`
    select type, to_char(created_at at time zone 'Asia/Jakarta', 'HH24:MI') as jam
    from attendance
    where user_id = ${locals.user!.id} and attendance_date = ${iso}
    order by created_at
  `);
  const masuk = rows.find((r) => r.type === 'in')?.jam ?? null;
  const pulang = rows.filter((r) => r.type === 'out').pop()?.jam ?? null;
  return { masuk, pulang };
};
