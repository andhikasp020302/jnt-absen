import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireAdmin } from '$lib/server/guard';
import { hashPassword } from '$lib/server/auth';

const STATUS: Record<string, 'approved' | 'rejected'> = {
  approve: 'approved',
  activate: 'approved',
  reject: 'rejected',
  deactivate: 'rejected'
};

export const PATCH: RequestHandler = async (event) => {
  requireAdmin(event);
  const id = Number(event.params.id);
  if (!Number.isFinite(id)) throw error(400, 'ID tidak valid');
  const body = await event.request.json().catch(() => ({}));

  // Ganti password oleh admin.
  if (typeof body.password === 'string') {
    if (body.password.length < 6) throw error(400, 'Password minimal 6 karakter');
    await db((sql) => sql`
      update users set password_hash = ${hashPassword(body.password)}
      where id = ${id} and role = 'employee'
    `);
    return json({ ok: true, changed: 'password' });
  }

  // Aktifkan / nonaktifkan / setujui / tolak.
  const status = STATUS[body.action];
  if (!status) throw error(400, 'Aksi tidak valid');
  await db((sql) => sql`update users set status = ${status} where id = ${id} and role = 'employee'`);
  return json({ ok: true, status });
};

export const DELETE: RequestHandler = async (event) => {
  requireAdmin(event);
  const id = Number(event.params.id);
  if (!Number.isFinite(id)) throw error(400, 'ID tidak valid');
  // Attendance rows cascade-delete via FK. Storage objects are cleaned by cron.
  await db((sql) => sql`delete from users where id = ${id} and role = 'employee'`);
  return json({ ok: true });
};
