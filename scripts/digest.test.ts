import assert from "node:assert/strict";
import test from "node:test";
import { clipSummary, pickStories } from "../src/lib/digest";
import type { Story, TopicId } from "../src/lib/types";

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

function story(topic: TopicId, n: number): Story {
  return {
    id: `${topic}-${n}`,
    title: `${topic} ${n}`,
    summary: "Summary.",
    url: `https://example.com/${topic}/${n}`,
    source: "Test",
    topic,
    publishedAt: null,
  };
}

test("pickStories scales with the number of selected topics", () => {
  const pool = [
    ...[1, 2, 3, 4].map((n) => story("world", n)),
    ...[1, 2, 3, 4].map((n) => story("business", n)),
    ...[1, 2, 3, 4].map((n) => story("science", n)),
  ];
  assert.equal(pickStories(pool, ["world"]).length, 3);
  assert.equal(pickStories(pool, ["world", "business"]).length, 6);
  assert.equal(pickStories(pool, ["world", "business", "science"]).length, 9);
});

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
