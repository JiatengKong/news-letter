import { notFound } from "next/navigation";
import { SubscribeForm } from "@/components/subscribe-form";
import { getStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const subscriber = await getStore().getByToken(token);
  if (!subscriber) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
        Daily Brief
      </p>
      <div className="mt-3 flex items-center gap-2">
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Manage your brief
        </h1>
        <Badge variant="secondary">{subscriber.status}</Badge>
      </div>
      {query.welcome ? (
        <p className="mt-3 text-sm text-muted-foreground">
          You are in. Bookmark this page. Every email also links here.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Next send: {new Date(subscriber.nextSendAt).toUTCString()}
        </p>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscribeForm
            mode="manage"
            token={token}
            status={subscriber.status}
            defaults={{
              email: subscriber.email,
              timezone: subscriber.timezone,
              sendHour: subscriber.sendHour,
              topics: subscriber.topics,
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
