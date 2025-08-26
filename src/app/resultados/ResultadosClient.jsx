"use client";

import { useEffect, useState } from "react";

export default function ResultadosClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [payload, setPayload] = useState(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || "Falha ao carregar");
      } else {
        setPayload(json);
      }
    } catch {
      setErr("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>Dados externos (para estudo técnico)</h1>
      <p className="label">
        Esta página demonstra consumo de uma API pública/segura definida via{" "}
        <code>SAFE_API_URL</code>.
      </p>

      <div className="row" style={{ marginTop: 8 }}>
        <button className="button" onClick={load} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {err && (
        <div
          className="card"
          style={{ marginTop: 12, borderColor: "var(--danger)" }}
        >
          <strong style={{ color: "var(--danger)" }}>Erro:</strong> {err}
        </div>
      )}

      {payload && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="label">Carimbo</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(payload.stamp, null, 2)}
          </pre>

          <div className="label" style={{ marginTop: 8 }}>
            Itens normalizados
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            {payload.items.map((it) => (
              <div key={it.id} className="card">
                <strong>{it.title}</strong>
                <div className="label">Detalhes</div>
                <div>{it.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !err && !payload && <p className="label">Sem dados.</p>}
    </main>
  );
}
