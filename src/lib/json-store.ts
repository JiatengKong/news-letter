import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import type {
  Store,
  SubscribeInput,
  Subscriber,
  SubscriberPatch,
} from "./types";
import { normalizeEmail, newSubscriber } from "./subscriber";

type DbShape = {
  subscribers: Subscriber[];
  sendClaims: { subscriberId: string; digestKey: string }[];
};

const FILE = path.join(process.cwd(), "data", "store.json");

let writeChain: Promise<void> = Promise.resolve();

async function readDb(): Promise<DbShape> {
  try {
    const raw = await readFile(FILE, "utf8");
    return JSON.parse(raw) as DbShape;
  } catch {
    return { subscribers: [], sendClaims: [] };
  }
}

async function writeDb(db: DbShape) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(db, null, 2));
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function createJsonStore(): Store {
  return {
    async getByEmail(email) {
      const db = await readDb();
      return (
        db.subscribers.find((s) => s.email === normalizeEmail(email)) ?? null
      );
    },
    async getByToken(token) {
      const db = await readDb();
      return db.subscribers.find((s) => s.manageToken === token) ?? null;
    },
    async listDue(nowIso) {
      const db = await readDb();
      return db.subscribers.filter(
        (s) => s.status === "active" && s.nextSendAt <= nowIso,
      );
    },
    async create(input: SubscribeInput & { nextSendAt: string }) {
      return withLock(async () => {
        const db = await readDb();
        const existing = db.subscribers.find(
          (s) => s.email === normalizeEmail(input.email),
        );
        if (existing) {
          const updated: Subscriber = {
            ...existing,
            ...input,
            email: normalizeEmail(input.email),
            status: "active",
            updatedAt: new Date().toISOString(),
          };
          db.subscribers = db.subscribers.map((s) =>
            s.id === existing.id ? updated : s,
          );
          await writeDb(db);
          return updated;
        }
        const created = newSubscriber(input, nanoid(21));
        db.subscribers.push(created);
        await writeDb(db);
        return created;
      });
    },
    async update(id, patch: SubscriberPatch) {
      return withLock(async () => {
        const db = await readDb();
        const idx = db.subscribers.findIndex((s) => s.id === id);
        if (idx < 0) throw new Error("Subscriber not found");
        const updated: Subscriber = {
          ...db.subscribers[idx],
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        db.subscribers[idx] = updated;
        await writeDb(db);
        return updated;
      });
    },
    async claimSend(subscriberId, digestKey) {
      return withLock(async () => {
        const db = await readDb();
        const exists = db.sendClaims.some(
          (c) => c.subscriberId === subscriberId && c.digestKey === digestKey,
        );
        if (exists) return false;
        db.sendClaims.push({ subscriberId, digestKey });
        await writeDb(db);
        return true;
      });
    },
    async releaseSend(subscriberId, digestKey) {
      return withLock(async () => {
        const db = await readDb();
        db.sendClaims = db.sendClaims.filter(
          (c) =>
            !(c.subscriberId === subscriberId && c.digestKey === digestKey),
        );
        await writeDb(db);
      });
    },
    async markSent(subscriberId, digestKey, nextSendAt) {
      return withLock(async () => {
        const db = await readDb();
        db.subscribers = db.subscribers.map((s) =>
          s.id === subscriberId
            ? {
                ...s,
                lastSentAt: new Date().toISOString(),
                lastDigestKey: digestKey,
                nextSendAt,
                updatedAt: new Date().toISOString(),
              }
            : s,
        );
        await writeDb(db);
      });
    },
  };
}
