// src/app/api/auth/me/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";

export async function GET(req) {
  const user = getUserFromCookie(req);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user });
}
