"use client";

import Link from "next/link";
import { useCoins } from "@/context/coins";

export default function Nav() {
  const { coins } = useCoins();

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
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/">Home</Link>
          <Link href="/regras">Regras (educativo)</Link>
          <Link href="/simular">Simular</Link>
          <Link href="/resultados">Resultados (estudo)</Link>
          <Link href="/sorteio">Sorteio (7 prêmios)</Link>
        </div>
        <div className="badge">
          <span className="dot" />
          Coins: <strong>{coins}</strong>
        </div>
      </div>
    </div>
  );
}
