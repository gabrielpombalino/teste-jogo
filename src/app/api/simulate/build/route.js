export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { getUserFromCookie } from "@/lib/auth";
import { getBalance, incrBy } from "@/lib/coins-blob";
import { groupFromNumber } from "@/lib/animals";

const MULTS = { grupo: 10, dezena: 50, centena: 150, milhar: 1000 };
const MAX_STAKE = 50.0;

const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const toCents = (n) => Math.round((Number(n) || 0) * 100);
const fromCents = (c) => Math.round(Number(c) || 0) / 100;

// ===== Sorteio (mesma regra)
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

// ===== Match de UMA seleção
function hitsForOneSelection(mode, sel, filteredPrizes) {
  const matches = [];
  if (mode === "grupo") {
    const g = Number(sel);
    filteredPrizes.forEach((p) => {
      if (p.group === g) matches.push(p.idx);
    });
  } else if (mode === "dezena") {
    const d = Number(String(sel).replace(/\D/g, "").slice(0, 2));
    filteredPrizes.forEach((p) => {
      if (p.dezena === d) matches.push(p.idx);
    });
  } else if (mode === "centena") {
    const c = Number(String(sel).replace(/\D/g, "").slice(0, 3));
    filteredPrizes.forEach((p) => {
      if (p.kind === "milhar") {
        if (p.value % 1000 === c) matches.push(p.idx);
      } else {
        if (p.value === c) matches.push(p.idx);
      }
    });
  } else if (mode === "milhar") {
    const m = Number(String(sel).replace(/\D/g, "").slice(0, 4));
    filteredPrizes.forEach((p) => {
      if (p.kind === "milhar" && p.value === m) matches.push(p.idx);
    });
  }
  return matches;
}

export async function POST(req) {
  try {
    const user = getUserFromCookie(req);
    if (!user?.email) return err("Não autorizado. Faça login para jogar.", 401);

    const body = await req.json();
    const legs = Array.isArray(body?.legs) ? body.legs : null;
    if (!legs || legs.length === 0) return err("Nenhuma perna/leg enviada.");

    // validação
    for (const leg of legs) {
      if (!["grupo", "dezena", "centena", "milhar"].includes(leg.mode))
        return err("Modo inválido.");
      const s = Math.round((Number(leg.stake) || 0) * 100) / 100;
      if (!(s > 0 && s <= MAX_STAKE))
        return err(`Stake inválida (0.01–${MAX_STAKE.toFixed(2)}).`);
      if (!Array.isArray(leg.selections) || leg.selections.length === 0)
        return err("Seleções vazias em uma perna.");
      if (
        !Array.isArray(leg.placements) ||
        leg.placements.some((x) => x < 1 || x > 7)
      )
        return err("Colocações inválidas.");
      if (leg.mode === "milhar" && leg.placements.includes(7))
        return err("No modo MILHAR, 7º não é permitido.");
      if (!["each", "split"].includes(leg.selectionPricing || "each"))
        leg.selectionPricing = "each";
      leg.stake = s;
    }

    // saldo
    const balance = await getBalance(user.email);

    // sorteio único
    const seed = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const allPrizes = generateSevenPrizes(seed, timestamp);

    let totalCostC = 0;
    let totalPayoutC = 0;
    const legResults = [];

    for (const leg of legs) {
      const k = leg.placements.length; // colocações
      const n = leg.selections.length; // seleções
      const mult = MULTS[leg.mode] ?? 0;
      const stakeC = toCents(leg.stake);

      // custo considerando apenas seleções (colocações NÃO multiplicam custo)
      const selectionFactor = leg.selectionPricing === "each" ? n : 1;
      const selectionDivisor = leg.selectionPricing === "split" ? n : 1;
      const costC = stakeC * selectionFactor;
      totalCostC += costC;

      const filtered = allPrizes.filter((p) => leg.placements.includes(p.idx));

      // payout por acerto: SEMPRE divide por k colocações
      const perHitPayoutC = Math.floor(
        (stakeC * mult) / (k * selectionDivisor)
      );

      let hitCount = 0;
      const hitsBySelection = [];

      for (const sel of leg.selections) {
        const matches = hitsForOneSelection(leg.mode, sel, filtered);
        hitCount += matches.length;
        hitsBySelection.push({ selection: sel, hits: matches });
      }

      const payoutC = perHitPayoutC * hitCount;
      totalPayoutC += payoutC;

      // extras para explicar na UI
      const perPlacementStakeC = Math.floor(stakeC / k);
      const perSelectionStakeC =
        leg.selectionPricing === "split" ? Math.floor(stakeC / n) : stakeC;

      legResults.push({
        mode: leg.mode,
        selections: leg.selections,
        placements: leg.placements,
        selectionPricing: leg.selectionPricing,
        stake: leg.stake,
        costCoins: fromCents(costC),
        perPlacementStake: fromCents(perPlacementStakeC),
        perSelectionStake: fromCents(perSelectionStakeC),
        perHitPayout: fromCents(perHitPayoutC),
        totalHits: hitCount,
        payoutCoins: fromCents(payoutC),
        hitsBySelection,
      });
    }

    if (balance < fromCents(totalCostC))
      return err("Saldo insuficiente para o custo total.", 400);

    const deltaCoins = fromCents(-totalCostC + totalPayoutC);
    const newBalance = await incrBy(user.email, deltaCoins);

    return NextResponse.json({
      seed,
      timestamp,
      prizes: allPrizes,
      legs: legResults,
      totals: {
        cost: fromCents(totalCostC),
        payout: fromCents(totalPayoutC),
        delta: fromCents(-totalCostC + totalPayoutC),
        balance: newBalance,
      },
    });
  } catch (e) {
    console.error("simulate build error:", e);
    return NextResponse.json({ error: "Erro no servidor." }, { status: 500 });
  }
}
