"use client";

import { useState } from "react";
import { DEMO_ANIMALS, animalForGroupId } from "@/lib/animals";

function pad(value, len) {
  return String(value).padStart(len, "0");
}

export default function SorteioClient() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  async function gerar() {
    setLoading(true);
    setErr("");
    setData(null);
    try {
      const res = await fetch("/api/draw7", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || "Falha ao gerar sorteio.");
        return;
      }
      setData(json);
    } catch {
      setErr("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>Sorteio educativo — 7 prêmios</h1>
      <p className="label">
        Gera 5 <strong>milhares</strong>, o <strong>6º</strong> como soma dos
        cinco (mod 10000) e o <strong>7º</strong> como a{" "}
        <em>penúltima centena</em> do produto do 1º × 2º. Ao lado de cada
        número, mostramos a <strong>dezena</strong> e o <strong>grupo</strong>.
      </p>

      <div className="row" style={{ marginTop: 8 }}>
        <button className="button" onClick={gerar} disabled={loading}>
          {loading ? "Gerando..." : "Gerar 7 prêmios"}
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

      {data && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row">
            <div className="col">
              <div className="label">Seed</div>
              <code style={{ userSelect: "all" }}>{data.seed}</code>
            </div>
            <div className="col">
              <div className="label">Timestamp</div>
              <code style={{ userSelect: "all" }}>{data.timestamp}</code>
            </div>
          </div>

          <hr />

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th>#</th>
                <th>Tipo</th>
                <th>Número</th>
                <th>Dezena</th>
                <th>Grupo · Animal</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {data.prizes.map((p) => {
                const isMilhar = p.kind === "milhar";
                const shown = isMilhar ? pad(p.value, 4) : pad(p.value, 3);
                const dez = pad(p.dezena, 2);
                const animal = animalForGroupId(p.group);

                return (
                  <tr
                    key={p.idx}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td>{p.idx}º</td>
                    <td>{isMilhar ? "Milhar" : "Centena"}</td>
                    <td>
                      <strong>{shown}</strong>
                    </td>
                    <td>{dez}</td>
                    <td>
                      Grupo {p.group} — {animal?.name}
                      <div className="label">
                        (dezenas DEMO: {animal?.dezenas.join(", ")})
                      </div>
                    </td>
                    <td>
                      <small className="muted">
                        {p.from === "sum(m1..m5) % 10000" &&
                          "Soma dos 5 (mod 10000)"}
                        {p.from === "penultima-centena(m1*m2)" &&
                          "Penúltima centena do produto do 1º×2º"}
                      </small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="card" style={{ marginTop: 12 }}>
            <strong>Notas educativas</strong>
            <ul>
              <li>
                O <em>grupo</em> é determinado pela <strong>dezena</strong>{" "}
                (últimos 2 dígitos): mapeamos 00–99 para 25 grupos com 4 dezenas
                cada (DEMO).
              </li>
              <li>6º prêmio = soma dos 5 primeiros milhares (mod 10000).</li>
              <li>
                7º prêmio = <em>penúltima centena</em> de (1º × 2º), isto é:{" "}
                <code>floor(produto/100) % 1000</code>.
              </li>
            </ul>
          </div>
        </div>
      )}

      {!loading && !err && !data && (
        <p className="label" style={{ marginTop: 12 }}>
          Clique em “Gerar 7 prêmios” para ver o sorteio didático.
        </p>
      )}
    </main>
  );
}
