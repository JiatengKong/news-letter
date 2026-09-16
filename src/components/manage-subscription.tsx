"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscribeForm } from "@/components/subscribe-form";
import { TOPICS, type TopicId } from "@/lib/types";

type Props = {
  token: string;
  email: string;
  status: string;
  timezone: string;
  sendHour: number;
  topics: TopicId[];
  nextSendAt: string;
};

function topicLabel(id: TopicId) {
  return TOPICS.find((topic) => topic.id === id)?.label ?? id;
}

export function ManageSubscription({
  token,
  email,
  status,
  timezone,
  sendHour,
  topics,
  nextSendAt,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hourLabel = `${String(sendHour).padStart(2, "0")}:00`;
  const nextSend = new Date(nextSendAt).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  });

  async function setStatus(next: "active" | "paused" | "unsubscribed") {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/manage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          status: next,
          timezone,
          sendHour,
          topics,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not update.");
      if (next === "unsubscribed") {
        router.push(`/unsubscribe/${token}?done=1`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <div className="grid gap-6">
        <SubscribeForm
          mode="manage"
          token={token}
          status={status}
          defaults={{ email, timezone, sendHour, topics }}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <dl className="grid gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="mt-1 font-medium">{email}</dd>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Timezone</dt>
            <dd className="mt-1 font-medium">{timezone}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Send time</dt>
            <dd className="mt-1 font-medium">{hourLabel} local</dd>
          </div>
        </div>
        <div>
          <dt className="text-muted-foreground">Topics</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Badge key={topic} variant="secondary">
                {topicLabel(topic)}
              </Badge>
            ))}
          </dd>
        </div>
        {status === "active" ? (
          <div>
            <dt className="text-muted-foreground">Next send</dt>
            <dd className="mt-1 font-medium">{nextSend}</dd>
          </div>
        ) : null}
      </dl>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="lg"
          disabled={pending}
          onClick={() => setEditing(true)}
        >
          Edit preferences
        </Button>
        {status === "paused" ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setStatus("active")}
          >
            Resume
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={pending || status !== "active"}
            onClick={() => setStatus("paused")}
          >
            Pause
          </Button>
        )}
        {status !== "unsubscribed" ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setStatus("unsubscribed")}
          >
            Unsubscribe
          </Button>
        ) : null}
      </div>
    </div>
  );
}
