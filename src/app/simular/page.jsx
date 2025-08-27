// src/app/simular/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { useCoins } from "@/context/coins";

import { BetBuilderProvider, useBetBuilder } from "@/context/bet-builder";

import GroupPicker from "@/components/GroupPicker";
import PlacementsPicker from "@/components/PlacementsPicker";
import SelectionPricingPicker from "@/components/SelectionPricingPicker";

import {
  DEMO_ANIMALS,
  sanitizeDezena,
  sanitizeCentena,
  sanitizeMilhar,
  animalForGroupId,
} from "@/lib/animals";

const fmt = (n) =>
  Number.isFinite(n)
    ? n.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "-";
const pad = (v, len) => String(v).padStart(len, "0");

/* =========================
 * Step 1 — Tipo de jogo
 * =======================*/
function StepMode() {
  const { mode, setMode, setStep } = useBetBuilder();
  const TABS = [
    { id: "grupo", label: "Grupo" },
    { id: "dezena", label: "Dezena" },
    { id: "centena", label: "Centena" },
    { id: "milhar", label: "Milhar" },
  ];
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>1) Escolha o tipo de jogo</h2>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
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
      <div className="row" style={{ marginTop: 12 }}>
        <button className="button" disabled={!mode} onClick={() => setStep(2)}>
          Continuar
        </button>
      </div>
    </div>
  );
}

/* =========================
 * Step 2 — Seleções
 * =======================*/
function StepSelections() {
  const { mode, selections, setSelections, setStep } = useBetBuilder();
  const [local, setLocal] = useState(selections);

  // para grupos (usamos GroupPicker para escolher 1 por vez e "adicionar")
  const [currentGroup, setCurrentGroup] = useState(1);

  useEffect(() => {
    setLocal(selections);
  }, [selections]);

  function addField() {
    setLocal((arr) => [...arr, ""]);
  }
  function removeField(i) {
    setLocal((arr) => arr.filter((_, idx) => idx !== i));
  }
  function updateField(i, val) {
    let v = val;
    if (mode === "dezena") v = sanitizeDezena(val);
    if (mode === "centena") v = sanitizeCentena(val);
    if (mode === "milhar") v = sanitizeMilhar(val);
    setLocal((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  }
  function saveAndNext() {
    const clean = (local || []).map((x) => String(x).trim()).filter(Boolean);
    setSelections(clean.length ? clean : []);
    if (clean.length) setStep(3);
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>2) Selecione as apostas</h2>

      {mode === "grupo" ? (
        <>
          <div className="label">Escolha um grupo e adicione à lista</div>
          <GroupPicker
            groups={DEMO_ANIMALS}
            value={currentGroup}
            onChange={setCurrentGroup}
          />
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="button"
              onClick={() =>
                setLocal((prev) => {
                  const set = new Set(prev || []);
                  set.add(currentGroup);
                  return Array.from(set);
                })
              }
            >
              Adicionar grupo
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => setLocal([])}
            >
              Limpar lista
            </button>
          </div>

          {local?.length > 0 && (
            <>
              <div className="label" style={{ marginTop: 12 }}>
                Grupos selecionados:
              </div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {local.map((gid, i) => {
                  const g = DEMO_ANIMALS.find((x) => x.id === gid);
                  return (
                    <span
                      key={`${gid}-${i}`}
                      className="badge"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {String(gid).padStart(2, "0")} — {g?.name}
                      <button
                        type="button"
                        className="button ghost"
                        onClick={() => {
                          setLocal((arr) => arr.filter((_, idx) => idx !== i));
                        }}
                        style={{ padding: "2px 6px" }}
                        title="Remover"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="label">
            {mode === "dezena" && "Dezenas (00–99)"}
            {mode === "centena" && "Centenas (000–999)"}
            {mode === "milhar" && "Milhares (0000–9999)"}
          </div>
          {local.length === 0 && (
            <button type="button" className="button ghost" onClick={addField}>
              Adicionar
            </button>
          )}
          {local.map((v, i) => (
            <div
              className="row"
              key={i}
              style={{ alignItems: "center", gap: 8, marginTop: 8 }}
            >
              <input
                className="input"
                value={v}
                onChange={(e) => updateField(i, e.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={
                  mode === "dezena" ? "00" : mode === "centena" ? "000" : "0000"
                }
                maxLength={mode === "dezena" ? 2 : mode === "centena" ? 3 : 4}
                style={{ width: 160 }}
              />
              <button
                type="button"
                className="button ghost"
                onClick={() => removeField(i)}
              >
                Remover
              </button>
            </div>
          ))}
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button type="button" className="button ghost" onClick={addField}>
              Adicionar
            </button>
          </div>
        </>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="button ghost" onClick={() => setStep(1)}>
          Voltar
        </button>
        <button
          className="button"
          disabled={!local || local.length === 0}
          onClick={saveAndNext}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

/* ==========================================
 * Step 3 — Colocações & valores (aposta base)
 *  - valor SEMPRE dividido por colocações
 *  - “Para cada / Dividir” só quando 2+ seleções
 * ========================================*/
function StepPlacementsAndPricing() {
  const {
    mode,
    selections,
    placements,
    setPlacements,
    selectionPricing,
    setSelectionPricing,
    stake,
    setStake,
    resetStakes,
    setStep,
  } = useBetBuilder();

  const n = selections?.length || 0;
  const k = placements?.length || 0;

  const hasMultiSelections = n > 1;
  const stakePorColocacao = k > 0 ? Math.floor((stake * 100) / k) / 100 : 0;
  const custoTotal =
    hasMultiSelections && selectionPricing === "each"
      ? (Math.round(stake * 100) * n) / 100
      : stake;
  const stakePorSelecao =
    hasMultiSelections && selectionPricing === "split"
      ? Math.floor((stake * 100) / n) / 100
      : stake;

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>3) Colocações & valores (aposta base)</h2>

      <PlacementsPicker
        mode={mode}
        value={placements}
        onChange={setPlacements}
      />

      {/* SEMPRE dividir por colocações */}
      <small className="muted" style={{ display: "block", marginTop: 8 }}>
        Valor é <b>sempre dividido</b> pelas colocações escolhidas. Ex.: stake{" "}
        {fmt(stake)} e {k} colocações → stake por colocação ={" "}
        <b>{fmt(stakePorColocacao)}</b>.
      </small>

      {/* Para cada vs Dividir (somente com 2+ seleções) */}
      <SelectionPricingPicker
        selectionsCount={n}
        selectionPricing={selectionPricing}
        onChange={setSelectionPricing}
      />

      <div className="label" style={{ marginTop: 12 }}>
        Stake (coins)
      </div>
      <input
        className="input"
        type="number"
        step="0.01"
        min={0.01}
        max={50}
        value={stake}
        onChange={(e) => {
          const raw = Number(e.target.value);
          if (!Number.isFinite(raw)) return;
          const clamped = Math.max(0.01, Math.min(50, raw));
          setStake(Math.round(clamped * 100) / 100);
        }}
        style={{ maxWidth: 200 }}
      />

      <div className="row" style={{ gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        <span className="label">
          Seleções: <b>{n}</b>
        </span>
        <span className="label">
          Colocações: <b>{k}</b>
        </span>
        <span className="label">
          Stake/colocação: <b>{fmt(stakePorColocacao)}</b>
        </span>
        {hasMultiSelections && (
          <>
            <span className="label">
              Stake/seleção: <b>{fmt(stakePorSelecao)}</b>
            </span>
            <span className="label">
              Custo total (antes do resultado): <b>{fmt(custoTotal)}</b>
            </span>
          </>
        )}
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="button ghost" onClick={() => setStep(2)}>
          Voltar
        </button>
        <button className="button" onClick={() => setStep(4)}>
          Continuar
        </button>
        <button
          className="button ghost"
          type="button"
          onClick={resetStakes}
          title="Zera apenas os valores das stakes"
        >
          Resetar stakes
        </button>
      </div>
    </div>
  );
}

/* =========================
 * Step 4 — Vales (opcionais)
 * =======================*/
function StepVales() {
  const {
    mode,
    selections,
    derived,
    valeCentena,
    setValeCentena,
    centenaCfg,
    setCentenaCfg,
    valeGrupo,
    setValeGrupo,
    grupoCfg,
    setGrupoCfg,
    setStep,
    resetStakes,
  } = useBetBuilder();

  const n = selections?.length || 0;
  const canCentena = mode === "milhar";
  const canGrupo = ["milhar", "centena", "dezena"].includes(mode);

  const preview = (s, k, n, selectionPricing) => {
    const stakePorCol = k > 0 ? Math.floor((s * 100) / k) / 100 : 0;
    const stakeSel =
      selectionPricing === "split" && n > 1
        ? Math.floor((s * 100) / n) / 100
        : s;
    const custo =
      selectionPricing === "each" && n > 1
        ? (Math.round(s * 100) * n) / 100
        : s;
    return { stakePorCol, stakeSel, custo };
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>4) “Vale” outros jogos (opcional)</h2>

      {canCentena && (
        <div className="card" style={{ marginTop: 12 }}>
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <strong>Vale Centena</strong>
            <label>
              <input
                type="checkbox"
                checked={valeCentena}
                onChange={(e) => setValeCentena(e.target.checked)}
              />{" "}
              Ativar
            </label>
          </div>
          {valeCentena &&
            (() => {
              const k = centenaCfg.placements.length;
              const pv = preview(
                centenaCfg.stake,
                k,
                n,
                centenaCfg.selectionPricing
              );
              return (
                <>
                  <div className="label" style={{ marginTop: 8 }}>
                    Selecionadas (derivadas da milhar):{" "}
                    {derived.centena
                      ?.map((c) => String(c).padStart(3, "0"))
                      .join(", ")}
                  </div>
                  <PlacementsPicker
                    mode={"centena"}
                    value={centenaCfg.placements}
                    onChange={(v) =>
                      setCentenaCfg({ ...centenaCfg, placements: v })
                    }
                  />
                  <small className="muted" style={{ display: "block" }}>
                    Valor é <b>sempre dividido</b> pelas colocações. Stake/
                    colocação: <b>{fmt(pv.stakePorCol)}</b>.
                  </small>

                  {n > 1 && (
                    <div className="card" style={{ marginTop: 12 }}>
                      <div className="label">Aplicação entre seleções</div>
                      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className={`button ${
                            centenaCfg.selectionPricing === "each"
                              ? ""
                              : "ghost"
                          }`}
                          onClick={() =>
                            setCentenaCfg({
                              ...centenaCfg,
                              selectionPricing: "each",
                            })
                          }
                        >
                          Para cada
                        </button>
                        <button
                          type="button"
                          className={`button ${
                            centenaCfg.selectionPricing === "split"
                              ? ""
                              : "ghost"
                          }`}
                          onClick={() =>
                            setCentenaCfg({
                              ...centenaCfg,
                              selectionPricing: "split",
                            })
                          }
                        >
                          Dividir
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="label" style={{ marginTop: 8 }}>
                    Stake (coins)
                  </div>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min={0.01}
                    max={50}
                    value={centenaCfg.stake}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (!Number.isFinite(raw)) return;
                      const clamped = Math.max(0.01, Math.min(50, raw));
                      setCentenaCfg({
                        ...centenaCfg,
                        stake: Math.round(clamped * 100) / 100,
                      });
                    }}
                    style={{ maxWidth: 200 }}
                  />
                  <div
                    className="row"
                    style={{ gap: 12, marginTop: 8, flexWrap: "wrap" }}
                  >
                    <span className="label">
                      Seleções: <b>{n}</b>
                    </span>
                    <span className="label">
                      Colocações: <b>{k}</b>
                    </span>
                    <span className="label">
                      Stake/seleção: <b>{fmt(pv.stakeSel)}</b>
                    </span>
                    <span className="label">
                      Custo total: <b>{fmt(pv.custo)}</b>
                    </span>
                  </div>
                </>
              );
            })()}
        </div>
      )}

      {canGrupo && (
        <div className="card" style={{ marginTop: 12 }}>
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <strong>Vale Grupo</strong>
            <label>
              <input
                type="checkbox"
                checked={valeGrupo}
                onChange={(e) => setValeGrupo(e.target.checked)}
              />{" "}
              Ativar
            </label>
          </div>
          {valeGrupo &&
            (() => {
              const k = grupoCfg.placements.length;
              const pv = preview(
                grupoCfg.stake,
                k,
                n,
                grupoCfg.selectionPricing
              );
              return (
                <>
                  <div className="label" style={{ marginTop: 8 }}>
                    Grupos derivados: {derived.grupo?.join(", ")}
                  </div>
                  <PlacementsPicker
                    mode={"grupo"}
                    value={grupoCfg.placements}
                    onChange={(v) =>
                      setGrupoCfg({ ...grupoCfg, placements: v })
                    }
                  />
                  <small className="muted" style={{ display: "block" }}>
                    Valor é <b>sempre dividido</b> pelas colocações. Stake/
                    colocação: <b>{fmt(pv.stakePorCol)}</b>.
                  </small>

                  {n > 1 && (
                    <div className="card" style={{ marginTop: 12 }}>
                      <div className="label">Aplicação entre seleções</div>
                      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className={`button ${
                            grupoCfg.selectionPricing === "each" ? "" : "ghost"
                          }`}
                          onClick={() =>
                            setGrupoCfg({
                              ...grupoCfg,
                              selectionPricing: "each",
                            })
                          }
                        >
                          Para cada
                        </button>
                        <button
                          type="button"
                          className={`button ${
                            grupoCfg.selectionPricing === "split" ? "" : "ghost"
                          }`}
                          onClick={() =>
                            setGrupoCfg({
                              ...grupoCfg,
                              selectionPricing: "split",
                            })
                          }
                        >
                          Dividir
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="label" style={{ marginTop: 8 }}>
                    Stake (coins)
                  </div>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min={0.01}
                    max={50}
                    value={grupoCfg.stake}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (!Number.isFinite(raw)) return;
                      const clamped = Math.max(0.01, Math.min(50, raw));
                      setGrupoCfg({
                        ...grupoCfg,
                        stake: Math.round(clamped * 100) / 100,
                      });
                    }}
                    style={{ maxWidth: 200 }}
                  />
                  <div
                    className="row"
                    style={{ gap: 12, marginTop: 8, flexWrap: "wrap" }}
                  >
                    <span className="label">
                      Seleções: <b>{n}</b>
                    </span>
                    <span className="label">
                      Colocações: <b>{k}</b>
                    </span>
                    <span className="label">
                      Stake/seleção: <b>{fmt(pv.stakeSel)}</b>
                    </span>
                    <span className="label">
                      Custo total: <b>{fmt(pv.custo)}</b>
                    </span>
                  </div>
                </>
              );
            })()}
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="button ghost" onClick={() => setStep(3)}>
          Voltar
        </button>
        <button className="button" onClick={() => setStep(5)}>
          Continuar
        </button>
        <button
          className="button ghost"
          type="button"
          onClick={resetStakes}
          title="Zera apenas os valores das stakes"
        >
          Resetar stakes
        </button>
      </div>
    </div>
  );
}

/* ==================================
 * Step 5 — Revisar & Simular (POST)
 * =================================*/
function StepReviewAndSimulate() {
  const { legs, setStep } = useBetBuilder();
  const { setCoins } = useCoins();
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);

  async function simulate() {
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/simulate/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legs }),
      });
      const json = await r.json();
      if (!r.ok) {
        setRes({ error: json?.error || "Falha" });
        return;
      }
      setRes(json);
      if (typeof json?.totals?.balance === "number")
        setCoins(json.totals.balance);
    } catch {
      setRes({ error: "Falha" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>5) Revisar e Simular</h2>

      {legs.length === 0 ? (
        <p>Nenhuma perna configurada.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <th>#</th>
              <th>Modo</th>
              <th>Seleções</th>
              <th>Colocações</th>
              <th>Seleção</th>
              <th>Stake</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((l, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                <td>{idx + 1}</td>
                <td>{l.mode}</td>
                <td>
                  {l.mode === "grupo"
                    ? l.selections.join(", ")
                    : l.mode === "dezena"
                    ? l.selections
                        .map((x) => String(x).padStart(2, "0"))
                        .join(", ")
                    : l.mode === "centena"
                    ? l.selections
                        .map((x) => String(x).padStart(3, "0"))
                        .join(", ")
                    : l.selections
                        .map((x) => String(x).padStart(4, "0"))
                        .join(", ")}
                </td>
                <td>{l.placements.join(", ")}º</td>
                <td>
                  {l.selectionPricing === "each" ? "Para cada" : "Dividir"}
                </td>
                <td>{fmt(l.stake)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="button ghost" onClick={() => setStep(4)}>
          Voltar
        </button>
        <button
          className="button"
          onClick={simulate}
          disabled={legs.length === 0 || loading}
        >
          {loading ? "Simulando..." : "Simular"}
        </button>
      </div>

      {res && (
        <div className="card" style={{ marginTop: 16 }}>
          {res.error ? (
            <p style={{ color: "var(--danger)" }}>{res.error}</p>
          ) : (
            <>
              <div className="row">
                <div className="col">
                  <div className="label">Seed</div>
                  <code style={{ userSelect: "all" }}>{res.seed}</code>
                </div>
                <div className="col">
                  <div className="label">Timestamp</div>
                  <code style={{ userSelect: "all" }}>{res.timestamp}</code>
                </div>
              </div>

              <hr />

              <div className="row">
                <div className="col">
                  <div className="label">Totais</div>
                  <p>
                    Custo: <strong>{fmt(res.totals.cost)}</strong> • Payout:{" "}
                    <strong>{fmt(res.totals.payout)}</strong> • Delta:{" "}
                    <strong>{fmt(res.totals.delta)}</strong> • Novo saldo:{" "}
                    <strong>{fmt(res.totals.balance)}</strong>
                  </p>
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
                    <th>Modo</th>
                    <th>Hits</th>
                    <th>Per Hit</th>
                    <th>Payout</th>
                    <th>Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {res.legs.map((l, idx) => (
                    <tr
                      key={idx}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td>{idx + 1}</td>
                      <td>{l.mode}</td>
                      <td>{l.totalHits}</td>
                      <td>{fmt(l.perHitPayout)}</td>
                      <td>{fmt(l.payoutCoins)}</td>
                      <td>{fmt(l.costCoins)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <hr />

              <div className="label">Prêmios sorteados</div>
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
                  </tr>
                </thead>
                <tbody>
                  {res.prizes.map((p) => {
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
                          Grupo {p.group} — {animal?.name}{" "}
                          <span className="label">
                            ({animal?.dezenas.join(", ")})
                          </span>
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
    </div>
  );
}

/* =========================
 * Página principal
 * =======================*/
export default function SimularPage() {
  const { user } = useAuth();
  const { coins } = useCoins();

  async function handleResetCoins() {
    try {
      const res = await fetch("/api/coins/reset", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && typeof json.balance === "number") {
        setCoins(json.balance);
      } else {
        alert(json?.error || "Falha ao resetar saldo.");
      }
    } catch {
      alert("Falha ao resetar saldo.");
    }
  }

  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>Simulador (Wizard)</h1>
      <p className="label">
        Construa sua aposta por etapas. Saldo: <strong>{fmt(coins)}</strong>
      </p>

      {user && (
        <div className="row" style={{ gap: 8, margin: "8px 0 12px" }}>
          <button className="button ghost" onClick={handleResetCoins}>
            Resetar coins (1000,00)
          </button>

          {/* opcional: só aparece quando zerar */}
          {coins <= 0 && (
            <span className="label" style={{ color: "var(--warning)" }}>
              Seu saldo está zerado — clique para recuperar.
            </span>
          )}
        </div>
      )}

      {!user ? (
        <div className="card" style={{ borderColor: "var(--warning)" }}>
          <strong>Você precisa estar logado para jogar.</strong>
          <p className="label">
            Use o botão “Entrar” no topo para acessar sua conta.
          </p>
        </div>
      ) : (
        <BetBuilderProvider>
          <Wizard />
        </BetBuilderProvider>
      )}
    </main>
  );
}

function Wizard() {
  const { step } = useBetBuilder();
  return (
    <>
      {step === 1 && <StepMode />}
      {step === 2 && <StepSelections />}
      {step === 3 && <StepPlacementsAndPricing />}
      {step === 4 && <StepVales />}
      {step === 5 && <StepReviewAndSimulate />}
    </>
  );
}
