import { NextRequest, NextResponse } from 'next/server';
import { updateReportSchema } from '@/schemas/reports';
import { getReportById, updateReport, toPublicReport } from '@/lib/db/reports';

/**
 * GET /api/reports/:id
 * Fetch a single public report by ID.
 */
export async function GET(
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

    // Return public-safe DTO
    return NextResponse.json({ data: toPublicReport(report) });
  } catch (error) {
    console.error('GET /api/reports/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reporte' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reports/:id
 * Update a report's fields.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length < 36) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    // Server-side validation
    const parsed = updateReportSchema.safeParse(body);
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
    const existing = await getReportById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Convert camelCase input to snake_case for DB
    const dbUpdates: Record<string, unknown> = {};
    const data = parsed.data;
    if (data.title !== undefined) dbUpdates.title = data.title;
    if (data.description !== undefined) dbUpdates.description = data.description;
    if (data.category !== undefined) dbUpdates.category = data.category;
    if (data.status !== undefined) dbUpdates.status = data.status;
    if (data.urgency !== undefined) dbUpdates.urgency = data.urgency;
    if (data.neighborhood !== undefined)
      dbUpdates.neighborhood = data.neighborhood;
    if (data.addressText !== undefined)
      dbUpdates.address_text = data.addressText;
    if (data.quantity !== undefined) dbUpdates.quantity = data.quantity;
    if (data.quantityUnit !== undefined)
      dbUpdates.quantity_unit = data.quantityUnit;
    if (data.peopleAffected !== undefined)
      dbUpdates.people_affected = data.peopleAffected;

    const updated = await updateReport(id, dbUpdates);

    return NextResponse.json({ data: toPublicReport(updated) });
  } catch (error) {
    console.error('PATCH /api/reports/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reporte' },
      { status: 500 }
    );
  }
}
