import type { NewsResponse, XAIResponseOutput, Citation } from '@/types/news';

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

/** Use env var if set, otherwise fall back to default */
function getNewsPrompt(): string {
  return process.env.XAI_NEWS_PROMPT || DEFAULT_NEWS_PROMPT;
}

/**
 * Fetch news from xAI using x_search tool.
 * Returns a structured NewsResponse with summary text and citations.
 */
export async function fetchXAINews(): Promise<NewsResponse> {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set');
  }

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4.5',
      input: [
        {
          role: 'user',
          content: getNewsPrompt(),
        },
      ],
      tools: [{ type: 'x_search' }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `xAI API error (${response.status}): ${errorText}`
    );
  }

  const data: XAIResponseOutput = await response.json();

  return parseXAIResponse(data);
}

/** Parse xAI response into structured NewsResponse */
function parseXAIResponse(data: XAIResponseOutput): NewsResponse {
  let summary = '';
  const citations: Citation[] = [];

  for (const output of data.output ?? []) {
    if (output.type !== 'message') continue;

    for (const content of output.content ?? []) {
      if (content.type === 'output_text' && content.text) {
        summary = content.text;

        // Extract citations from annotations
        for (const annotation of content.annotations ?? []) {
          if (annotation.type === 'url_citation' && annotation.url) {
            // Avoid duplicate URLs
            if (!citations.some((c) => c.url === annotation.url)) {
              citations.push({
                url: annotation.url,
                title: annotation.title ?? annotation.url,
              });
            }
          }
        }
      }
    }
  }

  return {
    summary,
    citations,
    fetchedAt: new Date().toISOString(),
  };
}
