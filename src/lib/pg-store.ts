import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";
import type {
  Store,
  SubscribeInput,
  Subscriber,
  SubscriberPatch,
  SubscriberStatus,
  TopicId,
} from "./types";
import { normalizeEmail, newSubscriber } from "./subscriber";

type Row = {
  id: string;
  email: string;
  status: SubscriberStatus;
  timezone: string;
  send_hour: number;
  topics: TopicId[] | string;
  manage_token: string;
  next_send_at: string;
  last_sent_at: string | null;
  last_digest_key: string | null;
  created_at: string;
  updated_at: string;
};

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

function asIso(value: string | Date | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? new Date(value).toISOString() : value.toISOString();
}

function topicsFrom(value: TopicId[] | string): TopicId[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value) as TopicId[];
    return Array.isArray(parsed) ? parsed : ["world"];
  } catch {
    return ["world"];
  }
}

function fromRow(row: Row): Subscriber {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    timezone: row.timezone,
    sendHour: Number(row.send_hour),
    topics: topicsFrom(row.topics),
    manageToken: row.manage_token,
    nextSendAt: asIso(row.next_send_at)!,
    lastSentAt: asIso(row.last_sent_at),
    lastDigestKey: row.last_digest_key,
    createdAt: asIso(row.created_at)!,
    updatedAt: asIso(row.updated_at)!,
  };
}

let schemaReady: Promise<void> | null = null;

export async function ensureSchema() {
  const sql = sqlClient();
  await sql`
    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      timezone TEXT NOT NULL,
      send_hour INTEGER NOT NULL,
      topics JSONB NOT NULL,
      manage_token TEXT NOT NULL UNIQUE,
      next_send_at TIMESTAMPTZ NOT NULL,
      last_sent_at TIMESTAMPTZ,
      last_digest_key TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS send_claims (
      subscriber_id TEXT NOT NULL,
      digest_key TEXT NOT NULL,
      claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (subscriber_id, digest_key)
    )
  `;
}

function ready() {
  if (!schemaReady) schemaReady = ensureSchema();
  return schemaReady;
}

export function createPgStore(): Store {
  return {
    async getByEmail(email) {
      await ready();
      const sql = sqlClient();
      const rows = (await sql`
        SELECT * FROM subscribers WHERE email = ${normalizeEmail(email)} LIMIT 1
      `) as Row[];
      return rows[0] ? fromRow(rows[0]) : null;
    },
    async getByToken(token) {
      await ready();
      const sql = sqlClient();
      const rows = (await sql`
        SELECT * FROM subscribers WHERE manage_token = ${token} LIMIT 1
      `) as Row[];
      return rows[0] ? fromRow(rows[0]) : null;
    },
    async listDue(nowIso) {
      await ready();
      const sql = sqlClient();
      const rows = (await sql`
        SELECT * FROM subscribers
        WHERE status = 'active' AND next_send_at <= ${nowIso}::timestamptz
        ORDER BY next_send_at ASC
      `) as Row[];
      return rows.map(fromRow);
    },
    async create(input: SubscribeInput & { nextSendAt: string }) {
      await ready();
      const sql = sqlClient();
      const existing = (await sql`
        SELECT * FROM subscribers WHERE email = ${normalizeEmail(input.email)} LIMIT 1
      `) as Row[];
      if (existing[0]) {
        const rows = (await sql`
          UPDATE subscribers SET
            timezone = ${input.timezone},
            send_hour = ${input.sendHour},
            topics = ${JSON.stringify(input.topics)}::jsonb,
            next_send_at = ${input.nextSendAt}::timestamptz,
            status = 'active',
            updated_at = now()
          WHERE id = ${existing[0].id}
          RETURNING *
        `) as Row[];
        return fromRow(rows[0]);
      }
      const created = newSubscriber(input, nanoid(21));
      const rows = (await sql`
        INSERT INTO subscribers (
          id, email, status, timezone, send_hour, topics, manage_token,
          next_send_at, last_sent_at, last_digest_key, created_at, updated_at
        ) VALUES (
          ${created.id}, ${created.email}, ${created.status}, ${created.timezone},
          ${created.sendHour}, ${JSON.stringify(created.topics)}::jsonb,
          ${created.manageToken}, ${created.nextSendAt}::timestamptz,
          NULL, NULL, ${created.createdAt}::timestamptz, ${created.updatedAt}::timestamptz
        )
        RETURNING *
      `) as Row[];
      return fromRow(rows[0]);
    },
    async update(id, patch: SubscriberPatch) {
      await ready();
      const sql = sqlClient();
      const current = (await sql`
        SELECT * FROM subscribers WHERE id = ${id} LIMIT 1
      `) as Row[];
      if (!current[0]) throw new Error("Subscriber not found");
      const merged = { ...fromRow(current[0]), ...patch };
      const rows = (await sql`
        UPDATE subscribers SET
          status = ${merged.status},
          timezone = ${merged.timezone},
          send_hour = ${merged.sendHour},
          topics = ${JSON.stringify(merged.topics)}::jsonb,
          next_send_at = ${merged.nextSendAt}::timestamptz,
          updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `) as Row[];
      return fromRow(rows[0]);
    },
    async claimSend(subscriberId, digestKey) {
      await ready();
      const sql = sqlClient();
      const rows = (await sql`
        INSERT INTO send_claims (subscriber_id, digest_key)
        VALUES (${subscriberId}, ${digestKey})
        ON CONFLICT (subscriber_id, digest_key) DO NOTHING
        RETURNING subscriber_id
      `) as { subscriber_id: string }[];
      return rows.length > 0;
    },
    async releaseSend(subscriberId, digestKey) {
      await ready();
      const sql = sqlClient();
      await sql`
        DELETE FROM send_claims
        WHERE subscriber_id = ${subscriberId} AND digest_key = ${digestKey}
      `;
    },
    async markSent(subscriberId, digestKey, nextSendAt) {
      await ready();
      const sql = sqlClient();
      await sql`
        UPDATE subscribers SET
          last_sent_at = now(),
          last_digest_key = ${digestKey},
          next_send_at = ${nextSendAt}::timestamptz,
          updated_at = now()
        WHERE id = ${subscriberId}
      `;
    },
  };
}
