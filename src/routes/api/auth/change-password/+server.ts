import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireUser } from '$lib/server/guard';
import { verifyPassword, hashPassword } from '$lib/server/auth';

// Ganti password milik akun yang sedang login (admin maupun karyawan).
export const POST: RequestHandler = async (event) => {
  const me = requireUser(event);
  const { current, next } = await event.request.json().catch(() => ({}));
  if (String(next ?? '').length < 6) throw error(400, 'Password baru minimal 6 karakter');

  const rows = await db((sql) => sql`select password_hash from users where id = ${me.id} limit 1`);
  const row = rows[0];
  if (!row || !verifyPassword(String(current ?? ''), row.password_hash)) {
    throw error(403, 'Password lama salah');
  }

  await db((sql) => sql`update users set password_hash = ${hashPassword(String(next))} where id = ${me.id}`);
  return json({ ok: true });
};
