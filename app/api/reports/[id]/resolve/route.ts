import { NextRequest, NextResponse } from 'next/server';
import { getReportById, updateReport, toPublicReport } from '@/lib/db/reports';

/**
 * POST /api/reports/:id/resolve
 * Mark a report as resolved.
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

    // Check report exists
    const report = await getReportById(id);
    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Only active, matched, or in_progress reports can be resolved
    const resolvableStatuses = ['active', 'matched', 'in_progress'];
    if (!resolvableStatuses.includes(report.status)) {
      return NextResponse.json(
        { error: 'Este reporte no puede ser marcado como resuelto' },
        { status: 409 }
      );
    }

    const updated = await updateReport(id, { status: 'resolved' });

    return NextResponse.json({ data: toPublicReport(updated) });
  } catch (error) {
    console.error('POST /api/reports/[id]/resolve error:', error);
    return NextResponse.json(
      { error: 'Error al resolver reporte' },
      { status: 500 }
    );
  }
}
