'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Stats {
  needs: number;
  offers: number;
  resolved: number;
  servicePoints: number;
}

export default function StatsDisplay() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data: Stats = await res.json();
        if (isMounted) {
          setStats(data);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    const interval = setInterval(fetchStats, 30_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <Card className="mt-8 w-full max-w-md">
        <CardContent className="grid grid-cols-3 gap-4 p-6 text-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="mx-auto h-8 w-12 animate-pulse rounded bg-muted" />
              <div className="mx-auto h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 w-full max-w-md">
      <CardContent className="grid grid-cols-3 gap-4 p-6 text-center">
        <div>
          <div className="text-2xl font-bold text-need">
            {stats?.needs ?? 0}
          </div>
          <div className="text-xs text-muted-foreground">
            Necesidades activas
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-offer">
            {stats?.offers ?? 0}
          </div>
          <div className="text-xs text-muted-foreground">
            Recursos disponibles
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-success">
            {stats?.resolved ?? 0}
          </div>
          <div className="text-xs text-muted-foreground">
            Casos resueltos
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
