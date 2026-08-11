import { NextResponse } from 'next/server';
import { ingestGoogleSheet } from '@/lib/ingest/gsheet/ingest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/ingest/gsheet
 * Manual trigger for Google Sheet ingest. Guarded by CRON_SECRET.
 *
 * Body (optional): { writeBack?: boolean }
 */
export async function POST(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (token !== cronSecret) {
      console.warn('[admin/ingest/gsheet] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let writeBack = true;
  try {
    const body = (await request.json()) as { writeBack?: boolean };
    if (typeof body?.writeBack === 'boolean') writeBack = body.writeBack;
  } catch {
    // empty/no body is fine — use defaults
  }

  try {
    const summary = await ingestGoogleSheet({
      sheetName: process.env.GSHEET_TAB_NAME ?? 'Sheet1',
      writeBack,
    });
    return NextResponse.json(summary);
  } catch (error) {
    console.error(
      '[admin/ingest/gsheet] failed:',
      error instanceof Error ? error.message : 'unknown error'
    );
    return NextResponse.json({ error: 'Ingest failed' }, { status: 500 });
  }
}
