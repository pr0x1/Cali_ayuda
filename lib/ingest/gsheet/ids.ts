/** App-owned Sheet row ID generation. */
import { SHEET_ID_PREFIX } from './config';

// Unambiguous alphabet (no O/0, I/1) for human-readable spreadsheet cells.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Generate a short readable ID like "CA-7F3K9". */
export function generateSheetRowId(rand: () => number = Math.random): string {
  let body = '';
  for (let i = 0; i < 5; i++) {
    body += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  }
  return `${SHEET_ID_PREFIX}${body}`;
}

/** True when a Sheet ID cell is empty and needs an app-assigned ID. */
export function isBlankId(raw: string | undefined): boolean {
  return (raw ?? '').trim().length === 0;
}
