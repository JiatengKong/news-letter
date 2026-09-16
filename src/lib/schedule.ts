import { DateTime } from "luxon";

/** Vercel Hobby can run only one cron per day. This is that slot. */
export const CRON_UTC_HOUR = 6;

export function computeNextCronAt(
  from: Date,
  options?: { skipToday?: boolean },
): string {
  const now = DateTime.fromJSDate(from, { zone: "UTC" });
  let next = now.set({
    hour: CRON_UTC_HOUR,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  if (options?.skipToday || next <= now) {
    next = next.plus({ days: 1 });
  }

  return next.toUTC().toISO()!;
}

export function formatLocalSend(iso: string, timezone: string): string {
  const local = DateTime.fromISO(iso, { zone: timezone || "UTC" });
  const value = local.isValid
    ? local
    : DateTime.fromISO(iso, { zone: "UTC" });
  return value.toFormat("ccc d LLL, HH:mm ZZZZ");
}

export function cronLocalTime(timezone: string, at: Date = new Date()): string {
  const local = DateTime.fromJSDate(at, { zone: "UTC" })
    .set({ hour: CRON_UTC_HOUR, minute: 0, second: 0, millisecond: 0 })
    .setZone(timezone || "UTC");
  return local.toFormat("H:mm ZZZZ");
}

export function digestKeyFor(subscriberId: string, at: Date, timezone: string) {
  const local = DateTime.fromJSDate(at, { zone: timezone || "UTC" });
  const date = local.isValid
    ? local.toFormat("yyyy-LL-dd")
    : DateTime.fromJSDate(at, { zone: "UTC" }).toFormat("yyyy-LL-dd");
  return `${subscriberId}:${date}`;
}

export const TIMEZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function cronDateTime(timezone: string, at: Date) {
  return DateTime.fromJSDate(at, { zone: "UTC" })
    .set({ hour: CRON_UTC_HOUR, minute: 0, second: 0, millisecond: 0 })
    .setZone(timezone || "UTC");
}

export function timezonesBySendTime(at: Date = new Date()) {
  return [...TIMEZONES].sort((a, b) => {
    const left = cronDateTime(a, at);
    const right = cronDateTime(b, at);
    const byOffset = left.offset - right.offset;
    if (byOffset !== 0) return byOffset;
    return a.localeCompare(b);
  });
}
