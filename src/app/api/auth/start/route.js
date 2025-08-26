export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { signOTP } from "@/lib/auth";

const resendKey = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Simulador <no-reply@example.com>";
const resend = resendKey ? new Resend(resendKey) : null;

function htmlTemplate({ code, email }) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto">
    <h2>Seu código de acesso</h2>
    <p>Olá, ${email}!</p>
    <p>Use este código para entrar:</p>
    <div style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</div>
    <p style="color:#555">O código expira em 5 minutos.</p>
  </div>`;
}

export async function POST(req) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
  const otpToken = signOTP(email, code, { expSec: 5 * 60 });

  // seta cookie httpOnly com o OTP assinado (não expõe o code ao JS)
  const res = NextResponse.json({
    ok: true,
    email: email.toLowerCase(),
    // No DEV (sem RESEND_API_KEY) retornamos o código pra facilitar teste:
    devCode: resend ? undefined : code,
  });
  res.cookies.set("edu_otp", otpToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 5 * 60,
  });

  // Envia e-mail se houver chave da Resend
  if (resend) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email.toLowerCase(),
        subject: "Seu código de acesso",
        html: htmlTemplate({ code, email }),
      });
    } catch (e) {
      // Se falhar envio, ainda deixamos o OTP cookie setado para tentar de novo
      return NextResponse.json(
        { error: "Falha ao enviar e-mail" },
        { status: 500 }
      );
    }
  }

  return res;
}
