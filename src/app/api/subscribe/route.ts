import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import {
  CRON_UTC_HOUR,
  computeNextCronAt,
  cronLocalTime,
  digestKeyFor,
  formatLocalSend,
} from "@/lib/schedule";
import {
  isValidEmail,
  normalizeEmail,
  sanitizeTopics,
} from "@/lib/subscriber";
import { sendDigest } from "@/lib/email";
import { buildDigest } from "@/lib/digest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    timezone?: string;
    topics?: string[];
  } | null;

  if (!body?.email || !isValidEmail(body.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const now = new Date();
  const timezone = body.timezone?.trim() || "Europe/Berlin";
  const topics = sanitizeTopics(body.topics ?? ["world"]);
  const nextSendAt = computeNextCronAt(now, { skipToday: true });

  const store = getStore();
  const subscriber = await store.create({
    email: normalizeEmail(body.email),
    timezone,
    sendHour: CRON_UTC_HOUR,
    topics,
    nextSendAt,
  });

  const digest = await buildDigest(subscriber.topics);
  const localCron = cronLocalTime(timezone, now);
  const nextLabel = formatLocalSend(nextSendAt, timezone);
  const introText = `You're subscribed. Today's brief is below. The daily send is 06:00 UTC (${localCron} for you) and starts tomorrow (${nextLabel}).`;
  await sendDigest(subscriber, digest, {
    subject: `You're in · today's Daily Brief`,
    introHtml: `You're subscribed. Today's brief is below. The daily send is <strong>06:00 UTC</strong> (${escapeHtml(localCron)} for you) and starts tomorrow (${escapeHtml(nextLabel)}).`,
    introText,
  });

  const key = digestKeyFor(subscriber.id, now, timezone);
  await store.claimSend(subscriber.id, key);
  await store.markSent(subscriber.id, key, nextSendAt);

  return NextResponse.json({
    ok: true,
    manageToken: subscriber.manageToken,
    nextSendAt,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
