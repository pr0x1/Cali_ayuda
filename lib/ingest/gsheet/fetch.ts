/** Fetch the public CSV export of a Google Sheet. No credentials required. */
import { csvExportUrl } from './config';

export async function fetchSheetCsv(
  spreadsheetId: string,
  gid: string
): Promise<string> {
  const url = csvExportUrl(spreadsheetId, gid);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet CSV: ${res.status}`);
  }
  return res.text();
}
