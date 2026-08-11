/** Configuration + shared constants for Google Sheets ingest. */

/** Prefix for app-assigned Sheet row IDs (readable in a spreadsheet cell). */
export const SHEET_ID_PREFIX = 'CA-';

/**
 * Marker written back into the Sheet "Estado" column when an ingested report
 * is resolved in-app. The read parser SKIPS any row whose Estado starts with
 * this marker, preventing an ingest feedback loop.
 */
export const APP_RESOLVED_MARKER = 'RESUELTO (app)';

/** Header text that separates the two logical tables in the sheet. */
export const AYUDA_DISPONIBLE_HEADER = 'AYUDA DISPONIBLE';
export const NECESIDADES_HEADER = 'NECESIDADES';

/** Runtime config resolved from environment (server-only). */
export interface GSheetConfig {
  spreadsheetId: string;
  gid: string;
}

/** CSV export URL for a public Google Sheet — no credentials required. */
export function csvExportUrl(spreadsheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
    spreadsheetId
  )}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

/** Read ingest config from env. Throws if required values are missing. */
export function getGSheetConfig(): GSheetConfig {
  const spreadsheetId = process.env.GSHEET_SPREADSHEET_ID;
  const gid = process.env.GSHEET_GID ?? '0';
  if (!spreadsheetId) {
    throw new Error('GSHEET_SPREADSHEET_ID is required for Google Sheets ingest');
  }
  return { spreadsheetId, gid };
}

/** Build the stable dedup key for a sheet row. */
export function buildSourceRef(
  spreadsheetId: string,
  gid: string,
  sheetRowId: string
): string {
  return `gsheet:${spreadsheetId}:${gid}:${sheetRowId}`;
}
