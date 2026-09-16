import { DateTime } from "luxon";

export function computeNextSendAt(
  from: Date,
  timezone: string,
  sendHour: number,
): string {
  const zone = timezone || "UTC";
  let local = DateTime.fromJSDate(from, { zone });
  if (!local.isValid) {
    local = DateTime.fromJSDate(from, { zone: "UTC" });
  }

  let next = local.set({
    hour: sendHour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  if (next <= local) {
    next = next.plus({ days: 1 });
  }

  return next.toUTC().toISO()!;
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
