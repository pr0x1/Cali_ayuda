import { describe, it, expect, vi } from 'vitest';
import { parseCsv } from '@/lib/ingest/gsheet/csv';
import {
  normalizeEstado,
  extractPhone,
  cleanText,
} from '@/lib/ingest/gsheet/normalize';
import { classifyCategory } from '@/lib/ingest/gsheet/classify';
import { generateSheetRowId, isBlankId } from '@/lib/ingest/gsheet/ids';
import { parseSheetRows } from '@/lib/ingest/gsheet/parse';
import { mapRowToInput } from '@/lib/ingest/gsheet/map';
import { buildSourceRef, csvExportUrl } from '@/lib/ingest/gsheet/config';
import type { ParsedSheetRow } from '@/schemas/ingest';

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quoted fields with commas', () => {
    expect(parseCsv('a,"b,c",d')).toEqual([['a', 'b,c', 'd']]);
  });

  it('handles quoted multi-line cells', () => {
    const csv = 'name,items\nAncianato,"Papel\nPanitos\nPañales"';
    const rows = parseCsv(csv);
    expect(rows[1][1]).toBe('Papel\nPanitos\nPañales');
  });

  it('handles escaped quotes', () => {
    expect(parseCsv('a,"say ""hi"""')).toEqual([['a', 'say "hi"']]);
  });

  it('normalizes CRLF', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('normalizeEstado', () => {
  it('maps URGENTE to critical/active', () => {
    expect(normalizeEstado('URGENTE')).toMatchObject({
      urgency: 'critical',
      status: 'active',
      isAppMarker: false,
    });
  });

  it('maps ABASTECIDO to low/resolved', () => {
    expect(normalizeEstado('ABASTECIDO')).toMatchObject({
      urgency: 'low',
      status: 'resolved',
    });
  });

  it('flags the app write-back marker for skipping (loop guard)', () => {
    expect(normalizeEstado('RESUELTO (app)').isAppMarker).toBe(true);
    expect(normalizeEstado('RESUELTO (app) 2026-08-11').isAppMarker).toBe(true);
  });

  it('defaults blank/free text to medium/active', () => {
    expect(normalizeEstado('').urgency).toBe('medium');
    expect(normalizeEstado('Mila se retiro del lugar.').status).toBe('active');
  });
});

describe('extractPhone', () => {
  it('extracts a spaced Colombian mobile', () => {
    expect(extractPhone('320 7499522')).toBe('320 7499522');
  });

  it('extracts a phone embedded in free text', () => {
    expect(extractPhone('Contacto 3147874022 gracias')).toBe('3147874022');
  });

  it('returns null when no phone present', () => {
    expect(extractPhone('Daniela Ibarra')).toBeNull();
    expect(extractPhone(undefined)).toBeNull();
  });

  it('rejects strings with too few digits', () => {
    expect(extractPhone('abc 123')).toBeNull();
  });
});

describe('classifyCategory (deterministic)', () => {
  it.each([
    ['Taladro percutor, Pulidora, alicates', 'herramientas'],
    ['NO MÁS AGUA, sí bebidas hidratantes', 'agua'],
    ['Proteina (carne, pollo, res) y desechables', 'alimentos'],
    ['médicos, enfermeros', 'asistencia_medica'],
    ['Poliestireno sulfonato de calcio (medicamento)', 'medicamentos'],
    ['PERSONAL / VOLUNTARIOS para rescatar personas', 'rescate'],
    ['Pañitos húmedos, implementos para bebés', 'higiene'],
    ['Gasolina, discos de pulidora', 'herramientas'],
    ['algo totalmente desconocido xyz', 'otro'],
  ])('classifies %s -> %s', (text, expected) => {
    expect(classifyCategory(text)).toBe(expected);
  });

  it('returns otro for empty input', () => {
    expect(classifyCategory(undefined)).toBe('otro');
    expect(classifyCategory('')).toBe('otro');
  });
});

describe('ids', () => {
  it('generates a prefixed readable id', () => {
    const id = generateSheetRowId(() => 0.5);
    expect(id).toMatch(/^CA-[A-Z0-9]{5}$/);
  });

  it('detects blank ids', () => {
    expect(isBlankId('')).toBe(true);
    expect(isBlankId('   ')).toBe(true);
    expect(isBlankId('CA-7F3K9')).toBe(false);
  });
});

describe('config helpers', () => {
  it('builds a stable source_ref', () => {
    expect(buildSourceRef('SHEET1', '0', 'CA-7F3K9')).toBe(
      'gsheet:SHEET1:0:CA-7F3K9'
    );
  });

  it('builds a public csv export url', () => {
    expect(csvExportUrl('SHEET1', '0')).toBe(
      'https://docs.google.com/spreadsheets/d/SHEET1/export?format=csv&gid=0'
    );
  });
});

// A slice of the real sheet, WITH an ID column prepended (col A) as the app expects.
const SAMPLE_CSV = `NECESIDADES/DONACIONES / ACTUALIZADO 1:50PM,,,,,,,
ID,Punto,Coordinador,Contacto,Voluntarios en el lugar,Necesidad / donacion,Detalle,Estado
CA-AAAAA,Edif Colores - Tequendama,Jonathan Gomez,320 7499522,,"Taladro percurtor, Pulidora , alicates",,
,Olla comunitaria el poblado,Pilar Rodriguez,3017124668,,"Proteina (carne, pollo, res)",,URGENTE
CA-CCCCC,Notaría 20,Daniela Ibarra,3008130734,,"Agua, palas",,ABASTECIDO
CA-DDDDD,Edificio Resuelto,Alguien,,,Cascos,,RESUELTO (app)
AYUDA DISPONIBLE,DESTINADO A,HORA,,CONTACTO,TELEFONO,Observaciones,
,5 mujeres de Olla Comunitaria,POBLADO,,Daniela Orjuela,,Tiene transporte,`;

describe('parseSheetRows (integration on sample)', () => {
  const rows = parseSheetRows(parseCsv(SAMPLE_CSV));

  it('parses needs and offers, skipping structural rows', () => {
    const needs = rows.filter((r) => r.reportType === 'need');
    const offers = rows.filter((r) => r.reportType === 'offer');
    expect(needs.length).toBe(4); // Colores, Olla, Notaria, Resuelto
    expect(offers.length).toBe(1);
  });

  it('captures ID column and phone', () => {
    const colores = rows.find((r) => r.title.startsWith('Edif Colores'));
    expect(colores?.sheetRowId).toBe('CA-AAAAA');
    expect(colores?.contactPhone).toBe('320 7499522');
  });

  it('leaves blank IDs empty for later assignment', () => {
    const olla = rows.find((r) => r.title.startsWith('Olla'));
    expect(olla?.sheetRowId).toBe('');
  });
});

describe('mapRowToInput', () => {
  const base: ParsedSheetRow = {
    sheetRowId: 'CA-AAAAA',
    reportType: 'need',
    title: 'Edif Colores - Tequendama',
    description: 'Taladro percutor, Pulidora, alicates',
    neighborhood: 'Edif Colores - Tequendama',
    contactName: 'Jonathan Gomez',
    contactPhone: '320 7499522',
    estadoRaw: 'URGENTE',
    rowIndex: 2,
  };

  it('maps to a valid CreateReportInput with classified category', () => {
    const { skip, input } = mapRowToInput(base);
    expect(skip).toBe(false);
    expect(input.reportType).toBe('need');
    expect(input.category).toBe('herramientas');
    expect(input.urgency).toBe('critical');
  });

  it('never sets coordinates (list-only ingest)', () => {
    const { input } = mapRowToInput(base);
    expect(input.lat).toBeUndefined();
    expect(input.lng).toBeUndefined();
  });

  it('defaults showContact to false (explicit-consent default)', () => {
    const { input } = mapRowToInput(base);
    expect(input.showContact).toBe(false);
  });

  it('skips app write-back marker rows (loop guard)', () => {
    const { skip } = mapRowToInput({ ...base, estadoRaw: 'RESUELTO (app)' });
    expect(skip).toBe(true);
  });
});

describe('privacy: phones are never logged during ingest', () => {
  it('extractPhone result is not emitted to console', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const phone = extractPhone('320 7499522');
    cleanText('some text');
    expect(spy).not.toHaveBeenCalled();
    expect(errSpy).not.toHaveBeenCalled();
    expect(phone).toBe('320 7499522');
    spy.mockRestore();
    errSpy.mockRestore();
  });
});
