import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireAdmin } from '$lib/server/guard';

export const PATCH: RequestHandler = async (event) => {
  requireAdmin(event);
  const id = Number(event.params.id);
  if (!Number.isFinite(id)) throw error(400, 'ID tidak valid');
  const { active } = await event.request.json().catch(() => ({}));
  await db((sql) => sql`update locations set active = ${!!active} where id = ${id}`);
  return json({ ok: true });
};

export const DELETE: RequestHandler = async (event) => {
  requireAdmin(event);
  const id = Number(event.params.id);
  if (!Number.isFinite(id)) throw error(400, 'ID tidak valid');
  await db((sql) => sql`delete from locations where id = ${id}`);
  return json({ ok: true });
};
