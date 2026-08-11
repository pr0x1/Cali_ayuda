'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CALI_CENTER } from '@/lib/constants';

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

/**
 * Mini-map that lets users tap/click to select a location.
 * Used in the report form when GPS is not available.
 */
export function LocationPicker({ lat, lng, onLocationSelect }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [ready, setReady] = useState(false);

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
      center: [lng ?? CALI_CENTER.lng, lat ?? CALI_CENTER.lat],
      zoom: 13,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => setReady(true));

    // Handle click to place marker
    map.current.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.lngLat;
      placeMarker(clickLat, clickLng);
      onLocationSelect(clickLat, clickLng);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Place/update marker if lat/lng come from outside (e.g. GPS)
  useEffect(() => {
    if (!ready || !map.current) return;
    if (lat != null && lng != null) {
      placeMarker(lat, lng);
      map.current.flyTo({ center: [lng, lat], zoom: 15 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, ready]);

  function placeMarker(markerLat: number, markerLng: number) {
    if (!map.current) return;

    if (marker.current) {
      marker.current.setLngLat([markerLng, markerLat]);
    } else {
      marker.current = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat([markerLng, markerLat])
        .addTo(map.current);
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">
        👆 Toca el mapa para marcar la ubicación
      </p>
      <div
        ref={mapContainer}
        className="h-[300px] w-full rounded-lg border border-border overflow-hidden"
      />
    </div>
  );
}
