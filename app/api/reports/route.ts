import { NextRequest, NextResponse } from 'next/server';
import { createReportSchema } from '@/schemas/reports';
import { createReport, getPublicReports } from '@/lib/db/reports';
import { geocodeAddress } from '@/lib/geocoding';

/**
 * GET /api/reports
 * Fetch public reports with optional filters.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      reportType: searchParams.get('reportType') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      urgency: searchParams.get('urgency') ?? undefined,
      city: searchParams.get('city') ?? undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!, 10)
        : undefined,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!, 10)
        : undefined,
    };

    const reports = await getPublicReports(filters);

    return NextResponse.json({ data: reports, count: reports.length });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Create a new report (need, offer, or service point).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Server-side validation
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Geocode address when no GPS coordinates provided
    if (!parsed.data.lat && !parsed.data.lng && parsed.data.addressText) {
      const coords = await geocodeAddress(parsed.data.addressText, parsed.data.city);
      if (coords) {
        parsed.data.lat = coords.lat;
        parsed.data.lng = coords.lng;
      }
    }

    const report = await createReport(parsed.data);

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error('POST /api/reports error:', error);
    return NextResponse.json(
      { error: 'Error al crear reporte' },
      { status: 500 }
    );
  }
}
