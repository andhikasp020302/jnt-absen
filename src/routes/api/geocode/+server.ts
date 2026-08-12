import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/guard';

// Proxy pencarian tempat via Nominatim (OpenStreetMap) — gratis, tanpa API key.
// Dilakukan di server agar bisa set User-Agent (sesuai kebijakan Nominatim)
// dan menghindari CORS. Dibatasi wilayah Indonesia.
export const GET: RequestHandler = async (event) => {
  requireAdmin(event);
  const q = (event.url.searchParams.get('q') || '').trim();
  if (q.length < 3) return json({ results: [] });

  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=id&addressdetails=0&q=' +
    encodeURIComponent(q);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'jnt-absensi/1.0 (attendance app)',
      'Accept-Language': 'id'
    }
  });
  if (!res.ok) throw error(502, 'Pencarian lokasi gagal');

  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  const results = data.map((d) => ({
    name: d.display_name,
    lat: Number(d.lat),
    lng: Number(d.lon)
  }));
  return json({ results });
};
