import Link from "next/link";
import { getStore } from "@/lib/store";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const store = getStore();
  const subscriber = await store.getByToken(token);

  if (subscriber && subscriber.status !== "unsubscribed" && !query.done) {
    await store.update(subscriber.id, { status: "unsubscribed" });
  }

  const missing = !subscriber;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg items-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="space-y-4 pt-6">
          <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
            Daily Brief
          </p>
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {missing ? "This link is no longer valid" : "You are unsubscribed"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {missing
              ? "We could not find a subscription for this manage token."
              : `${subscriber.email} will not receive further Daily Brief emails. You can resubscribe from the homepage any time.`}
          </p>
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            Back to Daily Brief
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
