"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth";

export default function LoginModal({ open, onClose }) {
  const { refresh } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [devCode, setDevCode] = useState(""); // visível só no dev
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function start() {
    setLoading(true);
    setErr("");
    setDevCode("");
    try {
      const res = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "Falha ao iniciar");
        return;
      }

      if (json?.devCode) setDevCode(json.devCode); // mostrado só sem RESEND_API_KEY
      setStep(2);
    } catch {
      setErr("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: inputCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "Código inválido");
        return;
      }
      await refresh();
      onClose?.();
    } catch {
      setErr("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        display: "grid",
        placeItems: "center",
        zIndex: 70,
      }}
    >
      <div
        className="card"
        style={{ width: 480, maxWidth: "calc(100% - 24px)" }}
      >
        <h2 style={{ marginTop: 0 }}>Entrar</h2>

        {step === 1 && (
          <>
            <div className="label">E-mail</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
            <div className="row" style={{ marginTop: 12 }}>
              <button
                className="button"
                onClick={start}
                disabled={loading || !email}
              >
                {loading ? "Enviando..." : "Enviar código"}
              </button>
              <button className="button ghost" onClick={onClose}>
                Cancelar
              </button>
            </div>
            {devCode && (
              <p className="label" style={{ marginTop: 8 }}>
                <strong>Código (DEV):</strong> {devCode}
              </p>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <p className="label">
              Enviamos um código para <strong>{email}</strong>.
            </p>
            <div className="label">Digite o código (6 dígitos)</div>
            <input
              className="input"
              value={inputCode}
              onChange={(e) =>
                setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
            />
            <div className="row" style={{ marginTop: 12 }}>
              <button
                className="button"
                onClick={verify}
                disabled={loading || inputCode.length !== 6}
              >
                {loading ? "Verificando..." : "Entrar"}
              </button>
              <button className="button ghost" onClick={() => setStep(1)}>
                Voltar
              </button>
            </div>
          </>
        )}

        {err && <p style={{ color: "var(--danger)", marginTop: 12 }}>{err}</p>}
      </div>
    </div>
  );
}
