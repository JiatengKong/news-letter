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
            The world, briefly, once a day.
          </h1>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
            One email a day from BBC, The Guardian, NPR, and Al Jazeera. You get
            today’s brief as soon as you subscribe. After that, everyone is sent
            on the same daily run at 06:00 UTC — pick a timezone so that time is
            shown in your clock.
          </p>
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
