// src/app/simular/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCoins } from "@/context/coins";
import {
  DEMO_ANIMALS,
  sanitizeDezena,
  sanitizeCentena,
  sanitizeMilhar,
  animalForGroupId,
} from "@/lib/animals";

const MAX_STAKE = 50;

const TABS = [
  { id: "grupo", label: "Grupo" },
  { id: "dezena", label: "Dezena" },
  { id: "centena", label: "Centena" },
  { id: "milhar", label: "Milhar" },
];

function pad(value, len) {
  return String(value).padStart(len, "0");
}

export default function Simular() {
  const { coins, addCoins, subCoins } = useCoins();
  const [mode, setMode] = useState("grupo");
  const [stake, setStake] = useState(10);
  const [selGrupo, setSelGrupo] = useState(1);
  const [selDezena, setSelDezena] = useState("");
  const [selCentena, setSelCentena] = useState("");
  const [selMilhar, setSelMilhar] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const lastPayloadRef = useRef(null);

  const canPlay = useMemo(
    () => coins > 0 && stake > 0 && stake <= MAX_STAKE,
    [coins, stake]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "r" && lastPayloadRef.current && !loading) {
        submit(lastPayloadRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading]);

  async function submit(payload) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ error: data?.error || "Falha na simulação." });
        return;
      }

      if (data?.appliedStake > 0) subCoins(data.appliedStake);
      if (data?.payoutCoins > 0) addCoins(data.payoutCoins);

      setResult(data);
    } catch {
      setResult({ error: "Falha na simulação." });
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (e) => {
    e.preventDefault();
    if (!canPlay) return;

    let payload;
    if (mode === "grupo") {
      payload = { mode, selection: Number(selGrupo), stake: Number(stake) };
    } else if (mode === "dezena") {
      payload = {
        mode,
        selection: sanitizeDezena(selDezena),
        stake: Number(stake),
      };
    } else if (mode === "centena") {
      payload = {
        mode,
        selection: sanitizeCentena(selCentena),
        stake: Number(stake),
      };
    } else {
      payload = {
        mode,
        selection: sanitizeMilhar(selMilhar),
        stake: Number(stake),
      };
    }

    lastPayloadRef.current = payload;
    submit(payload);
  };

  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>Simulação Educativa (7 prêmios)</h1>
      <p className="label">Escolha um modo de aposta:</p>

      {/* Tabs */}
      <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`button ${mode === t.id ? "" : "ghost"}`}
            onClick={() => setMode(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="card" style={{ marginTop: 12 }}>
        <div className="row">
          {mode === "grupo" && (
            <div className="col">
              <div className="label">Grupo</div>
              <select
                className="select"
                value={selGrupo}
                onChange={(e) => setSelGrupo(Number(e.target.value))}
              >
                {DEMO_ANIMALS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id} — {g.name} ({g.dezenas.join(", ")})
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "dezena" && (
            <div className="col">
              <div className="label">Dezena</div>
              <input
                className="input"
                value={selDezena}
                onChange={(e) => setSelDezena(sanitizeDezena(e.target.value))}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                placeholder="00"
              />
            </div>
          )}

          {mode === "centena" && (
            <div className="col">
              <div className="label">Centena</div>
              <input
                className="input"
                value={selCentena}
                onChange={(e) => setSelCentena(sanitizeCentena(e.target.value))}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={3}
                placeholder="000"
              />
            </div>
          )}

          {mode === "milhar" && (
            <div className="col">
              <div className="label">Milhar</div>
              <input
                className="input"
                value={selMilhar}
                onChange={(e) => setSelMilhar(sanitizeMilhar(e.target.value))}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="0000"
              />
            </div>
          )}

          <div className="col">
            <div className="label">Stake (coins)</div>
            <input
              className="input"
              type="number"
              value={stake}
              min={1}
              max={MAX_STAKE}
              onChange={(e) => setStake(Number(e.target.value))}
            />
            <small className="muted">
              Máximo por simulação: {MAX_STAKE} coins
            </small>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="button" disabled={!canPlay || loading}>
            {loading ? "Simulando..." : "Simular"}
          </button>
          <button
            type="button"
            className="button ghost"
            onClick={() => {
              localStorage.setItem("edu_coins", "1000");
              window.location.reload();
            }}
          >
            Resetar coins (1000)
          </button>
        </div>
      </form>

      {/* Resultado */}
      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          {result.error ? (
            <p style={{ color: "var(--danger)" }}>{result.error}</p>
          ) : (
            <>
              <div className="row">
                <div className="col">
                  <div className="label">Seed</div>
                  <code style={{ userSelect: "all" }}>{result.seed}</code>
                </div>
                <div className="col">
                  <div className="label">Timestamp</div>
                  <code style={{ userSelect: "all" }}>{result.timestamp}</code>
                </div>
              </div>

              <hr />

              <div className="row">
                <div className="col">
                  <div className="label">Resumo</div>
                  <p>
                    Você{" "}
                    {result.win ? (
                      <span style={{ color: "var(--success)" }}>GANHOU</span>
                    ) : (
                      <span style={{ color: "var(--danger)" }}>não ganhou</span>
                    )}
                    {result.hits?.length ? (
                      <>
                        {" "}
                        — acertos nos prêmios:{" "}
                        <strong>{result.hits.join(", ")}º</strong>
                      </>
                    ) : null}{" "}
                    • stake: <strong>{result.appliedStake}</strong> • payout:{" "}
                    <strong>{result.payoutCoins}</strong>
                  </p>
                  <small className="muted">
                    Multiplicadores (educativo): grupo=
                    {result.multipliers.grupo}x · dezena=
                    {result.multipliers.dezena}x · centena=
                    {result.multipliers.centena}x · milhar=
                    {result.multipliers.milhar}x
                  </small>
                </div>
              </div>

              <hr />

              {/* Tabela dos 7 prêmios */}
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
                  {result.prizes.map((p) => {
                    const isMilhar = p.kind === "milhar";
                    const shown = isMilhar ? pad(p.value, 4) : pad(p.value, 3);
                    const dez = pad(p.dezena, 2);
                    const animal = animalForGroupId(p.group);
                    const isHit = result.hits?.includes(p.idx);

                    return (
                      <tr
                        key={p.idx}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: isHit
                            ? "rgba(52,211,153,.12)"
                            : "transparent",
                        }}
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
            </>
          )}
        </div>
      )}
    </main>
  );
}
