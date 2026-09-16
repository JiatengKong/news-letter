"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscribeForm } from "@/components/subscribe-form";
import { cronLocalTime, formatLocalSend } from "@/lib/schedule";
import { TOPICS, type TopicId } from "@/lib/types";

type Props = {
  token: string;
  email: string;
  status: string;
  timezone: string;
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
  topics,
  nextSendAt,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localCron = cronLocalTime(timezone);
  const nextSend = formatLocalSend(nextSendAt, timezone);

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
      <SubscribeForm
        mode="manage"
        token={token}
        status={status}
        defaults={{ email, timezone, topics }}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <dl className="grid gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="mt-1 font-medium">{email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Timezone</dt>
          <dd className="mt-1 font-medium">{timezone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Daily send</dt>
          <dd className="mt-1 font-medium">{localCron}</dd>
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
          variant="outline"
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
            size="lg"
            disabled={pending}
            onClick={() => setStatus("active")}
          >
            Resume
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={pending || status !== "active"}
            onClick={() => setStatus("paused")}
          >
            Pause
          </Button>
        )}
        {status !== "unsubscribed" ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
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
