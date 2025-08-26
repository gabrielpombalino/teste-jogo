// src/app/api/simulate/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { groupFromNumber } from "@/lib/animals";
import { getUserFromCookie } from "@/lib/auth";
import { getBalance, incrBy } from "@/lib/coins-blob";

const MAX_STAKE = 50;

// multiplicadores meramente didáticos
const MULTS = {
  grupo: 20,
  dezena: 70,
  centena: 650,
  milhar: 4000,
};

function err(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// 7 prêmios educativos (5 milhares; 6º = soma mod 10000; 7º = penúltima centena de 1º×2º)
function generateSevenPrizes(seed, timestamp) {
  const hash = crypto
    .createHash("sha256")
    .update(`${seed}:${timestamp}`)
    .digest("hex");
  const blocks = [0, 8, 16, 24, 32].map((start) =>
    hash.slice(start, start + 8)
  );
  const milhares = blocks.map((h) => parseInt(h, 16) % 10000);
  const [m1, m2, m3, m4, m5] = milhares;
  const m6 = (m1 + m2 + m3 + m4 + m5) % 10000;
  const produto = m1 * m2;
  const c7 = Math.floor(produto / 100) % 1000;

  const annotate = (value, kind, extra = {}) => {
    const dez = value % 100;
    const grp = groupFromNumber(dez);
    return { value, dezena: dez, group: grp, kind, ...extra };
  };

  return [
    { idx: 1, ...annotate(m1, "milhar") },
    { idx: 2, ...annotate(m2, "milhar") },
    { idx: 3, ...annotate(m3, "milhar") },
    { idx: 4, ...annotate(m4, "milhar") },
    { idx: 5, ...annotate(m5, "milhar") },
    { idx: 6, ...annotate(m6, "milhar", { from: "sum(m1..m5) % 10000" }) },
    {
      idx: 7,
      ...annotate(c7, "centena", {
        from: "penultima-centena(m1*m2)",
        product: produto,
      }),
    },
  ];
}

// compara seleção contra uma lista de prêmios (já filtrada pelas colocações)
function matchSelection(mode, rawSelection, prizes) {
  const hits = [];

  if (mode === "grupo") {
    const sel = Number(rawSelection);
    if (!Number.isFinite(sel) || sel < 1 || sel > 25) return { hits };
    prizes.forEach((p) => {
      if (p.group === sel) hits.push(p.idx);
    });
  }

  if (mode === "dezena") {
    const sel = String(rawSelection ?? "")
      .replace(/\D/g, "")
      .slice(0, 2);
    if (!/^\d{1,2}$/.test(sel)) return { hits };
    const selNum = Number(sel);
    prizes.forEach((p) => {
      if (p.dezena === selNum) hits.push(p.idx);
    });
  }

  if (mode === "centena") {
    const sel = String(rawSelection ?? "")
      .replace(/\D/g, "")
      .slice(0, 3);
    if (!/^\d{1,3}$/.test(sel)) return { hits };
    const selNum = Number(sel);
    prizes.forEach((p) => {
      if (p.kind === "milhar") {
        if (p.value % 1000 === selNum) hits.push(p.idx);
      } else {
        if (p.value === selNum) hits.push(p.idx);
      }
    });
  }

  if (mode === "milhar") {
    const sel = String(rawSelection ?? "")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (!/^\d{1,4}$/.test(sel)) return { hits };
    const selNum = Number(sel);
    prizes.forEach((p) => {
      if (p.kind === "milhar" && p.value === selNum) hits.push(p.idx);
    });
  }

  return { hits };
}

export async function POST(req) {
  try {
    // exige login
    const user = getUserFromCookie(req);
    if (!user?.email) return err("Não autorizado. Faça login para jogar.", 401);

    const { mode, selection, stake, placements } = await req.json();

    if (!["grupo", "dezena", "centena", "milhar"].includes(mode))
      return err("Modo inválido.");

    const s = Number(stake);
    if (!Number.isFinite(s) || s <= 0 || s > MAX_STAKE)
      return err(`Stake inválida (1–${MAX_STAKE}).`);

    // valida colocações
    let cols = Array.isArray(placements) ? placements.slice() : [1]; // default: 1º
    cols = cols
      .map((x) => Number(x))
      .filter((x) => Number.isInteger(x) && x >= 1 && x <= 7);
    // unique + ordenado
    cols = Array.from(new Set(cols)).sort((a, b) => a - b);
    if (cols.length === 0)
      return err("Escolha ao menos uma colocação (1º–7º).");

    // regra: 7º só é permitido quando modo === "centena"
    if (cols.includes(7) && mode === "milhar") {
      return err("No modo MILHAR, o 7º prêmio não está disponível.");
    }

    // saldo atual do usuário
    const balance = await getBalance(user.email);
    if (balance < s) return err("Saldo insuficiente.", 400);

    // gera prêmios e filtra pelas colocações escolhidas
    const seed = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const allPrizes = generateSevenPrizes(seed, timestamp);
    const filteredPrizes = allPrizes.filter((p) => cols.includes(p.idx));

    // avalia acerto somente nas colocações selecionadas
    const { hits } = matchSelection(mode, selection, filteredPrizes);
    const win = hits.length > 0;

    // stake é dividida igualmente entre as colocações
    const k = cols.length;
    const perPlacementStake = s / k;
    const multiplier = MULTS[mode] ?? 0;

    // pagamos por acerto dentro das colocações escolhidas
    const perHitPayout = Math.floor(perPlacementStake * multiplier);
    const payoutCoins = win ? perHitPayout * hits.length : 0;

    // aplica delta no servidor
    const delta = -s + payoutCoins;
    const newBalance = await incrBy(user.email, delta);

    return NextResponse.json({
      seed,
      timestamp,
      prizes: allPrizes, // mesa completa (para referência visual)
      consideredPlacements: cols, // colocações efetivamente consideradas
      mode,
      selection,
      hits, // índices (dentro de 1..7) onde deu match
      win,
      appliedStake: s,
      perPlacementStake,
      perHitPayout,
      payoutCoins,
      multipliers: MULTS,
      balance: newBalance,
      notes: {
        payouts:
          "Stake dividida igualmente pelas colocações selecionadas; paga por acerto dentro delas.",
        rule7: "O 7º prêmio só está disponível para o modo CENTENA.",
      },
    });
  } catch (e) {
    console.error("simulate error:", e);
    return NextResponse.json({ error: "Erro no servidor." }, { status: 500 });
  }
}
