import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

      {/* Map container placeholder */}
      <div className="flex flex-1 items-center justify-center bg-muted">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">🗺️</p>
          <p className="mt-2">El mapa se cargará aquí con MapLibre GL.</p>
          <p className="mt-1 text-sm">
            Requiere configuración de Supabase para mostrar reportes.
          </p>
        </div>
      </div>
    </main>
  );
}
