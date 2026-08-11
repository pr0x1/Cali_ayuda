'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CALI_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';
import type { PublicReport } from '@/types';

interface MapViewProps {
  reports?: PublicReport[];
  onMarkerClick?: (report: PublicReport) => void;
}

const TYPE_COLORS: Record<string, string> = {
  need: '#ef4444',
  offer: '#22c55e',
  service_point: '#3b82f6',
};

const TYPE_EMOJI: Record<string, string> = {
  need: '🆘',
  offer: '🤝',
  service_point: '📍',
};

export function MapView({ reports = [], onMarkerClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [CALI_CENTER.lng, CALI_CENTER.lat],
      zoom: DEFAULT_MAP_ZOOM,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );

    map.current.on('load', () => setLoaded(true));

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when reports change
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    reports.forEach((report) => {
      if (report.publicLat == null || report.publicLng == null) return;

      const color = TYPE_COLORS[report.reportType] || '#888';
      const emoji = TYPE_EMOJI[report.reportType] || '📌';

      // Create marker element
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `;
      el.textContent = emoji;

      // Create popup
      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(`
        <div style="padding: 4px 8px; max-width: 200px;">
          <strong style="font-size: 13px;">${report.title}</strong>
          ${report.neighborhood ? `<br><span style="font-size: 11px; color: #666;">📍 ${report.neighborhood}</span>` : ''}
          <br><a href="/reports/${report.id}" style="font-size: 11px; color: #3b82f6;">Ver detalle →</a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.publicLng, report.publicLat])
        .setPopup(popup)
        .addTo(map.current!);

      if (onMarkerClick) {
        el.addEventListener('click', () => onMarkerClick(report));
      }

      markersRef.current.push(marker);
    });
  }, [reports, loaded, onMarkerClick]);

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}
