import { describe, it, expect } from 'vitest';
import { createReportSchema, updateReportSchema, confirmReportSchema } from '@/schemas/reports';

describe('createReportSchema', () => {
  const validNeed = {
    reportType: 'need',
    category: 'agua',
    title: 'Necesitamos agua potable',
    urgency: 'high',
  };

  const validOffer = {
    reportType: 'offer',
    category: 'alimentos',
    title: 'Tenemos comida para 50 personas',
    quantity: 50,
    quantityUnit: 'raciones',
  };

  const validServicePoint = {
    reportType: 'service_point',
    category: 'albergue',
    title: 'Albergue temporal en centro comunitario',
    lat: 3.4516,
    lng: -76.532,
  };

  it('validates a valid need report', () => {
    const result = createReportSchema.safeParse(validNeed);
    expect(result.success).toBe(true);
  });

  it('validates a valid offer report', () => {
    const result = createReportSchema.safeParse(validOffer);
    expect(result.success).toBe(true);
  });

  it('validates a valid service point report', () => {
    const result = createReportSchema.safeParse(validServicePoint);
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = createReportSchema.safeParse({
      reportType: 'need',
      category: 'agua',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title shorter than 3 characters', () => {
    const result = createReportSchema.safeParse({
      ...validNeed,
      title: 'ab',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('3 caracteres');
    }
  });

  it('rejects title longer than 200 characters', () => {
    const result = createReportSchema.safeParse({
      ...validNeed,
      title: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid report type', () => {
    const result = createReportSchema.safeParse({
      ...validNeed,
      reportType: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = createReportSchema.safeParse({
      ...validNeed,
      category: 'invalid_category',
    });
    expect(result.success).toBe(false);
  });

  it('defaults urgency to medium', () => {
    const result = createReportSchema.safeParse({
      reportType: 'need',
      category: 'agua',
      title: 'Necesitamos agua',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urgency).toBe('medium');
    }
  });

  it('defaults city to Cali', () => {
    const result = createReportSchema.safeParse(validNeed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBe('Cali');
    }
  });

  it('validates lat/lng ranges', () => {
    const invalidLat = createReportSchema.safeParse({
      ...validNeed,
      lat: 91,
      lng: -76,
    });
    expect(invalidLat.success).toBe(false);

    const invalidLng = createReportSchema.safeParse({
      ...validNeed,
      lat: 3,
      lng: -181,
    });
    expect(invalidLng.success).toBe(false);
  });

  it('rejects invalid phone format', () => {
    const result = createReportSchema.safeParse({
      ...validNeed,
      contactPhone: 'not-a-phone',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid phone formats', () => {
    const formats = [
      '3001234567',
      '+57 300 123 4567',
      '(602) 555-1234',
      '+1-555-123-4567',
    ];
    for (const phone of formats) {
      const result = createReportSchema.safeParse({
        ...validNeed,
        contactPhone: phone,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects negative quantity', () => {
    const result = createReportSchema.safeParse({
      ...validOffer,
      quantity: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative peopleAffected', () => {
    const result = createReportSchema.safeParse({
      ...validNeed,
      peopleAffected: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects description over 2000 characters', () => {
    const result = createReportSchema.safeParse({
      ...validNeed,
      description: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid categories', () => {
    const categories = [
      'agua', 'alimentos', 'medicamentos', 'transporte', 'albergue',
      'asistencia_medica', 'herramientas', 'rescate', 'ropa', 'higiene',
      'comunicaciones', 'voluntarios', 'donaciones', 'informacion', 'otro',
    ];
    for (const category of categories) {
      const result = createReportSchema.safeParse({
        ...validNeed,
        category,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateReportSchema', () => {
  it('validates partial updates', () => {
    const result = updateReportSchema.safeParse({
      title: 'Updated title',
    });
    expect(result.success).toBe(true);
  });

  it('validates status updates', () => {
    const result = updateReportSchema.safeParse({
      status: 'resolved',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateReportSchema.safeParse({
      status: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty object (no updates)', () => {
    const result = updateReportSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('confirmReportSchema', () => {
  it('validates confirm type', () => {
    expect(confirmReportSchema.safeParse({ confirmationType: 'confirm' }).success).toBe(true);
  });

  it('validates deny type', () => {
    expect(confirmReportSchema.safeParse({ confirmationType: 'deny' }).success).toBe(true);
  });

  it('validates resolved type', () => {
    expect(confirmReportSchema.safeParse({ confirmationType: 'resolved' }).success).toBe(true);
  });

  it('rejects invalid confirmation type', () => {
    expect(confirmReportSchema.safeParse({ confirmationType: 'invalid' }).success).toBe(false);
  });

  it('rejects missing confirmationType', () => {
    expect(confirmReportSchema.safeParse({}).success).toBe(false);
  });
});
