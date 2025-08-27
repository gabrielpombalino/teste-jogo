"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { groupFromNumber } from "@/lib/animals";

const BetBuilderContext = createContext(null);

export function BetBuilderProvider({ children }) {
  // steps: 1=tipo, 2=seleções, 3=colocações/valores, 4=vales, 5=review
  const [step, setStep] = useState(1);

  // base
  const [mode, setMode] = useState(null); // 'milhar' | 'centena' | 'dezena' | 'grupo'
  const [selections, setSelections] = useState([]); // array de strings/nums
  const [placements, setPlacements] = useState([1]); // [1..7]
  const [selectionPricing, setSelectionPricing] = useState("each"); // 'each' | 'split' (aplica sobre quantidade de seleções)
  const [stake, setStake] = useState(10.0); // duas casas

  // "vales" (derivados da base)
  const [valeCentena, setValeCentena] = useState(false);
  const [valeGrupo, setValeGrupo] = useState(false);

  // configurações dos vales
  const [centenaCfg, setCentenaCfg] = useState({
    placements: [1],
    selectionPricing: "each",
    stake: 5.0,
  });
  const [grupoCfg, setGrupoCfg] = useState({
    placements: [1],
    selectionPricing: "each",
    stake: 5.0,
  });

  // deriva seleções para os "vales"
  const derived = useMemo(() => {
    const toCentena = (m) =>
      Number(String(m).replace(/\D/g, "").slice(-3)) || 0;
    const toDezena = (x) => Number(String(x).replace(/\D/g, "").slice(-2)) || 0;
    const toGrupo = (x) => groupFromNumber(toDezena(x));
    const baseSel = selections;

    const centenaFromBase =
      mode === "milhar" ? baseSel.map((m) => toCentena(m)) : null;
    const grupoFromBase =
      mode === "milhar"
        ? baseSel.map((m) => toGrupo(m))
        : mode === "centena"
        ? baseSel.map((c) => toGrupo(c))
        : mode === "dezena"
        ? baseSel.map((d) => toGrupo(d))
        : null;

    return { centena: centenaFromBase, grupo: grupoFromBase };
  }, [mode, selections]);

  function resetAll() {
    setStep(1);
    setMode(null);
    setSelections([]);
    setPlacements([1]);
    setSelectionPricing("each");
    setStake(10.0);
    setValeCentena(false);
    setValeGrupo(false);
    setCentenaCfg({ placements: [1], selectionPricing: "each", stake: 5.0 });
    setGrupoCfg({ placements: [1], selectionPricing: "each", stake: 5.0 });
  }

  function resetStakes() {
    setStake(10.0);
    setCentenaCfg((c) => ({ ...c, stake: 5.0 }));
    setGrupoCfg((c) => ({ ...c, stake: 5.0 }));
  }

  // monta payload das pernas
  const legs = useMemo(() => {
    if (!mode || selections.length === 0) return [];

    const baseLeg = {
      mode,
      selections,
      placements,
      // ⚠️ colocação é SEMPRE dividida no servidor; não enviamos "placementPricing"
      selectionPricing,
      stake,
    };

    const out = [baseLeg];

    if (valeCentena && derived.centena?.length) {
      out.push({
        mode: "centena",
        selections: derived.centena,
        placements: centenaCfg.placements,
        selectionPricing: centenaCfg.selectionPricing,
        stake: centenaCfg.stake,
      });
    }

    if (valeGrupo && derived.grupo?.length) {
      out.push({
        mode: "grupo",
        selections: derived.grupo,
        placements: grupoCfg.placements,
        selectionPricing: grupoCfg.selectionPricing,
        stake: grupoCfg.stake,
      });
    }

    // regra: 7º bloqueado em milhar
    for (const leg of out) {
      if (leg.mode === "milhar" && leg.placements.includes(7)) {
        leg.placements = leg.placements.filter((x) => x !== 7);
      }
    }

    return out;
  }, [
    mode,
    selections,
    placements,
    selectionPricing,
    stake,
    valeCentena,
    valeGrupo,
    derived,
    centenaCfg,
    grupoCfg,
  ]);

  return (
    <BetBuilderContext.Provider
      value={{
        step,
        setStep,
        mode,
        setMode,
        selections,
        setSelections,
        placements,
        setPlacements,
        selectionPricing,
        setSelectionPricing,
        stake,
        setStake,
        valeCentena,
        setValeCentena,
        valeGrupo,
        setValeGrupo,
        centenaCfg,
        setCentenaCfg,
        grupoCfg,
        setGrupoCfg,
        derived,
        legs,
        resetAll,
        resetStakes,
      }}
    >
      {children}
    </BetBuilderContext.Provider>
  );
}

export const useBetBuilder = () => {
  const ctx = useContext(BetBuilderContext);
  if (!ctx)
    throw new Error(
      "useBetBuilder deve ser usado dentro de <BetBuilderProvider>"
    );
  return ctx;
};
