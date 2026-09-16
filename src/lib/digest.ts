import Parser from "rss-parser";
import type { Digest, Story, TopicId } from "./types";

const FEEDS: { url: string; source: string; topic: TopicId }[] = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC", topic: "world" },
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC", topic: "science" },
  { url: "https://www.theguardian.com/world/rss", source: "The Guardian", topic: "world" },
  { url: "https://www.theguardian.com/uk/business/rss", source: "The Guardian", topic: "business" },
  { url: "https://www.theguardian.com/environment/rss", source: "The Guardian", topic: "climate" },
  { url: "https://www.theguardian.com/us-news/rss", source: "The Guardian", topic: "politics" },
  { url: "https://feeds.npr.org/1004/rss.xml", source: "NPR", topic: "world" },
  { url: "https://feeds.npr.org/1019/rss.xml", source: "NPR", topic: "science" },
  { url: "https://feeds.npr.org/1006/rss.xml", source: "NPR", topic: "business" },
  { url: "https://feeds.npr.org/1008/rss.xml", source: "NPR", topic: "culture" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera", topic: "world" },
];

const parser = new Parser({ timeout: 12_000 });

function fingerprint(title: string, url: string) {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}|${host}`;
}

function clean(text: string | undefined) {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function clipSummary(text: string | undefined, max = 420): string {
  const cleaned = clean(text);
  if (!cleaned) return "";
  if (cleaned.length <= max) return cleaned;

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  let out = "";
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length <= max) {
      out = next;
      continue;
    }
    if (out) return out;
    if (/[.!?]$/.test(sentence) && sentence.length <= Math.round(max * 1.5)) {
      return sentence;
    }
    const cut = sentence.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
  }
  return out;
}

export async function buildDigest(topics: TopicId[]): Promise<Digest> {
  const wanted = new Set(topics);
  const selected = FEEDS.filter((f) => wanted.has(f.topic));
  const cutoff = Date.now() - 36 * 60 * 60 * 1000;

  const results = await Promise.allSettled(
    selected.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items ?? []).map((item) => {
        const published = item.isoDate || item.pubDate || null;
        const publishedMs = published ? Date.parse(published) : NaN;
        const story: Story = {
          id: item.guid || item.link || `${feed.source}:${item.title}`,
          title: clean(item.title) || "Untitled",
          summary: clipSummary(item.contentSnippet || item.content),
          url: item.link || feed.url,
          source: feed.source,
          topic: feed.topic,
          publishedAt: Number.isFinite(publishedMs)
            ? new Date(publishedMs).toISOString()
            : null,
        };
        return { story, publishedMs };
      });
    }),
  );

  const seen = new Set<string>();
  const stories: Story[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const entry of result.value) {
      if (Number.isFinite(entry.publishedMs) && entry.publishedMs < cutoff) {
        continue;
      }
      const key = fingerprint(entry.story.title, entry.story.url);
      if (seen.has(key)) continue;
      seen.add(key);
      stories.push(entry.story);
    }
  }

  stories.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  const byTopic = new Map<TopicId, Story[]>();
  for (const story of stories) {
    const list = byTopic.get(story.topic) ?? [];
    if (list.length < 3) list.push(story);
    byTopic.set(story.topic, list);
  }

  const picked: Story[] = [];
  for (const topic of topics) {
    picked.push(...(byTopic.get(topic) ?? []));
  }

  if (picked.length < 6) {
    for (const story of stories) {
      if (picked.length >= 10) break;
      if (!picked.some((s) => s.url === story.url)) picked.push(story);
    }
  }

  return {
    key: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    stories: picked.slice(0, 12),
  };
}
