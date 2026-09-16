import { notFound } from "next/navigation";
import { ManageSubscription } from "@/components/manage-subscription";
import { getStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
      <p className="mt-3 text-sm text-muted-foreground">
        {query.welcome
          ? "You are in. This page is a record of what you chose."
          : "Your current send settings."}
      </p>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <ManageSubscription
            token={token}
            email={subscriber.email}
            status={subscriber.status}
            timezone={subscriber.timezone}
            sendHour={subscriber.sendHour}
            topics={subscriber.topics}
            nextSendAt={subscriber.nextSendAt}
          />
        </CardContent>
      </Card>
    </main>
  );
}
