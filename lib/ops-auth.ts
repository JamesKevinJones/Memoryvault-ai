import { timingSafeEqual } from "node:crypto";

/**
 * Ops endpoints have two legitimate callers with very different blast radii:
 *
 *  - the scheduled cron job, which must sweep every workspace, and
 *  - a signed-in user, who may only ever touch their own.
 *
 * `CRON_SECRET` distinguishes them. It is optional: with no secret configured
 * the cron door is simply closed, which is the safe default rather than a
 * silent bypass.
 */
export function isTrustedCronRequest(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length < 16) return false;

  const header = req.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (presented.length === 0) return false;

  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
