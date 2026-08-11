import { NextRequest, NextResponse } from 'next/server';
import { confirmReportSchema } from '@/schemas/reports';
import { getReportById, confirmReport } from '@/lib/db/reports';

/**
 * POST /api/reports/:id/confirm
 * Add a community confirmation (confirm, deny, or resolved) to a report.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length < 36) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    // Validate input
    const parsed = confirmReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Check report exists
    const report = await getReportById(id);
    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Cannot confirm rejected or expired reports
    if (['rejected', 'expired'].includes(report.status)) {
      return NextResponse.json(
        { error: 'No se puede confirmar un reporte en este estado' },
        { status: 409 }
      );
    }

    await confirmReport(id, parsed.data.confirmationType);

    return NextResponse.json(
      { message: 'Confirmación registrada' },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/reports/[id]/confirm error:', error);
    return NextResponse.json(
      { error: 'Error al confirmar reporte' },
      { status: 500 }
    );
  }
}
