import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapContainer } from '@/components/map/map-container';

export default function MapPage() {
  return (
    <main className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold">Mapa de Emergencias</h1>
        <div className="flex gap-2">
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              📋 Lista
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Inicio
            </Button>
          </Link>
        </div>
      </header>

      {/* Map fills remaining space */}
      <div className="flex-1">
        <MapContainer />
      </div>
    </main>
  );
}
