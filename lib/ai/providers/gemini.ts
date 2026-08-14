import type { AIProvider, ExtractedFields } from '../provider';
import { getExtractionPrompt, getUserPrompt } from '../prompt';

const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Google Gemini AI provider.
 * Compatible con modelos Gemini 3.1+ utilizando generateContent y responseSchema.
 * Soporta texto e imágenes (multimodal).
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
    const parts: Array<Record<string, unknown>> = [];

    // User text prompt
    const userTextPrompt = getUserPrompt(text);
    if (userTextPrompt) {
      parts.push({ text: userTextPrompt });
    }

    // Image (base64)
    if (imageBase64) {
      let mimeType = 'image/jpeg';
      let cleanBase64 = imageBase64;

      if (imageBase64.startsWith('data:')) {
        const match = imageBase64.match(/^data:(image\/[^;]+);base64,/);
        if (match) {
          mimeType = match[1];
          cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        }
      }

      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    const url = `${GEMINI_API_BASE}/${this.model}:generateContent?key=${this.apiKey}`;

    const requestBody: Record<string, unknown> = {
      systemInstruction: {
        parts: [{ text: getExtractionPrompt() }],
      },
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.0,
        responseSchema: {
          type: 'OBJECT',
          properties: {
            isValid: {
              type: 'BOOLEAN',
              description: 'true si el texto describe una situación real de emergencia, necesidad, oferta de ayuda o punto de servicio. false si es spam, consultas no relacionadas, o contenido que no tiene que ver con emergencias.',
            },
            rejectionReason: {
              type: 'STRING',
              description: 'Si isValid es false, explica brevemente por qué no es un reporte válido. Si isValid es true, dejar vacío.',
            },
            reportType: {
              type: 'STRING',
              enum: ['need', 'offer', 'service_point'],
              description: 'Tipo de reporte',
            },
            category: {
              type: 'STRING',
              description: 'Categoría del reporte',
            },
            title: {
              type: 'STRING',
              description: 'Título corto del reporte',
            },
            description: {
              type: 'STRING',
              description: 'Descripción detallada',
            },
            urgency: {
              type: 'STRING',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Nivel de urgencia',
            },
            neighborhood: {
              type: 'STRING',
              description: 'Barrio, sector o edificio',
            },
            addressText: {
              type: 'STRING',
              description: 'Dirección o referencia',
            },
            peopleAffected: {
              type: 'INTEGER',
              description: 'Número de personas afectadas',
            },
            vulnerablePeople: {
              type: 'INTEGER',
              description: 'Personas vulnerables (niños, adultos mayores, discapacidad)',
            },
            quantity: {
              type: 'INTEGER',
              description: 'Cantidad disponible (ofertas) o solicitada',
            },
            quantityUnit: {
              type: 'STRING',
              description: 'Unidad de cantidad',
            },
            contactName: {
              type: 'STRING',
              description: 'Nombre de contacto',
            },
            contactPhone: {
              type: 'STRING',
              description: 'Teléfono de contacto',
            },
          },
          required: [
            'isValid',
            'rejectionReason',
            'reportType',
            'category',
            'title',
            'description',
            'urgency',
            'neighborhood',
            'addressText',
            'peopleAffected',
            'vulnerablePeople',
            'quantity',
            'quantityUnit',
            'contactName',
            'contactPhone',
          ],
        },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Gemini API error (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();

    console.log('[GeminiProvider] Raw API response:', JSON.stringify(data, null, 2));

    // Extract the JSON text part, ignoring thought parts
    const candidateParts = data?.candidates?.[0]?.content?.parts || [];
    const jsonPart = candidateParts.find(
      (p: { text?: string; thought?: boolean }) => p.text && !p.thought
    );

    const responseText = jsonPart?.text ?? candidateParts[0]?.text ?? '{}';

    console.log('[GeminiProvider] Extracted text:', responseText);

    try {
      const parsed = JSON.parse(responseText) as Record<string, unknown>;

      // Check if AI determined this is not a valid emergency report
      if (parsed.isValid === false) {
        return {
          _invalid: true,
          _rejectionReason: (parsed.rejectionReason as string) || 'El contenido no parece ser una situación de emergencia.',
        } as unknown as ExtractedFields;
      }

      // Filter out empty/zero values that the model returns for required fields it has no data for
      const cleaned: ExtractedFields = {};
      if (parsed.reportType) cleaned.reportType = parsed.reportType as ExtractedFields['reportType'];
      if (parsed.category && parsed.category !== '') cleaned.category = parsed.category as string;
      if (parsed.title && parsed.title !== '') cleaned.title = parsed.title as string;
      if (parsed.description && parsed.description !== '') cleaned.description = parsed.description as string;
      if (parsed.urgency) cleaned.urgency = parsed.urgency as ExtractedFields['urgency'];
      if (parsed.neighborhood && parsed.neighborhood !== '') cleaned.neighborhood = parsed.neighborhood as string;
      if (parsed.addressText && parsed.addressText !== '') cleaned.addressText = parsed.addressText as string;
      if (parsed.peopleAffected && (parsed.peopleAffected as number) > 0) cleaned.peopleAffected = parsed.peopleAffected as number;
      if (parsed.vulnerablePeople && (parsed.vulnerablePeople as number) > 0) cleaned.vulnerablePeople = parsed.vulnerablePeople as number;
      if (parsed.quantity && (parsed.quantity as number) > 0) cleaned.quantity = parsed.quantity as number;
      if (parsed.quantityUnit && parsed.quantityUnit !== '') cleaned.quantityUnit = parsed.quantityUnit as string;
      if (parsed.contactName && parsed.contactName !== '') cleaned.contactName = parsed.contactName as string;
      if (parsed.contactPhone && parsed.contactPhone !== '') cleaned.contactPhone = parsed.contactPhone as string;

      return cleaned;
    } catch (err) {
      console.error(
        '[GeminiProvider] Failed to parse response JSON:',
        responseText,
        err
      );
      return {};
    }
  }
}
