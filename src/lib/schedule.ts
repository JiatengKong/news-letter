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
  return local.toFormat("HH:mm ZZZZ");
}

export function digestKeyFor(subscriberId: string, at: Date, timezone: string) {
  const local = DateTime.fromJSDate(at, { zone: timezone || "UTC" });
  const date = local.isValid
    ? local.toFormat("yyyy-LL-dd")
    : DateTime.fromJSDate(at, { zone: "UTC" }).toFormat("yyyy-LL-dd");
  return `${subscriberId}:${date}`;
}

export const TIMEZONES = [
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
];
