import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.ADMIN_PASSWORD;

  if (!correct) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not set on the server. Add it in Vercel's Environment Variables." },
      { status: 500 }
    );
  }

  if (password !== correct) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12 // 12 hours
  });
  return res;
}
