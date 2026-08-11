/**
 * Normalization helpers for messy sheet cells.
 * All pure functions — safe to unit test without I/O.
 */
import type { Urgency, ReportStatus } from '@/types';
import { APP_RESOLVED_MARKER } from './config';

export interface NormalizedEstado {
  urgency: Urgency;
  status: ReportStatus;
  /** True when the row is our own write-back marker and must be skipped. */
  isAppMarker: boolean;
}

/** Map a free-text "Estado" cell to urgency + status. */
export function normalizeEstado(raw: string | undefined): NormalizedEstado {
  const value = (raw ?? '').trim();
  const upper = value.toUpperCase();

  if (upper.startsWith(APP_RESOLVED_MARKER.toUpperCase())) {
    return { urgency: 'medium', status: 'resolved', isAppMarker: true };
  }
  if (upper.includes('URGENTE')) {
    return { urgency: 'critical', status: 'active', isAppMarker: false };
  }
  if (upper.includes('ABASTECIDO')) {
    return { urgency: 'low', status: 'resolved', isAppMarker: false };
  }
  // blank or free text (e.g. "Mila se retiró del lugar.")
  return { urgency: 'medium', status: 'active', isAppMarker: false };
}

/**
 * Extract a phone number from a cell that may contain a phone, free text, or both.
 * Returns a cleaned phone string matching the project's contactPhone regex,
 * or null if none found. NEVER log the return value (AGENTS.md §21).
 */
export function extractPhone(raw: string | undefined): string | null {
  if (!raw) return null;
  // Colombian mobiles are 10 digits, often written with spaces.
  // Grab the first run that looks like a phone (>= 7 digits allowing separators).
  const match = raw.match(/(\+?\d[\d\s\-()]{6,}\d)/);
  if (!match) return null;
  const candidate = match[1].trim();
  const digitCount = (candidate.match(/\d/g) ?? []).length;
  if (digitCount < 7 || digitCount > 15) return null;
  // Enforce the same character set as schemas/reports.ts contactPhone.
  if (!/^[\d\s+\-()]+$/.test(candidate)) return null;
  return candidate;
}

/** Collapse internal whitespace/newlines and trim. Empty -> undefined. */
export function cleanText(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Build a short title from a place name, capped to the schema max (200). */
export function toTitle(raw: string | undefined, fallback: string): string {
  const cleaned = cleanText(raw) ?? fallback;
  return cleaned.slice(0, 200);
}
