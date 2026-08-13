import type { AIProvider, ExtractedFields } from '../provider';
import { getExtractionPrompt, getUserPrompt } from '../prompt';

const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/interactions';

/**
 * Google Gemini AI provider.
 * Uses the Interactions API (latest) with structured output.
 * Supports text + image (multimodal).
 */
export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    const apiKey = process.env.AI_INTAKE_API_KEY;
    if (!apiKey) {
      throw new Error('AI_INTAKE_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
    this.model = process.env.AI_INTAKE_MODEL || 'gemini-2.0-flash';
  }

  async extractReportFields(
    text?: string,
    imageBase64?: string
  ): Promise<ExtractedFields> {
    const input: Array<Record<string, unknown>> = [];

    // System instruction as first text input
    input.push({ type: 'text', text: getExtractionPrompt() });

    // User text
    input.push({ type: 'text', text: getUserPrompt(text) });

    // Image if provided
    if (imageBase64) {
      let mimeType = 'image/jpeg';
      let cleanBase64 = imageBase64;

      if (imageBase64.startsWith('data:')) {
        const match = imageBase64.match(/^data:(image\/\w+);base64,/);
        if (match) {
          mimeType = match[1];
          cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        }
      }

      input.push({
        type: 'image',
        mime_type: mimeType,
        data: cleanBase64,
      });
    }

    const response = await fetch(GEMINI_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        model: this.model,
        input,
        response_format: [
          {
            type: 'text',
            mime_type: 'application/json',
            schema: {
              type: 'object',
              properties: {
                reportType: {
                  type: 'string',
                  enum: ['need', 'offer', 'service_point'],
                },
                category: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                urgency: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                },
                neighborhood: { type: 'string' },
                addressText: { type: 'string' },
                peopleAffected: { type: 'integer' },
                vulnerablePeople: { type: 'integer' },
                quantity: { type: 'integer' },
                quantityUnit: { type: 'string' },
                contactPhone: { type: 'string' },
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Gemini API error (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();

    // Interactions API: response is in steps[].content[].text
    const responseText = this.extractTextFromResponse(data);

    try {
      const parsed = JSON.parse(responseText) as ExtractedFields;
      return parsed;
    } catch {
      console.error(
        '[GeminiProvider] Failed to parse response JSON:',
        responseText
      );
      return {};
    }
  }

  private extractTextFromResponse(data: Record<string, unknown>): string {
    const steps = data.steps as Array<Record<string, unknown>> | undefined;
    if (!steps) return '{}';

    for (const step of steps) {
      if (step.type === 'model_output') {
        const content = step.content as Array<Record<string, unknown>> | undefined;
        if (!content) continue;
        for (const block of content) {
          if (block.type === 'text' && typeof block.text === 'string') {
            return block.text;
          }
        }
      }
    }

    return '{}';
  }
}
