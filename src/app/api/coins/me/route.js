export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { getBalance } from "@/lib/coins-blob";

export async function GET(req) {
  const user = getUserFromCookie(req);
  if (!user?.email)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const balance = await getBalance(user.email);
  return NextResponse.json({ email: user.email, balance });
}
