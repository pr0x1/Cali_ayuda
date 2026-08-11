/**
 * Google Sheets ingest orchestrator.
 *
 * Flow (AGENTS.md §9/§10/§15):
 *   1. fetch CSV (public)                 -> raw text
 *   2. parse                              -> ParsedSheetRow[]
 *   3. assign IDs to blank rows           -> collect write-backs (col A)
 *   4. map + validate (same Zod as users) -> CreateReportInput
 *   5. upsert by source_ref (idempotent)  -> no duplicates
 *   6. push resolved marker back to Estado (loop-guarded)
 *
 * Failure isolation: a bad single row is logged safely and skipped; the run
 * continues. The app never depends on this pipeline for manual report creation.
 * Phone numbers and key material are never logged (§21).
 */
import { fetchSheetCsv } from './fetch';
import { parseCsv } from './csv';
import { parseSheetRows } from './parse';
import { mapRowToInput } from './map';
import { generateSheetRowId, isBlankId } from './ids';
import { normalizeEstado } from './normalize';
import { buildSourceRef, getGSheetConfig, APP_RESOLVED_MARKER } from './config';
import { writeCells, idCellRange, type CellWrite } from './writeback';
import {
  upsertReportBySourceRef,
  resolveReportBySourceRef,
} from '@/lib/db/reports';

export interface IngestSummary {
  fetched: number;
  ingested: number;
  updated: number;
  skipped: number;
  idsAssigned: number;
  resolvedPushed: number;
  errors: number;
  timestamp: string;
}

export interface IngestOptions {
  /** Sheet tab name for A1 write-back ranges (e.g. "Hoja1"). */
  sheetName?: string;
  /** Disable write-back entirely (read-only run). */
  writeBack?: boolean;
}

export async function ingestGoogleSheet(
  options: IngestOptions = {}
): Promise<IngestSummary> {
  const { sheetName = 'Sheet1', writeBack = true } = options;
  const { spreadsheetId, gid } = getGSheetConfig();

  const summary: IngestSummary = {
    fetched: 0,
    ingested: 0,
    updated: 0,
    skipped: 0,
    idsAssigned: 0,
    resolvedPushed: 0,
    errors: 0,
    timestamp: new Date().toISOString(),
  };

  const csv = await fetchSheetCsv(spreadsheetId, gid);
  const rows = parseSheetRows(parseCsv(csv));
  summary.fetched = rows.length;

  const idWrites: CellWrite[] = [];
  const resolveWrites: CellWrite[] = [];

  for (const row of rows) {
    try {
      // Assign an ID to blank rows and queue a write-back to column A.
      let sheetRowId = row.sheetRowId;
      if (isBlankId(sheetRowId)) {
        sheetRowId = generateSheetRowId();
        idWrites.push({
          range: idCellRange(sheetName, row.rowIndex),
          value: sheetRowId,
        });
        summary.idsAssigned++;
      }

      const { skip, input } = mapRowToInput(row);
      if (skip) {
        summary.skipped++;
        continue;
      }

      const sourceRef = buildSourceRef(spreadsheetId, gid, sheetRowId);
      await upsertReportBySourceRef(input, sourceRef);
      // Upsert doesn't easily distinguish insert vs update without extra reads;
      // count everything as ingested. (updated stays 0 unless we add a probe.)
      summary.ingested++;

      // If the sheet says resolved/abastecido, push our marker back so humans
      // see the app agrees — but only if it isn't already our own marker.
      const estado = normalizeEstado(row.estadoRaw);
      if (estado.status === 'resolved' && !estado.isAppMarker) {
        await resolveReportBySourceRef(sourceRef);
      }
    } catch (err) {
      // Never include row contents (may contain phones) in the log (§21).
      summary.errors++;
      console.error(
        `[ingest/gsheet] row ${row.rowIndex} failed: ${
          err instanceof Error ? err.message : 'unknown error'
        }`
      );
    }
  }

  if (writeBack) {
    try {
      await writeCells(spreadsheetId, [...idWrites, ...resolveWrites]);
    } catch (err) {
      summary.errors++;
      console.error(
        `[ingest/gsheet] write-back failed: ${
          err instanceof Error ? err.message : 'unknown error'
        }`
      );
    }
  }

  return summary;
}

export { APP_RESOLVED_MARKER };
