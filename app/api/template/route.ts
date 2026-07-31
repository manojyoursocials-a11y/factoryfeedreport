import { NextResponse } from "next/server";
import { redis, TEMPLATE_DAILY_KEY, TEMPLATE_WEEKLY_KEY } from "@/lib/redis";
import { DEFAULT_DAILY_TASKS, DEFAULT_WEEKLY_TASKS } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET() {
  const [daily, weekly] = await Promise.all([
    redis.get(TEMPLATE_DAILY_KEY),
    redis.get(TEMPLATE_WEEKLY_KEY)
  ]);
  return NextResponse.json({
    daily: daily || DEFAULT_DAILY_TASKS,
    weekly: weekly || DEFAULT_WEEKLY_TASKS
  });
}
