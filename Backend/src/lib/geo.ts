/**
 * Geo helpers for presence.
 *
 * Coordinates returned to clients are snapped to a coarse grid so "nearby"
 * means "in the area", not "at this bench". The grid is ~150m by default.
 */

const EARTH_RADIUS_M = 6_371_000;
const LAT_M = 111_320;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function snapToGrid(lat: number, lng: number, meters = 150): { lat: number; lng: number } {
  const latStep = meters / LAT_M;
  const cosLat = Math.max(0.2, Math.cos(toRad(lat)));
  const lngStep = meters / (LAT_M * cosLat);

  const snappedLat = clamp(Math.round(lat / latStep) * latStep, -90, 90);
  // Normalize lng to [-180, 180] after snapping.
  let snappedLng = Math.round(lng / lngStep) * lngStep;
  snappedLng = ((((snappedLng + 180) % 360) + 360) % 360) - 180;

  return {
    lat: round6(snappedLat),
    lng: round6(snappedLng),
  };
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Cheap bbox prefilter before haversine sort. */
export function boundingBox(lat: number, lng: number, radiusM: number) {
  const latDelta = radiusM / LAT_M;
  const lngDelta = radiusM / (LAT_M * Math.max(0.2, Math.cos(toRad(lat))));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
