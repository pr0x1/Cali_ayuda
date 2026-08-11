import { describe, it, expect } from 'vitest';
import {
  REPORT_CATEGORIES,
  CATEGORY_LABELS,
  EXPIRATION_HOURS,
  PRIVACY_RADIUS_METERS,
  DEFAULT_CITY,
  CALI_CENTER,
  DEFAULT_MAP_ZOOM,
} from '@/lib/constants';

describe('REPORT_CATEGORIES', () => {
  it('has at least 10 categories', () => {
    expect(REPORT_CATEGORIES.length).toBeGreaterThanOrEqual(10);
  });

  it('includes essential emergency categories', () => {
    expect(REPORT_CATEGORIES).toContain('agua');
    expect(REPORT_CATEGORIES).toContain('alimentos');
    expect(REPORT_CATEGORIES).toContain('medicamentos');
    expect(REPORT_CATEGORIES).toContain('albergue');
    expect(REPORT_CATEGORIES).toContain('rescate');
  });

  it('includes "otro" as catch-all', () => {
    expect(REPORT_CATEGORIES).toContain('otro');
  });
});

describe('CATEGORY_LABELS', () => {
  it('has a label for every category', () => {
    for (const category of REPORT_CATEGORIES) {
      expect(CATEGORY_LABELS[category]).toBeDefined();
      expect(typeof CATEGORY_LABELS[category]).toBe('string');
      expect(CATEGORY_LABELS[category].length).toBeGreaterThan(0);
    }
  });
});

describe('EXPIRATION_HOURS', () => {
  it('critical expires fastest', () => {
    expect(EXPIRATION_HOURS.critical).toBeLessThan(EXPIRATION_HOURS.high);
  });

  it('high expires faster than medium', () => {
    expect(EXPIRATION_HOURS.high).toBeLessThan(EXPIRATION_HOURS.medium);
  });

  it('medium expires faster than low', () => {
    expect(EXPIRATION_HOURS.medium).toBeLessThan(EXPIRATION_HOURS.low);
  });

  it('all values are positive numbers', () => {
    for (const [, hours] of Object.entries(EXPIRATION_HOURS)) {
      expect(hours).toBeGreaterThan(0);
    }
  });
});

describe('PRIVACY_RADIUS_METERS', () => {
  it('is at least 100 meters for residential privacy', () => {
    expect(PRIVACY_RADIUS_METERS).toBeGreaterThanOrEqual(100);
  });

  it('is at most 500 meters for utility', () => {
    expect(PRIVACY_RADIUS_METERS).toBeLessThanOrEqual(500);
  });
});

describe('CALI_CENTER', () => {
  it('has valid Cali coordinates', () => {
    // Cali, Colombia is roughly at 3.45° N, 76.53° W
    expect(CALI_CENTER.lat).toBeGreaterThan(3);
    expect(CALI_CENTER.lat).toBeLessThan(4);
    expect(CALI_CENTER.lng).toBeGreaterThan(-77);
    expect(CALI_CENTER.lng).toBeLessThan(-76);
  });
});

describe('DEFAULT_CITY', () => {
  it('is Cali', () => {
    expect(DEFAULT_CITY).toBe('Cali');
  });
});

describe('DEFAULT_MAP_ZOOM', () => {
  it('is a reasonable city-level zoom', () => {
    expect(DEFAULT_MAP_ZOOM).toBeGreaterThanOrEqual(10);
    expect(DEFAULT_MAP_ZOOM).toBeLessThanOrEqual(15);
  });
});
