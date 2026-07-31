import { NextRequest, NextResponse } from "next/server";
import { redis, REPORT_INDEX_KEY, reportKey } from "@/lib/redis";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

function isAuthed(req: NextRequest) {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

// GET /api/admin/reports            -> list of all saved dates, newest first
// GET /api/admin/reports?date=...   -> full detail for one date
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  if (date) {
    const data = await redis.get(reportKey(date));
    return NextResponse.json({ date, report: data || null });
  }

  const dates = await redis.zrange<string[]>(REPORT_INDEX_KEY, 0, -1, { rev: true });
  return NextResponse.json({ dates });
}
