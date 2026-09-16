import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-4 px-4 py-24">
      <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
        Daily Brief
      </p>
      <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground">
        This manage link may have been copied incompletely. Open the latest email and try again.
      </p>
      <Link href="/" className={buttonVariants()}>
        Go home
      </Link>
    </main>
  );
}
