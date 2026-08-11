'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import type { PublicReport } from '@/types';

// Dynamic import for MapView — no SSR (MapLibre needs window/document)
const MapView = dynamic(
  () => import('./map-view').then((mod) => ({ default: mod.MapView })),
  { ssr: false, loading: () => <MapLoading /> }
);

function MapLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-muted">
      <div className="text-center text-muted-foreground">
        <p className="text-lg">🗺️</p>
        <p className="mt-2">Cargando mapa...</p>
      </div>
    </div>
  );
}

interface MapContainerProps {
  initialFilter?: string;
}

export function MapContainer({ initialFilter }: MapContainerProps) {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [filter, setFilter] = useState(initialFilter ?? '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter) params.set('reportType', filter);
        const res = await fetch(`/api/reports?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setReports(data.data ?? []);
        }
      } catch {
        // Silently fail if API not available
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [filter]);

  return (
    <div className="flex h-full flex-col">
      {/* Filter bar */}
      <div className="flex gap-2 border-b border-border px-4 py-2">
        <Button
          variant={!filter ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('')}
        >
          Todos
        </Button>
        <Button
          variant={filter === 'need' ? 'need' : 'outline'}
          size="sm"
          onClick={() => setFilter('need')}
        >
          🆘
        </Button>
        <Button
          variant={filter === 'offer' ? 'offer' : 'outline'}
          size="sm"
          onClick={() => setFilter('offer')}
        >
          🤝
        </Button>
        <Button
          variant={filter === 'service_point' ? 'service-point' : 'outline'}
          size="sm"
          onClick={() => setFilter('service_point')}
        >
          📍
        </Button>
        {loading && (
          <span className="flex items-center text-xs text-muted-foreground">
            cargando...
          </span>
        )}
        {!loading && (
          <span className="flex items-center text-xs text-muted-foreground">
            {reports.length} reporte{reports.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView reports={reports} />
      </div>
    </div>
  );
}
