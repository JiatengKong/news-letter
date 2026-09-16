# Daily Brief

A once-a-day world news digest. Subscribers pick a timezone and desks (world, politics, business, science, climate, culture). Each issue is built from BBC, The Guardian, NPR, and Al Jazeera RSS feeds and sent with Resend.

On subscribe, Daily Brief emails today's brief immediately and confirms the subscription. After that, **every subscriber is sent on the same Vercel Hobby cron: 06:00 UTC** (`0 6 * * *` in `vercel.json`). Timezone only changes how that clock time is displayed (08:00 in Berlin in summer, 02:00 in New York, and so on). A per-person send hour is not offered, because Hobby can run only one cron job per day.

Manage and unsubscribe links are in every email. There is no login: the manage URL is the credential.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app listens on [http://127.0.0.1:43123](http://127.0.0.1:43123). Without `DATABASE_URL` it stores subscribers in `data/store.json` (not Vercel-safe). With `DATABASE_URL` it uses Postgres through the same `getStore()` interface in `src/lib/store.ts`.

```bash
npm test
npm run lint
npm run build
```

Seed the production subscriber (active, next send `2026-09-17T06:00:00Z`):

```bash
DATABASE_URL="postgresql://..." npm run seed
```

## Environment

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `Daily Brief <onboarding@resend.dev>` |
| `CRON_SECRET` | Shared secret for `/api/cron` |
| `APP_URL` | Public `https://` origin used in manage/unsubscribe links |

## Cron

`GET` or `POST` `/api/cron` with `Authorization: Bearer $CRON_SECRET`.

The tick is **idempotent**: it claims `(subscriber_id, digest_key)` where `digest_key` is `id:local-date` in the subscriber's timezone. A second call the same morning skips that person. If sending fails, the claim is released so the next tick retries.

## Deploy

The GitHub repo is the production source. Create a Vercel project on the Hobby team, set the env vars, deploy, then set `APP_URL` to the real `https://` domain and redeploy so email links resolve.
