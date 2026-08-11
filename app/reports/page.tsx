import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ReportsListPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← Inicio
          </Button>
        </Link>
      </div>

      {/* Filters placeholder */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          Todos
        </Button>
        <Button variant="need" size="sm">
          Necesidades
        </Button>
        <Button variant="offer" size="sm">
          Ofertas
        </Button>
        <Button variant="service-point" size="sm">
          Puntos de ayuda
        </Button>
      </div>

      {/* List placeholder */}
      <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
        <p>Los reportes aparecerán aquí una vez conectada la base de datos.</p>
        <p className="mt-2 text-sm">
          Conecta Supabase configurando las variables de entorno.
        </p>
      </div>
    </main>
  );
}
