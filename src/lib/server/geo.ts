export interface GeoPoint {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
}

// Haversine distance in meters between two lat/lng points.
export function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Returns the matched geofence point if (lat,lng) is inside any point's radius.
export function matchGeofence(
  lat: number,
  lng: number,
  points: GeoPoint[]
): { point: GeoPoint; distance: number } | null {
  let best: { point: GeoPoint; distance: number } | null = null;
  for (const p of points) {
    const d = distanceMeters(lat, lng, p.lat, p.lng);
    if (d <= p.radius_m && (!best || d < best.distance)) {
      best = { point: p, distance: d };
    }
  }
  return best;
}
