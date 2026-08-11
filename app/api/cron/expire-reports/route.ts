import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron endpoint to mark stale and expired reports.
 *
 * Schedule: every 15 minutes (configured in vercel.json)
 *
 * Flow:
 *  1. Active reports past their expires_at -> marked 'stale'
 *  2. Stale reports that have been stale for >24 hours -> marked 'expired'
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // --- Auth check ---
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (token !== cronSecret) {
        console.warn('[cron/expire-reports] Unauthorized request');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const supabase = createServerClient();
    const now = new Date().toISOString();

    // --- Step A: Mark active reports as stale ---
    const { data: staleData, error: staleError } = await supabase
      .from('reports')
      .update({ status: 'stale', updated_at: now })
      .eq('status', 'active')
      .lt('expires_at', now)
      .select('id');

    if (staleError) {
      console.error('[cron/expire-reports] Error marking stale:', staleError);
      return NextResponse.json(
        { error: 'Failed to mark stale reports', details: staleError.message },
        { status: 500 }
      );
    }

    const staleCount = staleData?.length ?? 0;

    // --- Step B: Mark stale reports as expired (stale > 24h) ---
    const expiredCutoff = new Date();
    expiredCutoff.setHours(expiredCutoff.getHours() - 24);

    const { data: expiredData, error: expiredError } = await supabase
      .from('reports')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'stale')
      .lt('expires_at', expiredCutoff.toISOString())
      .select('id');

    if (expiredError) {
      console.error('[cron/expire-reports] Error marking expired:', expiredError);
      return NextResponse.json(
        { error: 'Failed to mark expired reports', details: expiredError.message },
        { status: 500 }
      );
    }

    const expiredCount = expiredData?.length ?? 0;

    const timestamp = new Date().toISOString();

    console.log(
      `[cron/expire-reports] Completed: ${staleCount} marked stale, ${expiredCount} marked expired at ${timestamp}`
    );

    return NextResponse.json({
      staleCount,
      expiredCount,
      timestamp,
    });
  } catch (error) {
    console.error('[cron/expire-reports] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
