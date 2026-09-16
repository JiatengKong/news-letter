import { getStore, resetStoreCache } from "../src/lib/store";
import { ensureSchema } from "../src/lib/pg-store";

async function main() {
  const email = process.env.SEED_EMAIL || "jtngkong@gmail.com";
  const timezone = process.env.SEED_TIMEZONE || "Europe/Berlin";
  const nextSendAt =
    process.env.SEED_NEXT_SEND_AT || "2026-09-17T06:00:00.000Z";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed Neon");
  }

  await ensureSchema();
  resetStoreCache();
  const store = getStore();
  const subscriber = await store.create({
    email,
    timezone,
    sendHour: 6,
    topics: ["world", "politics", "business", "science"],
    nextSendAt,
  });

  // Keep the requested next send even if create() recomputes on existing rows.
  await store.update(subscriber.id, {
    status: "active",
    timezone,
    sendHour: 6,
    nextSendAt,
  });

  const saved = await store.getByEmail(email);
  console.log(
    JSON.stringify(
      {
        id: saved?.id,
        email: saved?.email,
        status: saved?.status,
        timezone: saved?.timezone,
        sendHour: saved?.sendHour,
        nextSendAt: saved?.nextSendAt,
        manageToken: saved?.manageToken,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
