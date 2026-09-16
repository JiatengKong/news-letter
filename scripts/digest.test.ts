import assert from "node:assert/strict";
import test from "node:test";
import { clipSummary } from "../src/lib/digest";

test("clipSummary keeps complete sentences instead of cutting mid-word", () => {
  const text =
    "An NBC helicopter crashed in Chatsworth in the San Fernando Valley of Los Angeles, near the site of a bus crash that occurred hours earlier on Wednesday. The helicopter crashed near a one-storey building as news crews were covering the bus crash that left at least two people dead at the scene.";
  const clipped = clipSummary(text, 280);
  assert.equal(
    clipped,
    "An NBC helicopter crashed in Chatsworth in the San Fernando Valley of Los Angeles, near the site of a bus crash that occurred hours earlier on Wednesday.",
  );
  assert.match(clipped, /[.!?]$/);
});

test("clipSummary leaves short copy alone", () => {
  const text = "Markets closed higher.";
  assert.equal(clipSummary(text), text);
});
