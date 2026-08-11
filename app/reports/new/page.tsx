import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewReportPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nuevo Reporte</h1>
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← Inicio
          </Button>
        </Link>
      </div>

      {/* Form placeholder */}
      <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
        <p>El formulario de creación de reportes se construirá aquí.</p>
        <p className="mt-2 text-sm">
          Incluirá selección de tipo, categoría, ubicación GPS, y campos según
          el tipo de reporte.
        </p>
      </div>
    </main>
  );
}
