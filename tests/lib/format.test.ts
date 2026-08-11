import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  timeAgo,
  formatCategory,
  formatUrgency,
  formatReportType,
  reportTypeBadgeVariant,
  urgencyBadgeVariant,
} from '@/lib/format';

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-11T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "hace un momento" for less than 60 seconds', () => {
    const date = new Date('2026-08-11T11:59:30Z').toISOString();
    expect(timeAgo(date)).toBe('hace un momento');
  });

  it('returns minutes for less than 60 minutes', () => {
    const date = new Date('2026-08-11T11:45:00Z').toISOString();
    expect(timeAgo(date)).toBe('hace 15 min');
  });

  it('returns hours for less than 24 hours', () => {
    const date = new Date('2026-08-11T06:00:00Z').toISOString();
    expect(timeAgo(date)).toBe('hace 6h');
  });

  it('returns "hace 1 día" for 1 day', () => {
    const date = new Date('2026-08-10T12:00:00Z').toISOString();
    expect(timeAgo(date)).toBe('hace 1 día');
  });

  it('returns days for less than 7 days', () => {
    const date = new Date('2026-08-07T12:00:00Z').toISOString();
    expect(timeAgo(date)).toBe('hace 4 días');
  });

  it('returns weeks for less than 30 days', () => {
    const date = new Date('2026-07-28T12:00:00Z').toISOString();
    expect(timeAgo(date)).toBe('hace 2 sem');
  });

  it('returns formatted date for older than 30 days', () => {
    const date = new Date('2026-06-01T12:00:00Z').toISOString();
    const result = timeAgo(date);
    // Should contain a day number and month abbreviation
    expect(result).toMatch(/\d+/);
  });
});

describe('formatCategory', () => {
  it('formats known categories', () => {
    expect(formatCategory('agua')).toBe('Agua');
    expect(formatCategory('alimentos')).toBe('Alimentos');
    expect(formatCategory('asistencia_medica')).toBe('Asistencia médica');
    expect(formatCategory('rescate')).toBe('Rescate');
  });

  it('returns the key for unknown categories', () => {
    expect(formatCategory('unknown_category')).toBe('unknown_category');
  });
});

describe('formatUrgency', () => {
  it('formats all urgency levels', () => {
    expect(formatUrgency('critical')).toEqual({
      label: 'Crítica',
      emoji: '🔴',
    });
    expect(formatUrgency('high')).toEqual({ label: 'Alta', emoji: '🟠' });
    expect(formatUrgency('medium')).toEqual({ label: 'Media', emoji: '🟡' });
    expect(formatUrgency('low')).toEqual({ label: 'Baja', emoji: '🟢' });
  });
});

describe('formatReportType', () => {
  it('formats all report types', () => {
    expect(formatReportType('need')).toEqual({
      label: 'Necesidad',
      emoji: '🆘',
    });
    expect(formatReportType('offer')).toEqual({
      label: 'Oferta',
      emoji: '🤝',
    });
    expect(formatReportType('service_point')).toEqual({
      label: 'Punto de ayuda',
      emoji: '📍',
    });
  });
});

describe('reportTypeBadgeVariant', () => {
  it('maps report types to badge variants', () => {
    expect(reportTypeBadgeVariant('need')).toBe('need');
    expect(reportTypeBadgeVariant('offer')).toBe('offer');
    expect(reportTypeBadgeVariant('service_point')).toBe('service-point');
  });
});

describe('urgencyBadgeVariant', () => {
  it('maps urgency levels to badge variants', () => {
    expect(urgencyBadgeVariant('critical')).toBe('critical');
    expect(urgencyBadgeVariant('high')).toBe('warning');
    expect(urgencyBadgeVariant('medium')).toBe('secondary');
    expect(urgencyBadgeVariant('low')).toBe('success');
  });
});
