/**
 * Google Sheets write-back via a service account.
 *
 * A public "anyone can edit" link does NOT grant programmatic write access —
 * the Sheets API rejects unauthenticated writes. We therefore sign a JWT with
 * the service-account private key, exchange it for an access token, and call
 * the Sheets API v4.
 *
 * We sign the JWT in-process with Node's crypto (no `googleapis` dependency,
 * keeping the bundle small — AGENTS.md §24/§25).
 *
 * SECURITY (AGENTS.md §17/§21/§33):
 *  - the key is read from GOOGLE_SERVICE_ACCOUNT_KEY (server-only), never logged;
 *  - only the ID column and the Estado marker are ever written back;
 *  - contact details, coordinates, and moderation data are NEVER written.
 *
 * This module is Node-runtime only (uses `crypto`).
 */
import { createSign } from 'crypto';

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function loadKey(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY is required for Google Sheets write-back'
    );
  }
  let parsed: ServiceAccountKey;
  try {
    parsed = JSON.parse(raw) as ServiceAccountKey;
  } catch {
    // Do NOT include the key material in the error (§21).
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY missing client_email/private_key');
  }
  return parsed;
}

/** Exchange the service-account key for a short-lived OAuth access token. */
async function getAccessToken(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = key.token_uri ?? DEFAULT_TOKEN_URI;

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: SHEETS_SCOPE,
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;
  const signature = base64url(
    createSign('RSA-SHA256').update(signingInput).sign(key.private_key)
  );
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error('Google token exchange returned no access_token');
  }
  return json.access_token;
}

/** A single cell write: A1 range -> value. */
export interface CellWrite {
  range: string; // e.g. "Hoja1!A4"
  value: string;
}

/**
 * Write cells back to the sheet in one batch.
 * No-op (returns 0) when there is nothing to write.
 */
export async function writeCells(
  spreadsheetId: string,
  writes: CellWrite[]
): Promise<number> {
  if (writes.length === 0) return 0;

  const key = loadKey();
  const token = await getAccessToken(key);

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values:batchUpdate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: writes.map((w) => ({ range: w.range, values: [[w.value]] })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Sheets write-back failed: ${res.status}`);
  }
  return writes.length;
}

/** Column A cell reference for a 0-based row index (row 0 = A1). */
export function idCellRange(sheetName: string, rowIndex: number): string {
  return `${sheetName}!A${rowIndex + 1}`;
}
