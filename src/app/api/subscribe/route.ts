import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { computeNextSendAt } from "@/lib/schedule";
import {
  clampHour,
  isValidEmail,
  normalizeEmail,
  sanitizeTopics,
} from "@/lib/subscriber";
import { sendDigest } from "@/lib/email";
import { buildDigest } from "@/lib/digest";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    timezone?: string;
    sendHour?: number;
    topics?: string[];
    sendNow?: boolean;
  } | null;

  if (!body?.email || !isValidEmail(body.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const timezone = body.timezone?.trim() || "Europe/Berlin";
  const sendHour = clampHour(Number(body.sendHour ?? 8));
  const topics = sanitizeTopics(body.topics ?? ["world"]);
  const nextSendAt = computeNextSendAt(new Date(), timezone, sendHour);

  const store = getStore();
  const subscriber = await store.create({
    email: normalizeEmail(body.email),
    timezone,
    sendHour,
    topics,
    nextSendAt,
  });

  if (body.sendNow) {
    const digest = await buildDigest(subscriber.topics);
    await sendDigest(subscriber, digest);
  }

  return NextResponse.json({
    ok: true,
    manageToken: subscriber.manageToken,
    nextSendAt: subscriber.nextSendAt,
  });
}
