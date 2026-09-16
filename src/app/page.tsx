import { SubscribeForm } from "@/components/subscribe-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-xs font-medium tracking-[0.22em] uppercase text-muted-foreground">
            Daily Brief
          </p>
          <Badge variant="secondary">World news, once a day</Badge>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <section className="space-y-6">
          <p className="text-sm tracking-[0.16em] uppercase text-muted-foreground">
            A morning paper without the pile
          </p>
          <h1
            className="max-w-xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            The world, briefly, at the hour you actually read email.
          </h1>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
            Daily Brief pulls overnight stories from BBC, The Guardian, NPR, and
            Al Jazeera, then sends one email with the desks you chose. Pause or
            leave in one click. No account, no paywall.
          </p>
          <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="rounded-xl border border-border bg-card p-4">
              <strong className="block text-foreground">Your hour</strong>
              Default 08:00 Europe/Berlin. Change it any time.
            </li>
            <li className="rounded-xl border border-border bg-card p-4">
              <strong className="block text-foreground">Your desks</strong>
              World, politics, business, science, climate, culture.
            </li>
            <li className="rounded-xl border border-border bg-card p-4">
              <strong className="block text-foreground">Your exit</strong>
              Manage and unsubscribe links in every issue.
            </li>
          </ul>
        </section>

        <Card className="h-fit">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-medium">Subscribe</h2>
            <SubscribeForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
