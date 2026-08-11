import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReportForm } from '@/components/reports/report-form';
import type { ReportType } from '@/types';

interface Props {
  searchParams: Promise<{ type?: string }>;
}

const VALID_TYPES: ReportType[] = ['need', 'offer', 'service_point'];

export default async function NewReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawType = params.type ?? 'need';
  const initialType: ReportType = VALID_TYPES.includes(rawType as ReportType)
    ? (rawType as ReportType)
    : 'need';

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

      <ReportForm initialType={initialType} />
    </main>
  );
}
