/**
 * Map a parsed sheet row to a validated CreateReportInput.
 *
 * AGENTS.md §4/§9/§10:
 *   - ingested rows are UNTRUSTED community input;
 *   - they pass the SAME Zod validation as user-created reports;
 *   - they can never set verification_status='official' — that is decided
 *     exclusively by trusted moderation logic, not by ingestion.
 */
import type { ParsedSheetRow } from '@/schemas/ingest';
import { createReportSchema, type CreateReportInput } from '@/schemas/reports';
import { classifyCategory } from './classify';
import { normalizeEstado } from './normalize';
import { DEFAULT_CITY } from '@/lib/constants';

export interface MappedRow {
  input: CreateReportInput;
  /** Skip = our own write-back marker (loop guard). */
  skip: boolean;
}

/**
 * Convert one parsed row to a CreateReportInput.
 * Returns skip=true for app-marker rows so the caller ignores them.
 * Throws if the mapped object fails createReportSchema validation.
 */
export function mapRowToInput(row: ParsedSheetRow): MappedRow {
  const estado = normalizeEstado(row.estadoRaw);
  if (estado.isAppMarker) {
    return { skip: true, input: {} as CreateReportInput };
  }

  const category = classifyCategory(
    [row.title, row.description].filter(Boolean).join(' ')
  );

  const candidate = {
    reportType: row.reportType,
    category,
    title: row.title,
    description: row.description,
    city: DEFAULT_CITY,
    neighborhood: row.neighborhood,
    // Location: place names only — no coordinates on ingest (list-only display).
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    // Contact came from a shared community sheet; do not force-show. Coordinators
    // publish these publicly, but keep the app's explicit-consent default.
    showContact: false,
    urgency: estado.urgency,
  };

  // Same validation as user input (§9). Throws on failure — caller logs safely.
  const input = createReportSchema.parse(candidate);
  return { skip: false, input };
}
