import Anthropic from "@anthropic-ai/sdk";
import type { AiCompletionInput, AiCompletionResult, AiProvider } from "./ai-provider";

/** Kept as a named constant so swapping models is a one-line change. */
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";

export function createAnthropicProvider(
  apiKey: string,
  model = DEFAULT_ANTHROPIC_MODEL,
): AiProvider {
  const client = new Anthropic({ apiKey });

  return {
    async complete({
      system,
      prompt,
      maxOutputTokens,
    }: AiCompletionInput): Promise<AiCompletionResult> {
      const response = await client.messages.create({
        model,
        max_tokens: maxOutputTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      return {
        text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    },
  };
}
