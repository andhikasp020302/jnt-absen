import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireUser } from '$lib/server/guard';
import { uploadObject } from '$lib/server/storage';
import { matchArea, type GeoArea } from '$lib/server/geo';
import { jakartaDate } from '$lib/server/date';

const MAX_UPLOAD = 1.5 * 1024 * 1024; // hard cap; client already compresses

export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const form = await event.request.formData();

  const type = String(form.get('type') ?? '');
  const lat = Number(form.get('lat'));
  const lng = Number(form.get('lng'));
  const photo = form.get('photo');
  const thumb = form.get('thumb');
  const ext = String(form.get('ext') ?? 'webp').replace(/[^a-z]/g, '') || 'webp';

  if (type !== 'in' && type !== 'out') throw error(400, 'Tipe absen tidak valid');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw error(400, 'Lokasi GPS tidak terbaca');
  if (!(photo instanceof File) || !(thumb instanceof File)) throw error(400, 'Foto wajib');
  if (photo.size > MAX_UPLOAD) throw error(413, 'Ukuran foto terlalu besar');

  // Server-side geofence check (poligon) — never trust the client.
  const locs = (await db(
    (sql) =>
      sql`select id, name, polygon from locations where active = true and polygon is not null`
  )) as unknown as { id: number; name: string; polygon: unknown }[];

  if (locs.length === 0) {
    throw error(409, 'Belum ada area absensi yang di-set admin. Hubungi admin.');
  }
  const areas: GeoArea[] = locs.map((l) => ({
    id: Number(l.id),
    name: l.name,
    polygon: l.polygon as GeoArea['polygon']
  }));
  const match = matchArea(lat, lng, areas);
  if (!match) {
    throw error(403, 'Anda berada di luar area absensi yang diizinkan.');
  }

  // Upload compressed photo + thumbnail (no DB connection held during upload).
  const { compact } = jakartaDate();
  const base = `${user.id}/${compact}/${Date.now()}_${type}`;
  const ct = ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const photoPath = `${base}.${ext}`;
  const thumbPath = `${base}_t.${ext}`;

  await uploadObject(photoPath, await photo.arrayBuffer(), ct);
  await uploadObject(thumbPath, await thumb.arrayBuffer(), ct);

  await db((sql) => sql`
    insert into attendance (user_id, type, photo_path, thumb_path, lat, lng, location_id, distance_m)
    values (${user.id}, ${type}, ${photoPath}, ${thumbPath}, ${lat}, ${lng},
            ${match.area.id}, ${Math.round(match.distance)})
  `);

  return json({
    ok: true,
    type,
    location: match.area.name,
    distance: Math.round(match.distance)
  });
};
