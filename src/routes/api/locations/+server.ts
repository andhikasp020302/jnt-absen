import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireAdmin } from '$lib/server/guard';
import { centroid, validPolygon } from '$lib/server/geo';

export const POST: RequestHandler = async (event) => {
  requireAdmin(event);
  const { name, polygon } = await event.request.json().catch(() => ({}));
  const cleanName = String(name ?? '').trim();

  if (!cleanName) throw error(400, 'Nama area wajib diisi');
  if (!validPolygon(polygon)) {
    throw error(400, 'Tentukan 4 titik area yang valid di peta');
  }

  const c = centroid(polygon);
  const rows = await db((sql) => sql`
    insert into locations (name, lat, lng, radius_m, polygon)
    values (${cleanName}, ${c.lat}, ${c.lng}, 0, ${sql.json(polygon as unknown as never)})
    returning id
  `);
  return json({ ok: true, id: Number(rows[0].id) });
};
