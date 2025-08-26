export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyOTP, signJWT } from "@/lib/auth";

function getCookie(req, name) {
  const c = req.headers.get("cookie") || "";
  const m = c.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function POST(req) {
  const { email, code } = await req.json().catch(() => ({}));
  if (!email || !code) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }
  const token = getCookie(req, "edu_otp");
  if (!token)
    return NextResponse.json({ error: "Código não iniciado" }, { status: 400 });

  const payload = verifyOTP(token);
  if (!payload)
    return NextResponse.json(
      { error: "Token inválido/expirado" },
      { status: 400 }
    );
  if (
    payload.email !== email.toLowerCase() ||
    String(payload.code) !== String(code)
  ) {
    return NextResponse.json({ error: "Código incorreto" }, { status: 400 });
  }

  const session = signJWT({ email: email.toLowerCase() });
  const res = NextResponse.json({
    ok: true,
    user: { email: email.toLowerCase() },
  });

  // limpa otp
  res.cookies.set("edu_otp", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  // seta sessão
  res.cookies.set("edu_session", session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
