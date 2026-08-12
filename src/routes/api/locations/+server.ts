import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireAdmin } from '$lib/server/guard';

export const POST: RequestHandler = async (event) => {
  requireAdmin(event);
  const { name, lat, lng, radius_m } = await event.request.json().catch(() => ({}));
  const cleanName = String(name ?? '').trim();
  const la = Number(lat);
  const ln = Number(lng);
  const r = Math.round(Number(radius_m));

  if (!cleanName) throw error(400, 'Nama lokasi wajib');
  if (!Number.isFinite(la) || la < -90 || la > 90) throw error(400, 'Latitude tidak valid');
  if (!Number.isFinite(ln) || ln < -180 || ln > 180) throw error(400, 'Longitude tidak valid');
  if (!Number.isFinite(r) || r < 20 || r > 5000) throw error(400, 'Radius 20–5000 meter');

  const sql = db();
  const rows = await sql`
    insert into locations (name, lat, lng, radius_m)
    values (${cleanName}, ${la}, ${ln}, ${r})
    returning id
  `;
  return json({ ok: true, id: Number(rows[0].id) });
};
