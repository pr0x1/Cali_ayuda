/**
 * AI Provider abstraction for report field extraction.
 * Supports multiple backends (Gemini, OpenAI, etc.) via env config.
 */

export interface ExtractedFields {
  reportType?: 'need' | 'offer' | 'service_point';
  category?: string;
  title?: string;
  description?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  neighborhood?: string;
  addressText?: string;
  peopleAffected?: number;
  vulnerablePeople?: number;
  quantity?: number;
  quantityUnit?: string;
  contactPhone?: string;
}

export interface AIProvider {
  /**
   * Extract structured report fields from user text and/or image.
   * @param text - User's free-text description
   * @param imageBase64 - Optional base64-encoded image (JPEG/PNG)
   */
  extractReportFields(
    text?: string,
    imageBase64?: string
  ): Promise<ExtractedFields>;
}

export type ProviderName = 'gemini' | 'openai' | 'xai';

/**
 * Factory: returns the configured AI provider.
 * Config via env vars:
 *   AI_INTAKE_PROVIDER = gemini (default)
 *   AI_INTAKE_API_KEY = your API key
 *   AI_INTAKE_MODEL = model name (provider-specific default if omitted)
 */
export async function getAIProvider(): Promise<AIProvider> {
  const providerName =
    (process.env.AI_INTAKE_PROVIDER as ProviderName) || 'gemini';

  switch (providerName) {
    case 'gemini': {
      const { GeminiProvider } = await import('./providers/gemini');
      return new GeminiProvider();
    }
    // Future providers:
    // case 'openai': { ... }
    // case 'xai': { ... }
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }
}
