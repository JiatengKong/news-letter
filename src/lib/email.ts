import { Resend } from "resend";
import type { Digest, Subscriber } from "./types";
import { TOPICS } from "./types";

function appUrl() {
  return (process.env.APP_URL || "http://127.0.0.1:43123").replace(/\/$/, "");
}

function fromAddress() {
  return process.env.EMAIL_FROM || "Daily Brief <onboarding@resend.dev>";
}

function manageUrl(token: string) {
  return `${appUrl()}/manage/${token}`;
}

function unsubscribeUrl(token: string) {
  return `${appUrl()}/unsubscribe/${token}`;
}

function topicLabel(id: string) {
  return TOPICS.find((t) => t.id === id)?.label ?? id;
}

function formatWhen(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function renderDigestHtml(
  subscriber: Subscriber,
  digest: Digest,
  options?: { introHtml?: string },
) {
  const stories = digest.stories
    .map((story) => {
      const summary = story.summary
        ? `<p style="margin:8px 0 0;color:#444;font-size:15px;line-height:1.5">${escapeHtml(story.summary)}</p>`
        : "";
      return `
        <tr>
          <td style="padding:20px 0;border-bottom:1px solid #eadfd0">
            <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8a6a4a">
              ${escapeHtml(story.source)} · ${escapeHtml(topicLabel(story.topic))}
            </div>
            <a href="${escapeAttr(story.url)}" style="color:#1a1714;text-decoration:none">
              <h2 style="margin:6px 0 0;font-size:20px;line-height:1.3;font-weight:650">${escapeHtml(story.title)}</h2>
            </a>
            ${summary}
            <p style="margin:10px 0 0;font-size:12px;color:#7a7268">${escapeHtml(formatWhen(story.publishedAt))}</p>
          </td>
        </tr>`;
    })
    .join("");

  const empty = `
    <tr><td style="padding:24px 0;color:#555">
      World desks were quiet for your selected topics in the last day. We will try again at your next send time.
    </td></tr>`;

  const intro = options?.introHtml
    ? `<tr><td style="padding:16px 0 8px;color:#5c564e;font-size:15px;line-height:1.55">${options.introHtml}</td></tr>`
    : "";

  return `<!doctype html>
<html>
<body style="margin:0;background:#f4efe7;font-family:Georgia, 'Times New Roman', serif;color:#1a1714">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe7;padding:32px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffaf3;border:1px solid #e4d8c8;padding:32px">
          <tr>
            <td>
              <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8a6a4a">Daily Brief</p>
              <h1 style="margin:8px 0 0;font-size:28px">World news, once a day</h1>
              <p style="margin:8px 0 0;color:#5c564e;font-size:14px">
                ${escapeHtml(new Date(digest.generatedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: subscriber.timezone }))}
              </p>
            </td>
          </tr>
          ${intro}
          ${stories || empty}
          <tr>
            <td style="padding-top:28px;font-size:13px;color:#6b645c">
              <a href="${escapeAttr(manageUrl(subscriber.manageToken))}" style="color:#6b4f35">Manage preferences</a>
              ·
              <a href="${escapeAttr(unsubscribeUrl(subscriber.manageToken))}" style="color:#6b4f35">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderDigestText(
  subscriber: Subscriber,
  digest: Digest,
  options?: { introText?: string },
) {
  const lines = [
    "Daily Brief",
    "",
    ...(options?.introText ? [options.introText, ""] : []),
    ...digest.stories.map(
      (s) => `${s.source} — ${s.title}\n${s.summary}\n${s.url}\n`,
    ),
    `Manage: ${manageUrl(subscriber.manageToken)}`,
    `Unsubscribe: ${unsubscribeUrl(subscriber.manageToken)}`,
  ];
  return lines.join("\n");
}

export async function sendDigest(
  subscriber: Subscriber,
  digest: Digest,
  options?: {
    subject?: string;
    introHtml?: string;
    introText?: string;
  },
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const resend = new Resend(key);
  const dateLabel = new Date(digest.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: subscriber.timezone,
  });
  const unsub = unsubscribeUrl(subscriber.manageToken);
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: subscriber.email,
    subject: options?.subject ?? `Daily Brief · ${dateLabel}`,
    html: renderDigestHtml(subscriber, digest, { introHtml: options?.introHtml }),
    text: renderDigestText(subscriber, digest, { introText: options?.introText }),
    headers: {
      "List-Unsubscribe": `<${unsub}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (error) throw new Error(error.message);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

export { manageUrl, unsubscribeUrl };
