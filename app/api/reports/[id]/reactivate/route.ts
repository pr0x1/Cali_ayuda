import { NextRequest, NextResponse } from 'next/server';
import { getReportById, updateReport, toPublicReport } from '@/lib/db/reports';
import { EXPIRATION_HOURS } from '@/lib/constants';

/**
 * POST /api/reports/:id/reactivate
 * Reactivate a stale report — anyone can confirm it's still relevant.
 * Resets status to 'active' and renews expires_at.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length < 36) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const report = await getReportById(id);
    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Only stale reports can be reactivated
    if (report.status !== 'stale') {
      return NextResponse.json(
        { error: 'Solo reportes marcados como "por expirar" pueden ser reactivados' },
        { status: 409 }
      );
    }

    // Calculate new expiration based on urgency
    const hours = EXPIRATION_HOURS[report.urgency] ?? EXPIRATION_HOURS.medium;
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + hours);

    const updated = await updateReport(id, {
      status: 'active',
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ data: toPublicReport(updated) });
  } catch (error) {
    console.error('POST /api/reports/[id]/reactivate error:', error);
    return NextResponse.json(
      { error: 'Error al reactivar reporte' },
      { status: 500 }
    );
  }
}
