import Parser from "rss-parser";
import type { Digest, Story, TopicId } from "./types";

const FEEDS: { url: string; source: string; topic: TopicId }[] = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC", topic: "world" },
  { url: "https://feeds.bbci.co.uk/news/politics/rss.xml", source: "BBC", topic: "politics" },
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC", topic: "science" },
  { url: "https://www.theguardian.com/world/rss", source: "The Guardian", topic: "world" },
  { url: "https://www.theguardian.com/politics/rss", source: "The Guardian", topic: "politics" },
  { url: "https://www.theguardian.com/us-news/rss", source: "The Guardian", topic: "politics" },
  { url: "https://www.theguardian.com/uk/business/rss", source: "The Guardian", topic: "business" },
  { url: "https://www.theguardian.com/environment/rss", source: "The Guardian", topic: "climate" },
  { url: "https://feeds.npr.org/1004/rss.xml", source: "NPR", topic: "world" },
  { url: "https://feeds.npr.org/1014/rss.xml", source: "NPR", topic: "politics" },
  { url: "https://feeds.npr.org/1019/rss.xml", source: "NPR", topic: "science" },
  { url: "https://feeds.npr.org/1006/rss.xml", source: "NPR", topic: "business" },
  { url: "https://feeds.npr.org/1008/rss.xml", source: "NPR", topic: "culture" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera", topic: "world" },
];

const PROMO_PATTERNS: RegExp[] = [
  /in today'?s newsletter:?/gi,
  /this live blog is now closed\.?/gi,
  /follow the day'?s news live/gi,
  /get our breaking news email,?\s*(free app or daily news podcast)?/gi,
  /free app or daily news podcast/gi,
  /sign up for (the )?[^.!?]{0,80}email/gi,
  /sign up to (our|the) [^.!?]{0,80}/gi,
  /get the latest news on our app/gi,
  /download (our|the) (free )?app/gi,
  /support the guardian[^.!?]{0,60}/gi,
  /\badvertisement\b/gi,
  /\bsponsored content\b/gi,
  /this article (contains|includes) affiliate[^.!?]{0,40}/gi,
  /us politics live[^.–-]*latest updates/gi,
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

export function isLiveBlog(title: string, url: string): boolean {
  if (/\/live\//i.test(url)) return true;
  if (/\/newsletters?\//i.test(url)) return true;
  if (/\bnewsletter\b/i.test(title)) return true;
  if (/\bbriefing\s*:/i.test(title)) return true;
  if (/\blive\s*[:–—-]/i.test(title)) return true;
  if (/\b(live blog|politics live|europe live|business live|us politics live)\b/i.test(title)) {
    return true;
  }
  if (/[–—-]\s*live\b/i.test(title)) return true;
  return false;
}

export function stripPromo(text: string): string {
  let out = text;
  for (const pattern of PROMO_PATTERNS) {
    out = out.replace(pattern, " ");
  }
  return out.replace(/\s+/g, " ").replace(/^[.,;:\s]+/, "").trim();
}

export function clipSummary(text: string | undefined, max = 420): string {
  const cleaned = stripPromo(clean(text));
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

export const STORIES_PER_TOPIC = 2;

function regionOf(story: Story): "us" | "intl" {
  const url = story.url.toLowerCase();
  if (
    url.includes("/us-news/") ||
    url.includes("npr.org") ||
    url.includes("/us-and-canada/")
  ) {
    return "us";
  }
  return "intl";
}

export function pickStories(
  stories: Story[],
  topics: TopicId[],
  perTopic = STORIES_PER_TOPIC,
): Story[] {
  const picked: Story[] = [];
  const seen = new Set<string>();
  for (const topic of topics) {
    const candidates = stories.filter(
      (story) => story.topic === topic && !seen.has(story.url),
    );
    const slot: Story[] = [];
    const usedSources = new Set<string>();

    const take = (story: Story) => {
      usedSources.add(story.source);
      seen.add(story.url);
      slot.push(story);
    };

    const first = candidates[0];
    if (first) take(first);

    while (slot.length < perTopic) {
      const remaining = candidates.filter((story) => !seen.has(story.url));
      if (remaining.length === 0) break;
      const firstRegion = slot[0] ? regionOf(slot[0]) : "intl";
      const preferred =
        remaining.find(
          (story) =>
            !usedSources.has(story.source) && regionOf(story) !== firstRegion,
        ) ||
        remaining.find((story) => !usedSources.has(story.source)) ||
        remaining[0];
      take(preferred);
    }
    picked.push(...slot);
  }
  return picked;
}

export async function buildDigest(topics: TopicId[]): Promise<Digest> {
  const wanted = new Set(topics);
  const selected = FEEDS.filter((f) => wanted.has(f.topic));
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  const results = await Promise.allSettled(
    selected.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items ?? []).flatMap((item) => {
        const title = clean(item.title) || "Untitled";
        const url = item.link || feed.url;
        if (isLiveBlog(title, url)) return [];
        const published = item.isoDate || item.pubDate || null;
        const publishedMs = published ? Date.parse(published) : NaN;
        const story: Story = {
          id: item.guid || item.link || `${feed.source}:${item.title}`,
          title,
          summary: clipSummary(item.contentSnippet || item.content),
          url,
          source: feed.source,
          topic: feed.topic,
          publishedAt: Number.isFinite(publishedMs)
            ? new Date(publishedMs).toISOString()
            : null,
        };
        return [{ story, publishedMs }];
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

  return {
    key: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    stories: pickStories(stories, topics),
  };
}

