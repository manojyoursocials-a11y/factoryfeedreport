import { NextRequest, NextResponse } from "next/server";
import { redis, REPORT_INDEX_KEY, reportKey } from "@/lib/redis";

export const runtime = "nodejs";

// GET /api/report?date=YYYY-MM-DD  -> load a day's saved checklist state
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });
  const data = await redis.get(reportKey(date));
  return NextResponse.json({ date, report: data || null });
}

// POST /api/report  { date, dailyState, weeklyState }  -> upsert today's state
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, dailyState, weeklyState } = body || {};
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const record = {
    date,
    dailyState: dailyState || {},
    weeklyState: weeklyState || {},
    savedAt: new Date().toISOString()
  };

  await redis.set(reportKey(date), record);
  await redis.zadd(REPORT_INDEX_KEY, { score: Date.now(), member: date });

  return NextResponse.json({ ok: true });
}
