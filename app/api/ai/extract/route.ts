import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/provider';

/**
 * POST /api/ai/extract
 * Extract structured report fields from text and/or image using AI.
 *
 * Body: { text?: string, image?: string }
 *   - text: free-text description of the situation
 *   - image: base64-encoded image (with or without data: prefix)
 *
 * Response: { data: ExtractedFields }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, image } = body as { text?: string; image?: string };

    if (!text && !image) {
      return NextResponse.json(
        { error: 'Debes proporcionar texto o una imagen' },
        { status: 400 }
      );
    }

    // Validate text length
    if (text && text.length > 5000) {
      return NextResponse.json(
        { error: 'El texto no puede exceder 5000 caracteres' },
        { status: 400 }
      );
    }

    // Validate image size (~4MB base64 limit)
    if (image && image.length > 5_500_000) {
      return NextResponse.json(
        { error: 'La imagen no puede exceder 4MB' },
        { status: 400 }
      );
    }

    const provider = await getAIProvider();
    const fields = await provider.extractReportFields(text, image);

    console.log('[/api/ai/extract] Input text:', text?.substring(0, 200));
    console.log('[/api/ai/extract] AI response:', JSON.stringify(fields, null, 2));

    return NextResponse.json({ data: fields });
  } catch (error) {
    console.error('POST /api/ai/extract error:', error);

    const message =
      error instanceof Error ? error.message : 'Error al analizar';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
