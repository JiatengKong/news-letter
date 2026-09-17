import assert from "node:assert/strict";
import test from "node:test";
import { clipSummary, isLiveBlog, pickStories } from "../src/lib/digest";
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

function story(topic: TopicId, n: number, source = "Test"): Story {
  return {
    id: `${topic}-${n}`,
    title: `${topic} ${n}`,
    summary: "Summary.",
    url: `https://example.com/${topic}/${n}`,
    source,
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

test("clipSummary strips Guardian live-blog promo before the actual lede", () => {
  const text =
    "Follow the day's news live Get our breaking news email, free app or daily news podcast Barnaby Joyce says Labor is copying and pasting One Nation’s homework because the measures we know so far around blocking the families of international students and preventing visa hopping have some similarity to what Pauline Hanson is suggesting.";
  const clipped = clipSummary(text);
  assert.equal(clipped.includes("breaking news email"), false);
  assert.equal(clipped.includes("daily news podcast"), false);
  assert.match(clipped, /^Barnaby Joyce says/);
});

test("isLiveBlog catches Guardian rolling coverage", () => {
  assert.equal(
    isLiveBlog(
      "Australian politics live: Chalmers says Liberal migration policy ‘determined by One Nation’",
      "https://www.theguardian.com/australia-news/live/2026/sep/17/australian-politics-live",
    ),
    true,
  );
  assert.equal(
    isLiveBlog(
      "Thursday briefing: Yemen’s war continues to threaten oil supplies",
      "https://www.theguardian.com/world/2026/sep/17/thursday-briefing-yemen",
    ),
    true,
  );
  assert.equal(
    isLiveBlog(
      "US to bar some South Africans over claims of anti-white discrimination",
      "https://www.theguardian.com/world/2026/sep/16/us-visa-restrictions",
    ),
    false,
  );
});

test("pickStories prefers two different sources in a desk", () => {
  const pool = [
    story("world", 1, "The Guardian"),
    story("world", 2, "The Guardian"),
    story("world", 3, "BBC"),
    story("world", 4, "Al Jazeera"),
  ];
  const picked = pickStories(pool, ["world"]);
  assert.deepEqual(
    picked.map((item) => item.source),
    ["The Guardian", "BBC"],
  );
});

test("pickStories prefers a non-US outlet after a US story", () => {
  const pool: Story[] = [
    {
      ...story("politics", 1, "The Guardian"),
      url: "https://www.theguardian.com/us-news/2026/sep/16/congress",
    },
    {
      ...story("politics", 2, "NPR"),
      url: "https://www.npr.org/2026/09/16/congress",
    },
    {
      ...story("politics", 3, "BBC"),
      url: "https://www.bbc.co.uk/news/articles/uk-politics",
    },
  ];
  const picked = pickStories(pool, ["politics"]);
  assert.deepEqual(
    picked.map((item) => item.source),
    ["The Guardian", "BBC"],
  );
});
