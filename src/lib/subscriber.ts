import { nanoid } from "nanoid";
import type { SubscribeInput, Subscriber, TopicId } from "./types";
import { TOPICS } from "./types";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function clampHour(hour: number) {
  if (!Number.isFinite(hour)) return 8;
  return Math.min(23, Math.max(0, Math.round(hour)));
}

export function sanitizeTopics(topics: string[]): TopicId[] {
  const allowed = new Set(TOPICS.map((t) => t.id));
  const next = topics.filter((t): t is TopicId => allowed.has(t as TopicId));
  return next.length ? Array.from(new Set(next)) : ["world"];
}

export function newSubscriber(
  input: SubscribeInput & { nextSendAt: string },
  token = nanoid(21),
): Subscriber {
  const now = new Date().toISOString();
  return {
    id: nanoid(16),
    email: normalizeEmail(input.email),
    status: "active",
    timezone: input.timezone,
    sendHour: clampHour(input.sendHour),
    topics: sanitizeTopics(input.topics),
    manageToken: token,
    nextSendAt: input.nextSendAt,
    lastSentAt: null,
    lastDigestKey: null,
    createdAt: now,
    updatedAt: now,
  };
}
