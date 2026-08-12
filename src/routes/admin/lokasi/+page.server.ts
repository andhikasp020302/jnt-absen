import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const locations = await db((sql) => sql`
    select id, name, lat, lng, radius_m, active
    from locations order by created_at desc
  `);
  return { locations };
};
