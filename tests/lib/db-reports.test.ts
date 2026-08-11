import { describe, it, expect } from 'vitest';
import { toPublicReport } from '@/lib/db/reports';
import type { Report } from '@/types';

describe('toPublicReport', () => {
  const fullReport: Report = {
    id: 'test-uuid-123',
    createdAt: '2026-08-11T10:00:00Z',
    updatedAt: '2026-08-11T10:30:00Z',
    eventId: 'event-uuid',
    reportType: 'need',
    category: 'agua',
    title: 'Necesitamos agua potable',
    description: 'Somos 20 familias sin agua',
    city: 'Cali',
    neighborhood: 'San Fernando',
    addressText: 'Calle 5 # 23-45',
    lat: 3.451234,
    lng: -76.532456,
    publicLat: 3.452,
    publicLng: -76.531,
    contactName: 'Juan Pérez',
    contactPhone: '+57 300 123 4567',
    showContact: true,
    status: 'active',
    verificationStatus: 'unverified',
    urgency: 'high',
    quantity: null,
    quantityUnit: null,
    peopleAffected: 80,
    vulnerablePeople: 15,
    confirmationCount: 3,
    expiresAt: '2026-08-11T14:00:00Z',
    sourceType: 'community',
    sourceUrl: 'https://internal.source/report/123',
  };

  it('excludes exact lat/lng', () => {
    const pub = toPublicReport(fullReport);
    expect(pub).not.toHaveProperty('lat');
    expect(pub).not.toHaveProperty('lng');
  });

  it('includes contact when showContact is true', () => {
    const pub = toPublicReport(fullReport);
    expect(pub.contactName).toBe('Juan Pérez');
    expect(pub.contactPhone).toBe('+57 300 123 4567');
  });

  it('excludes contact when showContact is false', () => {
    const pub = toPublicReport({ ...fullReport, showContact: false });
    expect(pub.contactName).toBeNull();
    expect(pub.contactPhone).toBeNull();
  });

  it('excludes source URL', () => {
    const pub = toPublicReport(fullReport);
    expect(pub).not.toHaveProperty('sourceUrl');
  });

  it('excludes internal fields', () => {
    const pub = toPublicReport(fullReport);
    expect(pub).not.toHaveProperty('updatedAt');
    expect(pub).not.toHaveProperty('eventId');
    expect(pub).not.toHaveProperty('vulnerablePeople');
  });

  it('includes public-safe coordinates', () => {
    const pub = toPublicReport(fullReport);
    expect(pub.publicLat).toBe(3.452);
    expect(pub.publicLng).toBe(-76.531);
  });

  it('includes all public fields', () => {
    const pub = toPublicReport(fullReport);
    expect(pub.id).toBe('test-uuid-123');
    expect(pub.reportType).toBe('need');
    expect(pub.category).toBe('agua');
    expect(pub.title).toBe('Necesitamos agua potable');
    expect(pub.description).toBe('Somos 20 familias sin agua');
    expect(pub.city).toBe('Cali');
    expect(pub.neighborhood).toBe('San Fernando');
    expect(pub.status).toBe('active');
    expect(pub.verificationStatus).toBe('unverified');
    expect(pub.urgency).toBe('high');
    expect(pub.peopleAffected).toBe(80);
    expect(pub.confirmationCount).toBe(3);
    expect(pub.createdAt).toBe('2026-08-11T10:00:00Z');
    expect(pub.expiresAt).toBe('2026-08-11T14:00:00Z');
    expect(pub.sourceType).toBe('community');
  });

  it('has exactly the expected keys (no accidental leaks)', () => {
    const pub = toPublicReport(fullReport);
    const keys = Object.keys(pub).sort();
    const expectedKeys = [
      'id',
      'reportType',
      'category',
      'title',
      'description',
      'city',
      'neighborhood',
      'addressText',
      'publicLat',
      'publicLng',
      'contactName',
      'contactPhone',
      'status',
      'verificationStatus',
      'urgency',
      'quantity',
      'quantityUnit',
      'peopleAffected',
      'confirmationCount',
      'createdAt',
      'expiresAt',
      'sourceType',
    ].sort();
    expect(keys).toEqual(expectedKeys);
  });
});
