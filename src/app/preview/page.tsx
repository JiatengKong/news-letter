import type { Metadata } from "next";
import Link from "next/link";
import { buildDigest } from "@/lib/digest";
import { TOPICS, type TopicId } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sample brief · Daily Brief",
  description: "A public sample of today's Daily Brief — the same layout as the email.",
};

const SAMPLE_TOPICS: TopicId[] = ["world", "politics", "business"];

function topicLabel(id: string) {
  return TOPICS.find((topic) => topic.id === id)?.label ?? id;
}

function formatWhen(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export default async function PreviewPage() {
  let digest: Awaited<ReturnType<typeof buildDigest>>;
  try {
    digest = await buildDigest(SAMPLE_TOPICS);
  } catch {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
          Daily Brief
        </p>
        <h1 className="mt-3 text-3xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
          Sample brief unavailable
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The news feeds did not load. Try again in a moment.
        </p>
        <Link href="/" className={`${buttonVariants()} mt-6 inline-flex`}>
          Back
        </Link>
      </main>
    );
  }

  const dateLabel = new Date(digest.generatedAt).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  });

  return (
    <div className="min-h-full bg-[#f4efe7] px-3 py-8 sm:px-6">
      <div className="mx-auto max-w-[600px]">
        <p className="mb-4 text-sm text-[#5c564e]">
          This is a public sample of today&apos;s brief — the same layout as
          the email.
        </p>
        <article className="border border-[#e4d8c8] bg-[#fffaf3] px-6 py-8 sm:px-8">
          <p className="text-xs tracking-[0.18em] uppercase text-[#8a6a4a]">
            Daily Brief
          </p>
          <h1
            className="mt-2 text-3xl font-semibold"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            World news, once a day
          </h1>
          <p className="mt-2 text-sm text-[#5c564e]">{dateLabel}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-[#5c564e]">
            Sample desks: World, Politics, Business. Two stories per desk, in
            that order.
          </p>

          {digest.stories.length === 0 ? (
            <p className="mt-6 text-[#555]">
              World desks were quiet for these topics in the last day.
            </p>
          ) : (
            <ul>
              {digest.stories.map((story) => (
                <li
                  key={story.url}
                  className="border-b border-[#eadfd0] py-5 last:border-b-0"
                >
                  <p className="text-[11px] tracking-[0.12em] uppercase text-[#8a6a4a]">
                    {story.source} · {topicLabel(story.topic)}
                  </p>
                  <a
                    href={story.url}
                    className="mt-1 block text-[#1a1714] no-underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <h2 className="text-xl leading-snug font-semibold">
                      {story.title}
                    </h2>
                  </a>
                  {story.summary ? (
                    <p className="mt-2 text-[15px] leading-relaxed text-[#444]">
                      {story.summary}
                    </p>
                  ) : null}
                  {story.publishedAt ? (
                    <p className="mt-2 text-xs text-[#7a7268]">
                      {formatWhen(story.publishedAt)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </div>
  );
}
