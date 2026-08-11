/**
 * Split the coordination sheet into structured rows.
 *
 * The sheet contains TWO logical tables in one tab:
 *   1. NECESIDADES/DONACIONES  -> report_type 'need'
 *   2. AYUDA DISPONIBLE        -> report_type 'offer'
 *
 * Column A is the app-owned ID column. Remaining columns per table:
 *
 *   need : ID | Punto | Coordinador | Contacto | Voluntarios | Necesidad | Detalle | Estado
 *   offer: ID | Ayuda | DestinadoA  | Hora     | Contacto    | Telefono  | Observaciones
 *
 * The parser is defensive: it detects the section boundary by header text and
 * skips header/blank/instructional rows.
 */
import type { ParsedSheetRow } from '@/schemas/ingest';
import { cleanText, extractPhone, toTitle } from './normalize';
import { AYUDA_DISPONIBLE_HEADER } from './config';

const NEED = {
  id: 0,
  punto: 1,
  coordinador: 2,
  contacto: 3,
  voluntarios: 4,
  necesidad: 5,
  detalle: 6,
  estado: 7,
} as const;

const OFFER = {
  id: 0,
  ayuda: 1,
  destinadoA: 2,
  hora: 3,
  contacto: 4,
  telefono: 5,
  observaciones: 6,
} as const;

type Section = 'need' | 'offer' | 'none';

/** Rows whose first data column is one of these are structural, not data. */
const SKIP_TITLES = [
  'punto',
  'ayuda disponible',
  'ayudas pendientes por asignar',
  'importante',
  'necesidades/donaciones',
];

function isStructuralRow(cells: string[]): boolean {
  const joined = cells.join('').trim();
  if (joined.length === 0) return true; // fully blank
  const first = (cells[1] ?? cells[0] ?? '').trim().toLowerCase();
  return SKIP_TITLES.some((t) => first.startsWith(t));
}

function detectSectionSwitch(cells: string[]): Section | null {
  const joined = cells.join(' ').toUpperCase();
  if (joined.includes(AYUDA_DISPONIBLE_HEADER)) return 'offer';
  if (joined.includes('NECESIDADES/DONACIONES')) return 'need';
  return null;
}

/**
 * Parse raw CSV rows into structured sheet rows.
 * @param rows output of parseCsv()
 */
export function parseSheetRows(rows: string[][]): ParsedSheetRow[] {
  const result: ParsedSheetRow[] = [];
  let section: Section = 'need'; // sheet starts with the needs table

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cells = rows[rowIndex];

    const switched = detectSectionSwitch(cells);
    if (switched) {
      section = switched;
      continue;
    }

    if (isStructuralRow(cells)) continue;
    if (section === 'none') continue;

    if (section === 'need') {
      const title = toTitle(cells[NEED.punto], '');
      if (!title) continue; // a need must at least have a place name
      const necesidad = cleanText(cells[NEED.necesidad]);
      const detalle = cleanText(cells[NEED.detalle]);
      const description = [necesidad, detalle].filter(Boolean).join(' — ') || undefined;

      result.push({
        sheetRowId: (cells[NEED.id] ?? '').trim(),
        reportType: 'need',
        title,
        description,
        neighborhood: cleanText(cells[NEED.punto]),
        contactName: cleanText(cells[NEED.coordinador]),
        contactPhone: extractPhone(cells[NEED.contacto]) ?? undefined,
        estadoRaw: cleanText(cells[NEED.estado]),
        rowIndex,
      });
    } else {
      const title = toTitle(cells[OFFER.ayuda], '');
      if (!title) continue;
      const destinado = cleanText(cells[OFFER.destinadoA]);
      const obs = cleanText(cells[OFFER.observaciones]);
      const description =
        [destinado ? `Destinado a: ${destinado}` : undefined, obs]
          .filter(Boolean)
          .join(' — ') || undefined;

      result.push({
        sheetRowId: (cells[OFFER.id] ?? '').trim(),
        reportType: 'offer',
        title,
        description,
        neighborhood: destinado,
        contactName: cleanText(cells[OFFER.contacto]),
        contactPhone:
          extractPhone(cells[OFFER.telefono]) ??
          extractPhone(cells[OFFER.contacto]) ??
          undefined,
        estadoRaw: cleanText(cells[OFFER.observaciones]),
        rowIndex,
      });
    }
  }

  return result;
}
