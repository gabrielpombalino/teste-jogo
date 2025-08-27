// src/app/api/coins/reset/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { setBalance } from "@/lib/coins-blob";

export async function POST(req) {
  const user = getUserFromCookie(req);
  if (!user?.email)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const next = await setBalance(user.email, 1000.0);
  return NextResponse.json({ ok: true, balance: next });
}
