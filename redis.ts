import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the
// environment. These are added automatically when you connect an Upstash
// Redis database to your Vercel project through the Storage tab.
export const redis = Redis.fromEnv();

export const REPORT_INDEX_KEY = "ff:reports:index"; // sorted set: member=date, score=timestamp
export const reportKey = (date: string) => `ff:report:${date}`;
