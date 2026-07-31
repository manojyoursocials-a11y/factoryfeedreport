import { NextRequest, NextResponse } from "next/server";
import { redis, TEMPLATE_DAILY_KEY, TEMPLATE_WEEKLY_KEY } from "@/lib/redis";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { DEFAULT_DAILY_TASKS, DEFAULT_WEEKLY_TASKS } from "@/lib/tasks";

export const runtime = "nodejs";

function isAuthed(req: NextRequest) {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

// PUT /api/admin/template  { daily, weekly }  -> save an edited task list
export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { daily, weekly } = await req.json();
  if (!Array.isArray(daily) || !Array.isArray(weekly)) {
    return NextResponse.json({ error: "daily and weekly must be arrays" }, { status: 400 });
  }

  await Promise.all([redis.set(TEMPLATE_DAILY_KEY, daily), redis.set(TEMPLATE_WEEKLY_KEY, weekly)]);

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/template  -> restore the original built-in task list
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await Promise.all([redis.del(TEMPLATE_DAILY_KEY), redis.del(TEMPLATE_WEEKLY_KEY)]);

  return NextResponse.json({ ok: true, daily: DEFAULT_DAILY_TASKS, weekly: DEFAULT_WEEKLY_TASKS });
}
