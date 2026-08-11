import { describe, it, expect } from 'vitest';
import {
  generatePrivacyCoordinates,
  reduceCoordinatePrecision,
} from '@/lib/privacy/coordinates';

describe('generatePrivacyCoordinates', () => {
  const caliLat = 3.4516;
  const caliLng = -76.532;

  it('returns coordinates different from input', () => {
    const result = generatePrivacyCoordinates(caliLat, caliLng);
    // With randomness, extremely unlikely to be identical
    const isDifferent = result.lat !== caliLat || result.lng !== caliLng;
    expect(isDifferent).toBe(true);
  });

  it('stays within the specified radius', () => {
    // Run multiple times to reduce flakiness
    for (let i = 0; i < 100; i++) {
      const result = generatePrivacyCoordinates(caliLat, caliLng, 150);

      // Calculate approximate distance in meters
      const earthRadius = 6_371_000;
      const dLat = ((result.lat - caliLat) * Math.PI) / 180;
      const dLng = ((result.lng - caliLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((caliLat * Math.PI) / 180) *
          Math.cos((result.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const distance = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      expect(distance).toBeLessThanOrEqual(155); // small tolerance for floating point
    }
  });

  it('uses custom radius when provided', () => {
    const result = generatePrivacyCoordinates(caliLat, caliLng, 500);
    // Just verify it returns valid coordinates
    expect(result.lat).toBeGreaterThan(-90);
    expect(result.lat).toBeLessThan(90);
    expect(result.lng).toBeGreaterThan(-180);
    expect(result.lng).toBeLessThan(180);
  });

  it('returns 6 decimal places of precision', () => {
    const result = generatePrivacyCoordinates(caliLat, caliLng);
    const latDecimals = result.lat.toString().split('.')[1]?.length ?? 0;
    const lngDecimals = result.lng.toString().split('.')[1]?.length ?? 0;
    expect(latDecimals).toBeLessThanOrEqual(6);
    expect(lngDecimals).toBeLessThanOrEqual(6);
  });

  it('handles equator coordinates', () => {
    const result = generatePrivacyCoordinates(0, 0);
    expect(result.lat).toBeDefined();
    expect(result.lng).toBeDefined();
  });

  it('handles polar coordinates', () => {
    const result = generatePrivacyCoordinates(89.9, 0);
    expect(result.lat).toBeDefined();
    expect(result.lng).toBeDefined();
  });
});

describe('reduceCoordinatePrecision', () => {
  it('reduces to 3 decimal places by default', () => {
    const result = reduceCoordinatePrecision(3.451678, -76.532123);
    expect(result.lat).toBe(3.452);
    expect(result.lng).toBe(-76.532);
  });

  it('respects custom decimal places', () => {
    const result = reduceCoordinatePrecision(3.451678, -76.532123, 2);
    expect(result.lat).toBe(3.45);
    expect(result.lng).toBe(-76.53);
  });

  it('handles zero decimals', () => {
    const result = reduceCoordinatePrecision(3.451678, -76.532123, 0);
    expect(result.lat).toBe(3);
    expect(result.lng).toBe(-77);
  });
});
