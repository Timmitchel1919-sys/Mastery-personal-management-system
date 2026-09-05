import { defineSecret } from "firebase-functions/params";
import { createAnthropicProvider } from "./anthropic-provider";
import type { AiProvider } from "./ai-provider";

/** Bound onto every AI callable via its `secrets` option; never read outside a request. */
export const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

let cached: AiProvider | null = null;

/** Lazily builds the real provider from the bound secret. Not used in tests — see `AiHandlerDeps`. */
export function getAiProvider(): AiProvider {
  if (!cached) {
    cached = createAnthropicProvider(ANTHROPIC_API_KEY.value());
  }
  return cached;
}
