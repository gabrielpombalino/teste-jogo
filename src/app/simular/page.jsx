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
import GroupPicker from "@/components/GroupPicker";
import { useAuth } from "@/context/auth";
import RequireAuth from "@/components/RequireAuth";
import PlacementsPicker from "@/components/PlacementsPicker";
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
  const { user } = useAuth();
  const { coins, setCoins } = useCoins();
  const [mode, setMode] = useState("grupo");
  const [stake, setStake] = useState(10);
  const [selGrupo, setSelGrupo] = useState(1);
  const [selDezena, setSelDezena] = useState("");
  const [selCentena, setSelCentena] = useState("");
  const [selMilhar, setSelMilhar] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const lastPayloadRef = useRef(null);
  const [placements, setPlacements] = useState([1]);

  const canPlay = useMemo(
    () => Boolean(user) && coins > 0 && stake > 0 && stake <= MAX_STAKE,
    [user, coins, stake]
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

      if (typeof data?.balance === "number") setCoins(data.balance);

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
      payload = {
        mode,
        selection: Number(selGrupo),
        stake: Number(stake),
        placements,
      };
    } else if (mode === "dezena") {
      payload = {
        mode,
        selection: sanitizeDezena(selDezena),
        stake: Number(stake),
        placements,
      };
    } else if (mode === "centena") {
      payload = {
        mode,
        selection: sanitizeCentena(selCentena),
        stake: Number(stake),
        placements,
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

      {!user && (
        <div
          className="card"
          style={{ marginTop: 12, borderColor: "var(--warning)" }}
        >
          <strong>Você precisa estar logado para jogar.</strong>
          <p className="label">
            Use o botão “Entrar” no topo para acessar sua conta.
          </p>
        </div>
      )}
      <RequireAuth
        fallback={
          <div
            className="card"
            style={{ marginTop: 12, borderColor: "var(--warning)" }}
          >
            <strong>Você precisa estar logado para jogar.</strong>
            <p className="label">
              Use o botão “Entrar” no topo para acessar sua conta.
            </p>
          </div>
        }
      >
        {/* Form */}
        <form onSubmit={onSubmit} className="card" style={{ marginTop: 12 }}>
          <div className="row">
            {mode === "grupo" && (
              <div className="col" style={{ flex: "1 1 100%" }}>
                <div className="label">Grupo</div>
                <GroupPicker
                  groups={DEMO_ANIMALS}
                  value={selGrupo}
                  onChange={setSelGrupo}
                />
                <PlacementsPicker
                  mode={mode}
                  value={placements}
                  onChange={setPlacements}
                />
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
                <PlacementsPicker
                  mode={mode}
                  value={placements}
                  onChange={setPlacements}
                />
              </div>
            )}

            {mode === "centena" && (
              <div className="col">
                <div className="label">Centena</div>
                <input
                  className="input"
                  value={selCentena}
                  onChange={(e) =>
                    setSelCentena(sanitizeCentena(e.target.value))
                  }
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  placeholder="000"
                />
                <PlacementsPicker
                  mode={mode}
                  value={placements}
                  onChange={setPlacements}
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
                <PlacementsPicker
                  mode={mode}
                  value={placements}
                  onChange={setPlacements}
                />
              </div>
            )}
          </div>

          <div className="col" style={{ marginTop: 12 }}>
            <div className="col" style={{ marginTop: 12, marginBottom: 12 }}>
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

            <button className="button" disabled={!canPlay || loading}>
              {loading ? "Simulando..." : "Simular"}
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={async () => {
                const res = await fetch("/api/coins/reset", { method: "POST" });
                const json = await res.json().catch(() => ({}));
                if (res.ok && typeof json.balance === "number")
                  setCoins(json.balance);
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
                    <div className="label">Resumo</div>
                    <p>
                      Você{" "}
                      {result.win ? (
                        <span style={{ color: "var(--success)" }}>GANHOU</span>
                      ) : (
                        <span style={{ color: "var(--danger)" }}>
                          não ganhou
                        </span>
                      )}
                      {result.hits?.length ? (
                        <>
                          {" "}
                          — acertos nos prêmios:{" "}
                          <strong>{result.hits.join(", ")}º</strong>
                        </>
                      ) : null}{" "}
                      • stake total: <strong>{result.appliedStake}</strong> •
                      colocações:{" "}
                      <strong>
                        {result.consideredPlacements?.join(", ")}º
                      </strong>{" "}
                      • stake/colocação:{" "}
                      <strong>{Math.round(result.perPlacementStake)}</strong> •
                      prêmio por acerto: <strong>{result.perHitPayout}</strong>{" "}
                      • prêmio total: <strong>{result.payoutCoins}</strong> •
                      novo saldo:{" "}
                      <strong>
                        {typeof result.balance === "number"
                          ? result.balance
                          : "-"}
                      </strong>
                    </p>
                    <small className="muted">
                      Regra: o 7º prêmio está disponível para{" "}
                      <strong>Grupo</strong>, <strong>Dezena</strong> e{" "}
                      <strong>Centena</strong>. No modo <strong>Milhar</strong>,
                      o 7º não está disponível.
                    </small>
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

                      <th>Grupo · Animal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.prizes.map((p) => {
                      const isMilhar = p.kind === "milhar";
                      const shown = isMilhar
                        ? pad(p.value, 4)
                        : pad(p.value, 3);
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

                          <td>
                            Grupo {p.group} — {animal?.name}
                            <div className="label">
                              ({animal?.dezenas.join(", ")})
                            </div>
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
      </RequireAuth>
    </main>
  );
}
