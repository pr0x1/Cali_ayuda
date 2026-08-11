import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { ReportCard } from '@/components/reports/report-card';
import { ReportFilters } from '@/components/reports/report-filters';
import { getPublicReports } from '@/lib/db/reports';
import type { PublicReport } from '@/types';

interface Props {
  searchParams: Promise<{
    reportType?: string;
    category?: string;
    urgency?: string;
  }>;
}

async function fetchReports(filters: {
  reportType?: string;
  category?: string;
  urgency?: string;
}): Promise<PublicReport[]> {
  try {
    return await getPublicReports({
      reportType: filters.reportType,
      category: filters.category,
      urgency: filters.urgency,
    });
  } catch {
    return [];
  }
}

async function ReportsList({
  filters,
}: {
  filters: { reportType?: string; category?: string; urgency?: string };
}) {
  const reports = await fetchReports(filters);

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
        <p className="text-lg">📭</p>
        <p className="mt-2">No hay reportes que coincidan con los filtros.</p>
        <p className="mt-1 text-sm">
          Sé el primero en crear un reporte o ajusta los filtros.
        </p>
        <Link href="/reports/new" className="mt-4 inline-block">
          <Button variant="default" size="sm">
            + Crear reporte
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {reports.length} reporte{reports.length !== 1 ? 's' : ''} encontrado
        {reports.length !== 1 ? 's' : ''}
      </p>
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

export default async function ReportsListPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = {
    reportType: params.reportType,
    category: params.category,
    urgency: params.urgency,
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          <Link href="/reports/new">
            <Button variant="default" size="sm">
              + Nuevo
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Inicio
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={null}>
        <ReportFilters />
      </Suspense>

      <div className="mt-4">
        <Suspense
          fallback={
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl border border-border bg-card"
                />
              ))}
            </div>
          }
        >
          <ReportsList filters={filters} />
        </Suspense>
      </div>
    </main>
  );
}
