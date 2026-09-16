import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

async function unsubscribe(token: string | null) {
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }
  const store = getStore();
  const subscriber = await store.getByToken(token);
  if (!subscriber) {
    return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 404 });
  }
  await store.update(subscriber.id, { status: "unsubscribed" });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const contentType = request.headers.get("content-type") || "";
  let token = url.searchParams.get("token");
  if (!token && contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { token?: string } | null;
    token = body?.token ?? null;
  } else if (!token && contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    token = String(form.get("token") || "");
  }
  return unsubscribe(token);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  return unsubscribe(token);
}
