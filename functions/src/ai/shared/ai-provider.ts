export interface AiCompletionInput {
  system: string;
  prompt: string;
  maxOutputTokens: number;
}

export interface AiCompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * The swappable AI backend. Endpoints depend only on this interface, never on a vendor
 * SDK — the concrete provider (and its secret) can change without touching any endpoint.
 * See `anthropic-provider.ts` for the current implementation.
 */
export interface AiProvider {
  complete(input: AiCompletionInput): Promise<AiCompletionResult>;
}
