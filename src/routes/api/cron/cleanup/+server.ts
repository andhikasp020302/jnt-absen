import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { deleteObjects } from '$lib/server/storage';
import { jakartaDate, addDays } from '$lib/server/date';
import { CRON_SECRET, RETENTION_DAYS } from '$lib/server/env';

// Deletes attendance (rows + stored photos) older than the retention window.
// Triggered daily by Vercel Cron. Protected by CRON_SECRET.
export const GET: RequestHandler = async ({ request }) => {
  const secret = CRON_SECRET();
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) throw error(401, 'Unauthorized');
  }

  const cutoff = addDays(jakartaDate().iso, -RETENTION_DAYS());
  let removed = 0;

  // Process in batches to stay within serverless limits.
  for (let i = 0; i < 20; i++) {
    const rows = await db((sql) => sql`
      select id, photo_path, thumb_path
      from attendance
      where attendance_date < ${cutoff}
      limit 200
    `);
    if (rows.length === 0) break;

    const paths = rows.flatMap((r) => [r.photo_path, r.thumb_path].filter(Boolean) as string[]);
    try {
      await deleteObjects(paths);
    } catch {
      // Continue even if some objects are already gone.
    }
    const ids = rows.map((r) => Number(r.id));
    await db((sql) => sql`delete from attendance where id = any(${ids})`);
    removed += rows.length;
    if (rows.length < 200) break;
  }

  return json({ ok: true, cutoff, removed });
};
