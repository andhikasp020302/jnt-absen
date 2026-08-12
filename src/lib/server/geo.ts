export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoArea {
  id: number;
  name: string;
  polygon: LatLng[]; // sudut area (4 titik)
}

// Haversine distance in meters (dipakai untuk info jarak ke pusat area).
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Titik pusat (centroid) dari poligon.
export function centroid(poly: LatLng[]): LatLng {
  const n = poly.length || 1;
  const s = poly.reduce((a, p) => ({ lat: a.lat + p.lat, lng: a.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: s.lat / n, lng: s.lng / n };
}

// Ray casting: apakah (lat,lng) di dalam poligon. lng = x, lat = y.
export function pointInPolygon(lat: number, lng: number, poly: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng;
    const yi = poly[i].lat;
    const xj = poly[j].lng;
    const yj = poly[j].lat;
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Cari area (poligon) aktif yang memuat titik (lat,lng).
export function matchArea(
  lat: number,
  lng: number,
  areas: GeoArea[]
): { area: GeoArea; distance: number } | null {
  for (const a of areas) {
    if (Array.isArray(a.polygon) && a.polygon.length >= 3 && pointInPolygon(lat, lng, a.polygon)) {
      const c = centroid(a.polygon);
      return { area: a, distance: distanceMeters(lat, lng, c.lat, c.lng) };
    }
  }
  return null;
}

// Validasi array titik poligon (dipakai saat admin menyimpan area).
export function validPolygon(poly: unknown): poly is LatLng[] {
  return (
    Array.isArray(poly) &&
    poly.length >= 3 &&
    poly.length <= 8 &&
    poly.every(
      (p) =>
        p &&
        typeof p.lat === 'number' &&
        typeof p.lng === 'number' &&
        p.lat >= -90 &&
        p.lat <= 90 &&
        p.lng >= -180 &&
        p.lng <= 180
    )
  );
}
