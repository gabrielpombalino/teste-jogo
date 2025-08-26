"use client";

import Link from "next/link";
import { useState } from "react";
import { useCoins } from "@/context/coins";
import { useAuth } from "@/context/auth";
import LoginModal from "@/components/LoginModal";

export default function Nav() {
  const { coins } = useCoins();
  const { user, busy, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div
      style={{ borderBottom: "1px solid var(--border)", background: "#0b0d12" }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 24px",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/">Home</Link>
          <Link href="/regras">Regras (educativo)</Link>
          <Link href="/simular">Simular</Link>
          {/* <Link href="/sorteio">Sorteio (7 prêmios)</Link> */}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="badge">
            <span className="dot" /> Coins: <strong>{coins}</strong>
          </div>

          {!busy &&
            (user ? (
              <>
                <small
                  className="muted"
                  title={user.email}
                  style={{
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </small>
                <button className="button ghost" onClick={logout}>
                  Sair
                </button>
              </>
            ) : (
              <button className="button" onClick={() => setLoginOpen(true)}>
                Entrar
              </button>
            ))}
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
