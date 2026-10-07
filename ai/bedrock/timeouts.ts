/**
 * Every Bedrock call gets a deadline.
 *
 * Without one, a hung upstream call holds a serverless invocation — and, for
 * chat, an open SSE response — until the platform's own timeout kills it,
 * which is both slower and less legible than failing on our terms.
 *
 * Note the limit on the streaming case: the signal bounds establishing the
 * stream, not the total time spent consuming it. Per-token stalls after the
 * first byte are a separate problem and are not solved here.
 */
export const BEDROCK_TIMEOUT_MS = {
  embed: 15_000,
  generate: 60_000,
} as const;

export function bedrockAbort(kind: keyof typeof BEDROCK_TIMEOUT_MS) {
  return { abortSignal: AbortSignal.timeout(BEDROCK_TIMEOUT_MS[kind]) };
}
