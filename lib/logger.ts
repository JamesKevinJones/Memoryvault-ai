/**
 * A deliberately small logging seam.
 *
 * The point is not the format — it is that failures stop vanishing. Several
 * paths in this app used a bare `catch {}`, so an embedding that never landed
 * or a chat stream that died mid-token left no trace anywhere except a missing
 * row. Anything that swallows an error should say so here.
 *
 * Never pass raw user content or secrets: these lines go to platform logs.
 */
type Fields = Record<string, unknown>;

function emit(level: "warn" | "error", message: string, fields?: Fields) {
  const line = { level, message, ...fields, at: new Date().toISOString() };
  if (level === "error") console.error(JSON.stringify(line));
  else console.warn(JSON.stringify(line));
}

export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 500);
  return "unknown error";
}

export const logger = {
  warn: (message: string, fields?: Fields) => emit("warn", message, fields),
  error: (message: string, fields?: Fields) => emit("error", message, fields),
};
