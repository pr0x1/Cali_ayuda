import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmButtons } from '@/components/reports/confirm-buttons';
import {
  timeAgo,
  formatCategory,
  formatUrgency,
  formatReportType,
  reportTypeBadgeVariant,
  urgencyBadgeVariant,
} from '@/lib/format';
import type { PublicReport } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchReport(id: string): Promise<PublicReport | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/reports/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const report = await fetchReport(id);

  if (!report) {
    notFound();
  }

  const typeInfo = formatReportType(report.reportType);
  const urgencyInfo = formatUrgency(report.urgency);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/reports">
          <Button variant="ghost" size="sm">
            ← Reportes
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm">
            Inicio
          </Button>
        </Link>
      </div>

      {/* Main card */}
      <Card>
        <CardHeader>
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={reportTypeBadgeVariant(report.reportType)}>
              {typeInfo.emoji} {typeInfo.label}
            </Badge>
            <Badge variant={urgencyBadgeVariant(report.urgency)}>
              {urgencyInfo.emoji} {urgencyInfo.label}
            </Badge>
            <Badge variant="outline">{formatCategory(report.category)}</Badge>
            {report.status !== 'active' && (
              <Badge variant="secondary">{report.status}</Badge>
            )}
          </div>

          <CardTitle className="mt-2 text-xl">{report.title}</CardTitle>

          {/* Timestamp */}
          <p className="text-sm text-muted-foreground">
            Publicado {timeAgo(report.createdAt)}
            {report.expiresAt && (
              <span className="ml-2">
                · Expira {timeAgo(report.expiresAt)}
              </span>
            )}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          {report.description && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                Descripción
              </h3>
              <p className="whitespace-pre-wrap text-sm">{report.description}</p>
            </div>
          )}

          {/* Location */}
          {(report.neighborhood || report.publicLat) && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                Ubicación
              </h3>
              <div className="space-y-1 text-sm">
                {report.neighborhood && (
                  <p>📍 {report.neighborhood}, {report.city}</p>
                )}
                {report.publicLat && report.publicLng && (
                  <p className="text-xs text-muted-foreground">
                    Coordenadas aproximadas (±150m por privacidad)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {report.peopleAffected && (
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-lg font-bold">{report.peopleAffected}</p>
                <p className="text-xs text-muted-foreground">
                  Personas afectadas
                </p>
              </div>
            )}
            {report.quantity && (
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-lg font-bold">
                  {report.quantity} {report.quantityUnit || ''}
                </p>
                <p className="text-xs text-muted-foreground">Cantidad</p>
              </div>
            )}
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-lg font-bold text-offer">
                {report.confirmationCount}
              </p>
              <p className="text-xs text-muted-foreground">Confirmaciones</p>
            </div>
          </div>

          {/* Verification */}
          {report.verificationStatus !== 'unverified' && (
            <div className="rounded-lg border border-offer/30 bg-offer/5 p-3">
              <p className="text-sm">
                {report.verificationStatus === 'community_verified'
                  ? '✅ Verificado por la comunidad'
                  : report.verificationStatus === 'official'
                    ? '🏛️ Verificado oficialmente'
                    : ''}
              </p>
            </div>
          )}

          {/* Community confirmation */}
          {report.status === 'active' && (
            <div className="border-t border-border pt-4">
              <ConfirmButtons
                reportId={report.id}
                currentCount={report.confirmationCount}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
