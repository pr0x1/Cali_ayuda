-- Cali Ayuda: external ingest dedup key
-- Enables idempotent ingestion from external sources (e.g. Google Sheets).
-- A stable per-row reference lets re-running an import update rows instead of
-- duplicating them. NULL for app-native (user-created) reports.

ALTER TABLE reports ADD COLUMN source_ref TEXT;

-- Any non-null source_ref must be unique (DB-enforced idempotency).
-- NULL values are allowed and not subject to the constraint.
ALTER TABLE reports
  ADD CONSTRAINT reports_source_ref_unique UNIQUE (source_ref);

CREATE INDEX idx_reports_source_ref
  ON reports(source_ref)
  WHERE source_ref IS NOT NULL;

COMMENT ON COLUMN reports.source_ref IS
  'Stable external dedup key, e.g. gsheet:<spreadsheetId>:<gid>:<sheetRowId>. NULL for app-native reports.';
