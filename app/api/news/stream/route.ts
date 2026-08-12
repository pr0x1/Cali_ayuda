import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const XAI_API_URL = 'https://api.x.ai/v1/responses';

const DEFAULT_NEWS_PROMPT = `Dame las noticias más recientes sobre el terremoto en Cali, Colombia.
Incluye información de la Alcaldía de Cali (@AlcaldiaDeCali) y fuentes oficiales.
Resume los puntos clave de las últimas horas en español.
Organiza la información por relevancia:
1. Alertas y emergencias activas
2. Lugares que NECESITAN ayuda urgente (barrios, direcciones específicas)
3. Lugares que YA NO necesitan ayuda o ya fueron atendidos
4. Ayuda disponible (centros de acopio, albergues, puntos de distribución)
5. Situación general
Sé conciso y directo. Incluye direcciones y barrios cuando estén disponibles.`;

function getNewsPrompt(): string {
  return process.env.XAI_NEWS_PROMPT || DEFAULT_NEWS_PROMPT;
}

/**
 * GET /api/news/stream
 * Streams the xAI response as Server-Sent Events to the client.
 * The client sees text appearing in real-time.
 */
export async function GET(): Promise<Response> {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'XAI_API_KEY not configured' },
      { status: 500 }
    );
  }

  const xaiResponse = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4.20-0309-reasoning',
      stream: true,
      input: [
        {
          role: 'user',
          content: getNewsPrompt(),
        },
      ],
      tools: [{ type: 'x_search' }],
    }),
  });

  if (!xaiResponse.ok) {
    const errorText = await xaiResponse.text().catch(() => 'Unknown error');
    return NextResponse.json(
      { error: `xAI API error: ${errorText}` },
      { status: 502 }
    );
  }

  // Create a ReadableStream that forwards relevant SSE events to the client
  const encoder = new TextEncoder();
  const reader = xaiResponse.body?.getReader();

  if (!reader) {
    return NextResponse.json(
      { error: 'No response body from xAI' },
      { status: 502 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              // Forward text deltas to the client
              if (event.type === 'output_text.delta' && event.delta) {
                const sseMessage = `data: ${JSON.stringify({ type: 'text', content: event.delta })}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));
              }

              // Forward citations from response.completed
              if (event.type === 'response.completed' && event.response) {
                const citations = extractCitations(event.response);
                if (citations.length > 0) {
                  const sseMessage = `data: ${JSON.stringify({ type: 'citations', citations })}\n\n`;
                  controller.enqueue(encoder.encode(sseMessage));
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        // Signal stream end
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Stream error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/** Extract citations from the completed response object */
function extractCitations(response: Record<string, unknown>): Array<{ url: string; title: string }> {
  const citations: Array<{ url: string; title: string }> = [];
  const output = response.output as Array<Record<string, unknown>> | undefined;

  for (const item of output ?? []) {
    if (item.type !== 'message') continue;
    const content = item.content as Array<Record<string, unknown>> | undefined;

    for (const block of content ?? []) {
      if (block.type !== 'output_text') continue;
      const annotations = block.annotations as Array<Record<string, unknown>> | undefined;

      for (const annotation of annotations ?? []) {
        if (annotation.type === 'url_citation' && annotation.url) {
          const url = annotation.url as string;
          if (!citations.some((c) => c.url === url)) {
            citations.push({
              url,
              title: (annotation.title as string) ?? url,
            });
          }
        }
      }
    }
  }

  return citations;
}
