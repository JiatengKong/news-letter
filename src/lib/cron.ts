import { timingSafeEqual } from "node:crypto";
import { getStore } from "./store";
import { buildDigest } from "./digest";
import { sendDigest } from "./email";
import { computeNextCronAt, digestKeyFor } from "./schedule";
import type { CronTickResult } from "./types";

export function cronAuthorized(header: string | null, querySecret: string | null) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const provided = bearer || querySecret;
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function runCronTick(now = new Date()): Promise<CronTickResult> {
  const store = getStore();
  const due = await store.listDue(now.toISOString());
  const result: CronTickResult = {
    checkedAt: now.toISOString(),
    due: due.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const digestCache = new Map<string, Awaited<ReturnType<typeof buildDigest>>>();

  for (const subscriber of due) {
    const key = digestKeyFor(subscriber.id, now, subscriber.timezone);
    const claimed = await store.claimSend(subscriber.id, key);
    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    try {
      const cacheKey = subscriber.topics.slice().sort().join(",");
      let digest = digestCache.get(cacheKey);
      if (!digest) {
        digest = await buildDigest(subscriber.topics);
        digestCache.set(cacheKey, digest);
      }
      await sendDigest(subscriber, digest);
      const nextSendAt = computeNextCronAt(now);
      await store.markSent(subscriber.id, key, nextSendAt);
      result.sent += 1;
    } catch (error) {
      await store.releaseSend(subscriber.id, key);
      result.failed += 1;
      result.errors.push(
        `${subscriber.email}: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  return result;
}
