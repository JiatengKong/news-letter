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

test("pickStories takes two stories per topic in the selected topic order", () => {
  const pool = [
    ...[1, 2, 3, 4].map((n) => story("world", n)),
    ...[1, 2, 3, 4].map((n) => story("business", n)),
    ...[1, 2, 3, 4].map((n) => story("science", n)),
  ];
  const picked = pickStories(pool, ["science", "world", "business"]);
  assert.deepEqual(
    picked.map((item) => item.id),
    [
      "science-1",
      "science-2",
      "world-1",
      "world-2",
      "business-1",
      "business-2",
    ],
  );
});
