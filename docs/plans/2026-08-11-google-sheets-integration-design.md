# Google Sheets Integration Design

Date: 2026-08-11
Status: Approved for implementation

## Problem

Community coordinators maintain emergency needs/offers in a shared Google Sheet
(example: `example_data/Temblor Cali - Técnico Cine y AV Cali - NECESIDADES_DONACIONES.csv`).
We want Cali Ayuda to:

1. Read that Sheet and ingest rows as reports.
2. Write limited state back to the Sheet (assigned IDs, resolved marker).

## Key facts / constraints

- The file is a **Google Sheet**, not Excel. "Anyone can view/edit" via link only
  affects interactive browser users. **Programmatic writes still require auth**
  (a Google service account), even on a public-edit sheet. Reads are free via the
  CSV export URL.
- AGENTS.md trust model: Supabase is source of truth. Ingested rows are untrusted
  community input (§2, §4, §10). They land as `verification_status='unverified'`,
  `source_type='community'`, and are NEVER auto-promoted to `official`.
- Vercel-safe: stateless Next.js Route Handlers + Vercel Cron. No daemons, no local FS.

## Decisions

- Sync direction: read (ingest) + write-back.
- Write-back mechanism: **Google service account** (JWT signed in-process, no `googleapis` dep).
- Write-back scope: only `RESUELTO (app)` marker on resolve + assigned ID backfill.
  Never writes contact/coordinate/private data (§17, §21).
- Runtime: manual admin trigger + Vercel Cron (every 30 min).
- Dedup key: explicit **ID column** in the Sheet (column A), app-assigned,
  shared unique space across both tables. Position-independent.
- DB: new migration adds `source_ref TEXT UNIQUE` for DB-enforced idempotency.
- Location: place names only → ingest with neighborhood/address_text, `lat/lng=null`.
  Reports show in list view, not map. No geocoding dependency.
- Category classification: deterministic keyword map. AI optional later, always
  falls back to keywords (§14, §15). Not in v1.

## Data flow

```
READ:  Google Sheet --CSV export (public)--> parse --> classify --> Zod --> upsert reports (source_ref)
WRITE: reports(resolved) --Sheets API v4 (service account)--> Sheet Estado = "RESUELTO (app)"
       reports(new)      --Sheets API v4--> Sheet col A = "CA-XXXXX" (ID backfill)
```

Loop guard: read parser skips rows whose Estado starts with `RESUELTO (app)`.
Idempotency: `source_ref = gsheet:<sheetId>:<gid>:<sheetRowId>` where `sheetRowId`
is the ID column value.

## Sheet layout

Column A = `ID` (app-owned, blank for new rows). Existing columns shift right.
Two logical tables in one tab:

- NECESIDADES/DONACIONES -> `report_type='need'`
- AYUDA DISPONIBLE       -> `report_type='offer'`

Column mapping (need table):

| Sheet column        | Report field                          |
|---------------------|---------------------------------------|
| ID                  | source_ref (sheetRowId)               |
| Punto               | title + neighborhood                  |
| Coordinador         | contact_name                          |
| Contacto            | contact_phone (regex-validated)       |
| Necesidad/donación  | description -> classify -> category   |
| Detalle             | appended to description               |
| Estado              | urgency + status                      |

Estado normalization:

| Estado value      | urgency  | status   |
|-------------------|----------|----------|
| URGENTE           | critical | active   |
| ABASTECIDO        | low      | resolved |
| RESUELTO (app)    | (skip row — loop guard)             |
| blank             | medium   | active   |
| free text         | medium   | active (kept as note) |

## Modules

```
lib/ingest/gsheet/
  config.ts      sheet id, gid, ranges, ID prefix, markers
  fetch.ts       CSV export fetch (public)
  csv.ts         RFC-4180 CSV parse (quoted multiline cells)
  parse.ts       split 2 tables, map columns, skip header/blank/marker
  classify.ts    keyword -> category, deterministic fallback
  normalize.ts   Estado -> urgency/status; phone extract+validate; clean text
  ids.ts         generate CA-XXXXX; detect blanks for backfill
  map.ts         parsed row -> CreateReportInput + source_ref
  writeback.ts   Sheets API v4 (service account JWT); ID + Estado writes only
  ingest.ts      orchestrator

schemas/ingest.ts  Zod: RawSheetRow, ParsedNeedRow, ParsedOfferRow
lib/db/reports.ts  ADD upsertReportBySourceRef()
```

## Classifier keywords

```
taladro|pulidora|alicate|pica|pala|disco|herramient|casco|guante|cinta seg -> herramientas
agua|hidratant|bebida                                                       -> agua
comida|almuerz|proteina|pollo|sandwich|aliment|desechable                   -> alimentos
medic|enferm|ensure|pañal|medicament|primeros auxilios                      -> medicamentos
personal|voluntari|relevo|brigadista                                        -> voluntarios
rescat|atrapad|escombr                                                      -> rescate
(no match)                                                                  -> otro
```

## Migration 00004

```sql
ALTER TABLE reports ADD COLUMN source_ref TEXT;
ALTER TABLE reports ADD CONSTRAINT reports_source_ref_unique UNIQUE (source_ref);
CREATE INDEX idx_reports_source_ref ON reports(source_ref) WHERE source_ref IS NOT NULL;
```

## API

```
POST /api/admin/ingest/gsheet   manual trigger, CRON_SECRET auth
GET  /api/cron/ingest-gsheet    scheduled, CRON_SECRET auth
```

Summary DTO (no PII): `{ fetched, ingested, updated, skipped, idsAssigned, resolvedPushed, errors, timestamp }`.

vercel.json cron: `*/30 * * * *`.

## Env (server-only)

```
GOOGLE_SERVICE_ACCOUNT_KEY=   full JSON, never NEXT_PUBLIC, never logged
GSHEET_SPREADSHEET_ID=
GSHEET_GID=0
```

## Failure behavior (§15)

Fetch fail / malformed CSV / write-back 4xx -> log safely, return partial summary,
app keeps working. Manual report creation never depends on this pipeline.

## Tests (§22)

CSV multiline parse, table split, classifier, Estado normalize, phone extract
(assert never logged), source_ref dedup, ID assignment, forced unverified/community
(no official leak), write-back payload contains only ID + Estado (no contact/coords).
AI provider mocked / not required.

## Architectural changes flagged (§32)

1. DB schema: new source_ref migration.
2. New external integration: Google Sheets API + service account secret.
3. AI trust boundary: category classification (deterministic v1; AI optional later).
