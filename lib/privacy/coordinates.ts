import { PRIVACY_RADIUS_METERS } from '@/lib/constants';

/**
 * Generate privacy-safe coordinates by displacing the exact location
 * within a random radius. This prevents exposing exact residential
 * locations while keeping the general area accurate.
 *
 * The displacement uses a random angle and random distance up to
 * PRIVACY_RADIUS_METERS (default 150m).
 */
export function generatePrivacyCoordinates(
  lat: number,
  lng: number,
  radiusMeters: number = PRIVACY_RADIUS_METERS
): { lat: number; lng: number } {
  // Random angle in radians
  const angle = Math.random() * 2 * Math.PI;

  // Random distance (uniform distribution within radius)
  const distance = Math.random() * radiusMeters;

  // Earth's radius in meters
  const earthRadius = 6_371_000;

  // Offset in degrees
  const latOffset =
    ((distance * Math.cos(angle)) / earthRadius) * (180 / Math.PI);
  const lngOffset =
    ((distance * Math.sin(angle)) /
      (earthRadius * Math.cos((lat * Math.PI) / 180))) *
    (180 / Math.PI);

  return {
    lat: Number((lat + latOffset).toFixed(6)),
    lng: Number((lng + lngOffset).toFixed(6)),
  };
}

/**
 * Reduce coordinate precision to ~111m (3 decimal places).
 * Alternative approach for privacy when randomization is not desired.
 */
export function reduceCoordinatePrecision(
  lat: number,
  lng: number,
  decimals: number = 3
): { lat: number; lng: number } {
  return {
    lat: Number(lat.toFixed(decimals)),
    lng: Number(lng.toFixed(decimals)),
  };
}
