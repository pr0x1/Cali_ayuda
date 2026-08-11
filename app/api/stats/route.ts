import { NextResponse } from 'next/server';
import { createServerAnonClient } from '@/lib/db/client';

export async function GET() {
  const supabase = createServerAnonClient();

  const [needsResult, offersResult, resolvedResult, servicePointsResult] =
    await Promise.all([
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('report_type', 'need')
        .eq('status', 'active'),
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('report_type', 'offer')
        .eq('status', 'active'),
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'resolved'),
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('report_type', 'service_point')
        .eq('status', 'active'),
    ]);

  const stats = {
    needs: needsResult.count ?? 0,
    offers: offersResult.count ?? 0,
    resolved: resolvedResult.count ?? 0,
    servicePoints: servicePointsResult.count ?? 0,
  };

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
