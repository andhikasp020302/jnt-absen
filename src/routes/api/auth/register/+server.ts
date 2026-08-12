import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { hashPassword } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
  const { name, password } = await request.json().catch(() => ({}));
  const cleanName = String(name ?? '').trim();

  if (cleanName.length < 2) throw error(400, 'Nama minimal 2 karakter');
  if (String(password ?? '').length < 6) throw error(400, 'Password minimal 6 karakter');

  const sql = db();
  const exists = await sql`select 1 from users where lower(username) = lower(${cleanName}) limit 1`;
  if (exists.length > 0) throw error(409, 'Nama sudah terdaftar, gunakan nama lain');

  await sql`
    insert into users (name, username, password_hash, role, status)
    values (${cleanName}, ${cleanName}, ${hashPassword(String(password))}, 'employee', 'pending')
  `;

  return json({ ok: true, message: 'Pendaftaran terkirim. Menunggu persetujuan admin.' });
};
