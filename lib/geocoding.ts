/**
 * Geocoding service using OpenStreetMap Nominatim API.
 * Used to convert manual addresses into coordinates for map display.
 * Free API — requires User-Agent header, max 1 req/sec.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface GeocodingResult {
  lat: number;
  lng: number;
}

/**
 * Geocode an address string to lat/lng coordinates.
 * Appends city and region context for better accuracy in Cali.
 * Returns null if geocoding fails or no results found.
 */
export async function geocodeAddress(
  address: string,
  city: string = 'Cali'
): Promise<GeocodingResult | null> {
  try {
    const query = `${address}, ${city}, Valle del Cauca, Colombia`;
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CaliAyuda/1.0 (emergency-aid-app)',
      },
    });

    if (!res.ok) return null;

    const results = await res.json();
    if (!results.length) return null;

    const lat = parseFloat(results[0].lat);
    const lng = parseFloat(results[0].lon);

    // Validate coordinates are roughly in the Cali/Valle del Cauca area
    // Cali is approximately lat 3.3-3.6, lng -76.3 to -76.7
    if (lat < 2.5 || lat > 4.5 || lng < -77.5 || lng > -75.5) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
}
