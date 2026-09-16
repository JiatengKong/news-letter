import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  computeNextCronAt,
  cronLocalTime,
  digestKeyFor,
} from "../src/lib/schedule";
import { createJsonStore } from "../src/lib/json-store";

test("after the daily 06:00 UTC run, the next slot is tomorrow 06:00 UTC", () => {
  const from = new Date("2026-09-16T12:00:00.000Z");
  const next = computeNextCronAt(from);
  assert.equal(next, "2026-09-17T06:00:00.000Z");
});

test("subscribe skipToday waits until tomorrow even if today's cron has not run yet", () => {
  const from = new Date("2026-09-16T05:00:00.000Z");
  const sameDay = computeNextCronAt(from);
  const tomorrow = computeNextCronAt(from, { skipToday: true });
  assert.equal(sameDay, "2026-09-16T06:00:00.000Z");
  assert.equal(tomorrow, "2026-09-17T06:00:00.000Z");
});

test("timezone only relabels 06:00 UTC, it does not move the send", () => {
  const at = new Date("2026-09-16T12:00:00.000Z");
  assert.match(cronLocalTime("Europe/Berlin", at), /^08:00 /);
  assert.match(cronLocalTime("America/New_York", at), /^02:00 /);
});

test("digest key is local calendar date, so a retry the same morning is idempotent", () => {
  const id = "sub_1";
  const morning = new Date("2026-09-17T06:05:00.000Z");
  const later = new Date("2026-09-17T06:20:00.000Z");
  assert.equal(
    digestKeyFor(id, morning, "Europe/Berlin"),
    digestKeyFor(id, later, "Europe/Berlin"),
  );
  assert.equal(digestKeyFor(id, morning, "Europe/Berlin"), "sub_1:2026-09-17");
});

test("json store claimSend is exclusive", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "brief-"));
  t.after(async () => {
    await rm(dir, { recursive: true, force: true });
  });
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const store = createJsonStore();
    const created = await store.create({
      email: "reader@example.com",
      timezone: "Europe/Berlin",
      sendHour: 6,
      topics: ["world"],
      nextSendAt: "2026-09-17T06:00:00.000Z",
    });
    const first = await store.claimSend(created.id, "k1");
    const second = await store.claimSend(created.id, "k1");
    assert.equal(first, true);
    assert.equal(second, false);
    await store.releaseSend(created.id, "k1");
    const third = await store.claimSend(created.id, "k1");
    assert.equal(third, true);
  } finally {
    process.chdir(cwd);
  }
});
