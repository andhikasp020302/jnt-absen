import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireUser } from '$lib/server/guard';
import { signUrl } from '$lib/server/storage';

// Auth-guarded photo proxy. Redirects to a short-lived signed URL so the
// storage bucket stays private and browsers only fetch visible (lazy) images.
export const GET: RequestHandler = async (event) => {
  const user = requireUser(event);
  const id = Number(event.params.id);
  if (!Number.isFinite(id)) throw error(400, 'ID tidak valid');
  const size = event.url.searchParams.get('size') === 'full' ? 'full' : 'thumb';

  const rows = await db((sql) => sql`
    select user_id, photo_path, thumb_path from attendance where id = ${id} limit 1
  `);
  const row = rows[0];
  if (!row) throw error(404, 'Tidak ditemukan');
  // Employees may only view their own photos; admins may view all.
  if (user.role !== 'admin' && Number(row.user_id) !== user.id) throw error(403, 'Ditolak');

  const path = size === 'full' ? row.photo_path : row.thumb_path || row.photo_path;
  const url = await signUrl(path, 600);
  if (!url) throw error(404, 'Foto tidak tersedia');
  throw redirect(302, url);
};
