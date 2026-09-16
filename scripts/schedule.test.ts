import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { computeNextSendAt, digestKeyFor } from "../src/lib/schedule";
import { createJsonStore } from "../src/lib/json-store";

test("08:00 Berlin on 16 Sep 2026 maps to 06:00 UTC the next morning", () => {
  const from = new Date("2026-09-16T12:00:00.000Z");
  const next = computeNextSendAt(from, "Europe/Berlin", 8);
  assert.equal(next, "2026-09-17T06:00:00.000Z");
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
      sendHour: 8,
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
