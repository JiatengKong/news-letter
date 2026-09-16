"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TOPICS, type TopicId } from "@/lib/types";
import { timezonesBySendTime, cronLocalTime } from "@/lib/schedule";

type Props = {
  defaults?: {
    email?: string;
    timezone?: string;
    topics?: TopicId[];
  };
  mode?: "subscribe" | "manage";
  token?: string;
  status?: string;
  onCancel?: () => void;
  onSaved?: () => void;
};

export function SubscribeForm({
  defaults,
  mode = "subscribe",
  token,
  status,
  onCancel,
  onSaved,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [timezone, setTimezone] = useState(defaults?.timezone ?? "Europe/Berlin");
  const [topics, setTopics] = useState<TopicId[]>(
    defaults?.topics ?? ["world", "politics", "business"],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  function toggleTopic(id: TopicId, checked: boolean) {
    setTopics((current) => {
      if (checked) return Array.from(new Set([...current, id]));
      const next = current.filter((t) => t !== id);
      return next.length ? next : current;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(null);
    setPending(true);
    try {
      const path = mode === "manage" ? "/api/manage" : "/api/subscribe";
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          timezone,
          topics,
          token,
          status: status === "unsubscribed" ? "active" : status,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        manageToken?: string;
        nextSendAt?: string;
      };
      if (!res.ok) throw new Error(data.error || "Could not save.");
      if (mode === "subscribe" && data.manageToken) {
        router.push(`/manage/${data.manageToken}?welcome=1`);
        return;
      }
      router.refresh();
      onSaved?.();
      if (!onSaved) {
        setSaved("Saved.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      {mode === "subscribe" ? (
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{email}</p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
        >
          {timezonesBySendTime().map((zone) => (
            <option key={zone} value={zone}>
              {cronLocalTime(zone)} · {zone}
            </option>
          ))}
        </select>
        <p className="text-sm font-medium">
          You will receive the email at {cronLocalTime(timezone)} every day.
        </p>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Topics</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOPICS.map((topic) => (
            <label
              key={topic.id}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <Checkbox
                checked={topics.includes(topic.id)}
                onCheckedChange={(checked) =>
                  toggleTopic(topic.id, Boolean(checked))
                }
              />
              {topic.label}
            </label>
          ))}
        </div>
      </fieldset>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-muted-foreground">{saved}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} size="lg">
          {pending
            ? "Saving…"
            : mode === "manage"
              ? "Save preferences"
              : "Start the brief"}
        </Button>
        {mode === "manage" && onCancel ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
