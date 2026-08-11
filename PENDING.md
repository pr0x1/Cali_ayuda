# PENDING — Google Sheets Integration Wiring

The Google Sheets ingest pipeline (branch `feat/gsheet-ingest`) is code-complete
and tested, but it is **not live** until the manual setup below is done. Nothing
here can be automated from the repo — each item requires access to Google Cloud,
the Google Sheet, Supabase, or Vercel.

## Status

- [x] Read pipeline (CSV export, parser, classifier, normalizer)
- [x] Write-back (service-account JWT, Sheets API v4)
- [x] Idempotent upsert (`source_ref` unique)
- [x] Manual admin trigger + Vercel cron route
- [x] Tests (35 cases) + type-check + lint green
- [ ] **Manual wiring below — REQUIRED before it works**

---

## 1. Add the ID column to the Google Sheet

The parser expects an **app-owned ID column as column A** (shifting current data
right). It is the stable dedup key (`source_ref`), so it must survive row
reordering.

Steps:

1. Insert a new column **before** current column A.
2. Header it `ID`.
3. Leave all data cells **blank** — the app assigns `CA-XXXXX` values on first
   ingest and writes them back automatically.
4. Never edit ID cells by hand. Never reuse an ID.

Resulting column order:

```
need :  ID | Punto | Coordinador | Contacto | Voluntarios | Necesidad | Detalle | Estado
offer:  ID | Ayuda | DestinadoA  | Hora     | Contacto    | Telefono  | Observaciones
```

> Note: ID backfill and the resolved marker are the ONLY things ever written
> back to the sheet. Contact details, coordinates, and moderation data are never
> written (AGENTS.md §17/§21).

---

## 2. Create the Google service account (for write-back)

A public "anyone can edit" link does **not** authorize programmatic writes — the
Sheets API rejects unauthenticated writes. A service account is mandatory for
write-back. (Read-only ingest works without any credentials.)

Steps:

1. Google Cloud Console → create (or pick) a project.
2. **Enable the Google Sheets API** for that project.
3. IAM & Admin → Service Accounts → **create a service account**.
4. Create a **JSON key** for it and download it.
5. Copy the service-account email (looks like
   `name@project.iam.gserviceaccount.com`).
6. In the Google Sheet → **Share** → add that email as **Editor**.

---

## 3. Environment variables

Set these in Vercel (Project → Settings → Environment Variables) and locally in
`.env.local`. All are **server-only** — never prefix with `NEXT_PUBLIC_`, never
log them.

| Variable | Purpose | Example |
|---|---|---|
| `GSHEET_SPREADSHEET_ID` | ID from the sheet URL (`/d/<ID>/edit`) | `1AbC...xyz` |
| `GSHEET_GID` | Tab gid from the URL (`gid=<N>`) | `0` |
| `GSHEET_TAB_NAME` | **Exact** tab name (used for write-back A1 ranges) | `Hoja1` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Full service-account JSON, single line | `{"type":"service_account",...}` |
| `CRON_SECRET` | Bearer token guarding the ingest routes | `<random secret>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Already required; used by upsert | — |

> **Critical:** `GSHEET_TAB_NAME` must be the real tab name. If it stays the
> default `Sheet1` but your tab is named differently, ID/resolved write-backs
> target the wrong tab (or fail).

For the JSON key on the command line, keep it as one line. If pasting into a
`.env` file, wrap in single quotes and ensure `\n` escapes in `private_key` are
preserved.

---

## 4. Apply the database migration

Migration `supabase/migrations/00004_ingest_source_ref.sql` adds the
`source_ref` unique column that makes ingest idempotent.

```bash
supabase db push
# or apply 00004_ingest_source_ref.sql via your migration workflow
```

Verify:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'reports' AND column_name = 'source_ref';
```

---

## 5. Verify the cron entry

`vercel.json` already includes:

```json
{ "path": "/api/cron/ingest-gsheet", "schedule": "*/30 * * * *" }
```

Confirm it appears under Vercel → Project → Cron Jobs after deploy.

---

## 6. Smoke test

Read-only first (no write-back), to confirm parsing without touching the sheet:

```bash
curl -X POST https://<your-app>/api/admin/ingest/gsheet \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"writeBack": false}'
```

Expected JSON summary:

```json
{ "fetched": N, "ingested": N, "updated": 0, "skipped": M,
  "idsAssigned": 0, "resolvedPushed": 0, "errors": 0, "timestamp": "..." }
```

Then a full run with write-back (assigns IDs, pushes resolved markers):

```bash
curl -X POST https://<your-app>/api/admin/ingest/gsheet \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"writeBack": true}'
```

Checks:

- Blank ID cells in the sheet get filled with `CA-XXXXX`.
- Rows with `URGENTE` → reports created with `urgency=critical`.
- Rows with `ABASTECIDO` → reports resolved; sheet Estado gets `RESUELTO (app)`.
- Re-running does **not** create duplicates (idempotent on `source_ref`).
- No coordinates on ingested reports (list view only, not map).

---

## 7. Known limitations / follow-ups

- **No geocoding.** Ingested reports have place names but no lat/lng, so they
  appear in the list view, not on the map. Add geocoding later if needed.
- **AI classification not enabled.** Category is assigned by a deterministic
  keyword map. AI can be layered on later as an optional enhancement with the
  keyword map as fallback (AGENTS.md §14/§15).
- **`updated` counter is always 0.** Upsert doesn't distinguish insert vs update
  without an extra read; everything is counted as `ingested`.
- **Admin route auth is `CRON_SECRET`-only.** Replace with real admin auth before
  exposing an admin UI.
