import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireAdmin } from '$lib/server/guard';

export const PATCH: RequestHandler = async (event) => {
  requireAdmin(event);
  const id = Number(event.params.id);
  const { action } = await event.request.json().catch(() => ({}));
  if (!Number.isFinite(id)) throw error(400, 'ID tidak valid');

  const status =
    action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null;
  if (!status) throw error(400, 'Aksi tidak valid');

  const sql = db();
  await sql`update users set status = ${status} where id = ${id} and role = 'employee'`;
  return json({ ok: true, status });
};

export const DELETE: RequestHandler = async (event) => {
  requireAdmin(event);
  const id = Number(event.params.id);
  if (!Number.isFinite(id)) throw error(400, 'ID tidak valid');
  const sql = db();
  // Attendance rows cascade-delete via FK. Storage objects are cleaned by cron.
  await sql`delete from users where id = ${id} and role = 'employee'`;
  return json({ ok: true });
};
