import { NextResponse } from "next/server";
import { cronAuthorized, runCronTick } from "@/lib/cron";

export const runtime = "nodejs";
export const maxDuration = 60;

async function handle(request: Request) {
  const url = new URL(request.url);
  const authorized = cronAuthorized(
    request.headers.get("authorization"),
    url.searchParams.get("secret"),
  );
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCronTick();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
