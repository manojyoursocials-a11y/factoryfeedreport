import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the
// environment. These are added automatically when you connect an Upstash
// Redis database to your Vercel project through the Storage tab.
export const redis = Redis.fromEnv();

export const REPORT_INDEX_KEY = "ff:reports:index"; // sorted set: member=date, score=timestamp
export const reportKey = (date: string) => `ff:report:${date}`;

// Admin-editable task lists. When absent, the app falls back to the
// built-in defaults in lib/tasks.ts.
export const TEMPLATE_DAILY_KEY = "ff:template:daily";
export const TEMPLATE_WEEKLY_KEY = "ff:template:weekly";
