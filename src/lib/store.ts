import { createJsonStore } from "./json-store";
import { createPgStore } from "./pg-store";
import type { Store } from "./types";

let cached: Store | null = null;

/**
 * Persistence for subscribers and send claims.
 * Uses Postgres when DATABASE_URL is set (required on Vercel).
 * Falls back to data/store.json for local development.
 */
export function getStore(): Store {
  if (cached) return cached;
  cached = process.env.DATABASE_URL ? createPgStore() : createJsonStore();
  return cached;
}

export function resetStoreCache() {
  cached = null;
}
