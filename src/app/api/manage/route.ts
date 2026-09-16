import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { computeNextSendAt } from "@/lib/schedule";
import { clampHour, sanitizeTopics } from "@/lib/subscriber";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    token?: string;
    timezone?: string;
    sendHour?: number;
    topics?: string[];
    status?: "active" | "paused" | "unsubscribed";
  } | null;

  if (!body?.token) {
    return NextResponse.json({ error: "Missing manage token." }, { status: 400 });
  }

  const store = getStore();
  const subscriber = await store.getByToken(body.token);
  if (!subscriber) {
    return NextResponse.json({ error: "This manage link is invalid." }, { status: 404 });
  }

  const timezone = body.timezone?.trim() || subscriber.timezone;
  const sendHour = clampHour(Number(body.sendHour ?? subscriber.sendHour));
  const topics = sanitizeTopics(body.topics ?? subscriber.topics);
  const status = body.status ?? subscriber.status;
  const nextSendAt =
    status === "active"
      ? computeNextSendAt(new Date(), timezone, sendHour)
      : subscriber.nextSendAt;

  const updated = await store.update(subscriber.id, {
    timezone,
    sendHour,
    topics,
    status,
    nextSendAt,
  });

  return NextResponse.json({
    ok: true,
    status: updated.status,
    nextSendAt: updated.nextSendAt,
  });
}
