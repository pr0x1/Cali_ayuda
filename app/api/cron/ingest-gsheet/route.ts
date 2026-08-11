import { NextResponse } from 'next/server';
import { ingestGoogleSheet } from '@/lib/ingest/gsheet/ingest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron endpoint: ingest the community Google Sheet into reports.
 *
 * Schedule: every 30 min (configured in vercel.json).
 * Reads are cheap (one CSV GET); write-back only fires on deltas.
 *
 * AGENTS.md §15: on any failure the app keeps working — this route logs
 * safely and returns a summary; manual report creation never depends on it.
 */
export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (token !== cronSecret) {
      console.warn('[cron/ingest-gsheet] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const summary = await ingestGoogleSheet({
      sheetName: process.env.GSHEET_TAB_NAME ?? 'Sheet1',
      writeBack: true,
    });
    console.log(
      `[cron/ingest-gsheet] fetched=${summary.fetched} ingested=${summary.ingested} skipped=${summary.skipped} idsAssigned=${summary.idsAssigned} errors=${summary.errors}`
    );
    return NextResponse.json(summary);
  } catch (error) {
    console.error(
      '[cron/ingest-gsheet] failed:',
      error instanceof Error ? error.message : 'unknown error'
    );
    return NextResponse.json(
      { error: 'Ingest failed' },
      { status: 500 }
    );
  }
}
