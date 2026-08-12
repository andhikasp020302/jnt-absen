import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { verifyPassword, signSession, SESSION_COOKIE, cookieOptions } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { name, password } = await request.json().catch(() => ({}));
  const cleanName = String(name ?? '').trim();
  if (!cleanName || !password) throw error(400, 'Nama dan password wajib diisi');

  const rows = await db((sql) => sql`
    select id, name, role, status, password_hash
    from users where lower(username) = lower(${cleanName}) limit 1
  `);
  const user = rows[0];

  // Uniform message to avoid leaking which names exist.
  if (!user || !verifyPassword(String(password), user.password_hash)) {
    throw error(401, 'Nama atau password salah');
  }
  if (user.status === 'pending') throw error(403, 'Akun belum disetujui admin');
  if (user.status === 'rejected') throw error(403, 'Akun tidak aktif. Hubungi admin.');

  const session = { id: Number(user.id), name: user.name, role: user.role };
  cookies.set(SESSION_COOKIE, signSession(session), cookieOptions);
  return json({ ok: true, role: user.role });
};
