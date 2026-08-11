'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PublicReport } from '@/types';

/**
 * Hook to subscribe to real-time report updates via Supabase Realtime.
 * Falls back gracefully if Supabase is not configured.
 *
 * Usage:
 *   const { reports, loading } = useRealtimeReports({ reportType: 'need' });
 */
interface UseRealtimeReportsOptions {
  reportType?: string;
  category?: string;
  urgency?: string;
}

interface UseRealtimeReportsReturn {
  reports: PublicReport[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRealtimeReports(
  options: UseRealtimeReportsOptions = {}
): UseRealtimeReportsReturn {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (options.reportType) params.set('reportType', options.reportType);
      if (options.category) params.set('category', options.category);
      if (options.urgency) params.set('urgency', options.urgency);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setReports(data.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [options.reportType, options.category, options.urgency]);

  // Initial fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Supabase Realtime subscription
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;

    async function subscribe() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) return;

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        channel = supabase
          .channel('public:reports')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'reports',
            },
            () => {
              // Refetch on any change — simple and reliable
              fetchReports();
            }
          )
          .subscribe();
      } catch {
        // Realtime not available — polling fallback
      }
    }

    subscribe();

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, [fetchReports]);

  return { reports, loading, error, refresh: fetchReports };
}
