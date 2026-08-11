/** Citation extracted from xAI response annotations */
export interface Citation {
  url: string;
  title: string;
}

/** Parsed news response from xAI */
export interface NewsResponse {
  summary: string;
  citations: Citation[];
  fetchedAt: string;
}

/** Raw xAI Responses API output structure */
export interface XAIResponseOutput {
  id: string;
  output: Array<{
    type: string;
    role?: string;
    content?: Array<{
      type: string;
      text?: string;
      annotations?: Array<{
        type: string;
        url?: string;
        title?: string;
        start_index?: number;
        end_index?: number;
      }>;
    }>;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  status?: string;
}
