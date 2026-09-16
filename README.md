# Daily Brief

A once-a-day world news digest. Subscribers pick a local hour and desks (world, politics, business, science, climate, culture). Each issue is built from BBC, The Guardian, NPR, and Al Jazeera RSS feeds and sent with Resend.

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

Seed the production subscriber (active, 08:00 Europe/Berlin → `2026-09-17T06:00:00Z`):

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

Vercel Hobby allows **one cron job per day**. `vercel.json` runs at `0 6 * * *` (06:00 UTC). During Central European Summer Time that is **08:00 Europe/Berlin**, which matches this project's default send time. In winter (CET, UTC+1) 08:00 Berlin is 07:00 UTC — Hobby cannot add a second schedule.

### 15-minute external pinger (other send times)

If anyone needs a send hour other than 08:00 Berlin, ping the same endpoint about every 15 minutes from outside Vercel (GitHub Actions, cron-job.org, healthchecks.io, a cheap VPS):

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron"
```

The daily Vercel cron can stay in place; extra pings are cheap because of the send claim.

## Deploy

The GitHub repo is the production source. Create a Vercel project on the Hobby team, set the env vars, deploy, then set `APP_URL` to the real `https://` domain and redeploy so email links resolve.

After `APP_URL` is correct, send one live digest:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron"
```

That only sends to subscribers whose `nextSendAt` is due. To force the seeded reader onto this tick, set `nextSendAt` to now (or slightly in the past) in Neon, then call cron once.
