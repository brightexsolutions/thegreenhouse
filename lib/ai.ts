import { logger } from "@/lib/logger";

/**
 * Gemini text generation for the admin blog editor.
 *
 * Only one provider is configured on this project, so the fallback is across
 * models rather than vendors: if the preferred model is rate limited or has
 * been retired, the next one is tried before the call is reported as failed.
 * A missing key is never treated as a silent success. The caller gets an
 * explicit failure so the editor can say so instead of pretending.
 */

// Google retires model ids without much notice, so this is a ladder rather
// than a single name. Verified against the live key on 2026-08-20:
// the 2.0 and 1.5 lines 404, and 2.5-flash-lite now refuses new callers with
// a message pointing at the 3.x line. If every entry here starts failing,
// list the current ids with:
//   GET https://generativelanguage.googleapis.com/v1beta/models?key=...
const MODELS = [
  "gemini-3.5-flash",   // current generation, ~1s on short prompts
  "gemini-2.5-flash",   // proven fallback, still fast
  "gemini-3.6-flash",   // last resort if the first two are saturated
] as const;

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** stride-app and brightex-website name this key differently. Accept both so
 *  the same value can be pasted into any Brightex project's environment. */
function apiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GEMINI_FREE_API_KEY;
}

export function isAiConfigured(): boolean {
  return Boolean(apiKey());
}

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

interface GenerateOptions {
  system:      string;
  prompt:      string;
  maxTokens?:  number;
  temperature?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?:      { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string };
}

/** Should we try the next model, or give up? */
function isRetryable(status: number): boolean {
  // 429 rate limit, 404 retired model, 5xx upstream trouble.
  return status === 429 || status === 404 || status >= 500;
}

export async function generateText(opts: GenerateOptions): Promise<string> {
  const key = apiKey();
  if (!key) {
    throw new AiUnavailableError(
      "AI is not configured. Add GEMINI_API_KEY to the environment to enable it."
    );
  }

  let lastError = "No model responded.";

  for (const model of MODELS) {
    try {
      const res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
          generationConfig: {
            temperature:     opts.temperature ?? 0.7,
            maxOutputTokens: opts.maxTokens ?? 4096,
            // On the 3.x line, reasoning tokens are billed against
            // maxOutputTokens. Leaving it on silently ate most of the budget
            // and returned blog drafts cut off mid-sentence. These are writing
            // tasks with explicit instructions, not reasoning problems, so the
            // whole budget goes to the text.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        // Keep the admin waiting for a bounded time rather than a hung request.
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as GeminiResponse;
        lastError = body.error?.message ?? `Gemini returned ${res.status}.`;
        logger.warn("ai_model_failed", { model, status: res.status, error: lastError });
        if (isRetryable(res.status)) continue;
        throw new AiUnavailableError(lastError);
      }

      const body = (await res.json()) as GeminiResponse;
      const candidate = body.candidates?.[0];
      const text = candidate?.content?.parts?.map(p => p.text ?? "").join("").trim();

      if (!text) {
        lastError = "The model returned an empty response.";
        logger.warn("ai_empty_response", { model, finish: candidate?.finishReason });
        continue;
      }

      // A truncated draft looks like a finished one until you read the last
      // line. Say so rather than handing back half a post.
      if (candidate?.finishReason === "MAX_TOKENS") {
        lastError = "The response was cut off before it finished. Try a shorter brief.";
        logger.warn("ai_truncated", { model, chars: text.length });
        continue;
      }

      logger.info("ai_generated", { model, chars: text.length });
      return text;
    } catch (err) {
      if (err instanceof AiUnavailableError) throw err;
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn("ai_model_error", { model, error: lastError });
    }
  }

  throw new AiUnavailableError(lastError);
}

/** Strip a fenced code block wrapper the model sometimes adds around output. */
export function unfence(text: string): string {
  return text
    .replace(/^\s*```(?:markdown|md|json|html)?\s*\n/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}
