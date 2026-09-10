import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  // Present and "1" on Vercel. Used only to decide whether the platform can be
  // trusted to supply the request host.
  VERCEL: z.string().optional(),
  AWS_REGION: z.string().min(1).default("us-east-1"),
  BEDROCK_EMBED_MODEL_ID: z.string().min(1).default("amazon.titan-embed-text-v2:0"),
  BEDROCK_CHAT_MODEL_ID: z.string().min(1).default("amazon.nova-lite-v1:0"),
  // Optional. Without it the cron door on /api/v1/ops/* is simply closed.
  CRON_SECRET: z.string().min(16).optional(),
});

/**
 * Outside Vercel, a production deployment must pin its own origin.
 *
 * Auth.js is told to trust the forwarded host only when the platform sets it
 * (Vercel) or when AUTH_URL fixes it explicitly. Behind any other proxy an
 * attacker-controlled Host header could otherwise steer callback and redirect
 * URLs, so refuse to boot rather than trust it silently.
 */
const envSchema = baseSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV === "production" && !env.VERCEL && !env.AUTH_URL) {
    ctx.addIssue({
      code: "custom",
      path: ["AUTH_URL"],
      message:
        "AUTH_URL is required in production outside Vercel, so the host header is never trusted blindly",
    });
  }
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    // Report which variables are wrong, never their values — this message
    // reaches logs.
    const fields = parsed.error.issues
      .map((issue) => issue.path.join(".") || "(root)")
      .join(", ");
    throw new Error(`Invalid environment: check ${fields}`);
  }
  return parsed.data;
}

/** Lazy singleton for server runtime */
let cached: Env | null = null;
export function env(): Env {
  if (!cached) cached = loadEnv();
  return cached;
}

/** True only where the platform, not the client, decides the request host. */
export function shouldTrustHost(source: NodeJS.ProcessEnv = process.env): boolean {
  if (source.VERCEL === "1") return true;
  if (source.NODE_ENV !== "production") return true;
  return Boolean(source.AUTH_URL);
}
