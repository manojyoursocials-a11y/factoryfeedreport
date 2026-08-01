import { NextRequest, NextResponse } from "next/server";
import { redis, REPORT_INDEX_KEY, reportKey } from "@/lib/redis";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { PREPARED_BY_KEY } from "@/lib/tasks";

export const runtime = "nodejs";

function isAuthed(req: NextRequest) {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

// GET /api/admin/reports          -> every saved daily sheet (one per visit), newest first
// GET /api/admin/reports?date=... -> full detail for one specific sheet key or weekly key
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  if (date) {
    const data = await redis.get(reportKey(date));
    return NextResponse.json({ date, report: data || null });
  }

  const keys = await redis.zrange<string[]>(REPORT_INDEX_KEY, 0, -1, { rev: true });
  const dailyKeys = keys.filter((k) => !k.startsWith("weekly-"));

  const sheets = await Promise.all(
    dailyKeys.map(async (key) => {
      const data: any = await redis.get(reportKey(key));
      const [datePart] = key.split("::");
      const preparedByRaw = data?.dailyState?.[PREPARED_BY_KEY];
      const preparedBy = Array.isArray(preparedByRaw)
        ? preparedByRaw.join(", ")
        : preparedByRaw || "Unnamed";
      return { key, date: datePart, preparedBy, savedAt: data?.savedAt || null };
    })
  );

  return NextResponse.json({ sheets });
}
