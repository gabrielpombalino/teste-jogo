export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { groupFromNumber } from "@/lib/animals";
import { getUserFromCookie } from "@/lib/auth";
import { getBalance, incrBy } from "@/lib/coins-blob";

const MAX_STAKE = 50; // limite em "coins", permite decimais

const MULTS = { grupo: 20, dezena: 70, centena: 650, milhar: 4000 };

const err = (msg, status = 400) =>
  NextResponse.json({ error: msg }, { status });

// helpers monetários (centavos)
const toCents = (n) => Math.round((Number(n) || 0) * 100);
const fromCents = (c) => Math.round(Number(c) || 0) / 100;

// ===== SORTEIO (mantém sua regra) =====
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

// ===== MATCH =====
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
    const user = getUserFromCookie(req);
    if (!user?.email) return err("Não autorizado. Faça login para jogar.", 401);

    const { mode, selection, stake, placements, pricingMode } =
      await req.json();

    if (!["grupo", "dezena", "centena", "milhar"].includes(mode))
      return err("Modo inválido.");

    // Stake com 2 casas
    const s = Math.round((Number(stake) || 0) * 100) / 100;
    if (!(s > 0 && s <= MAX_STAKE))
      return err(`Stake inválida (0.01–${MAX_STAKE.toFixed(2)}).`);
    const stakeC = toCents(s);

    // Colocações
    let cols = Array.isArray(placements) ? placements.slice() : [1];
    cols = Array.from(
      new Set(
        cols
          .map((x) => Number(x))
          .filter((x) => Number.isInteger(x) && x >= 1 && x <= 7)
      )
    ).sort((a, b) => a - b);
    if (cols.length === 0)
      return err("Escolha ao menos uma colocação (1º–7º).");
    if (cols.includes(7) && mode === "milhar")
      return err("No modo MILHAR, o 7º prêmio não está disponível.");

    // Pricing mode
    const pricing = pricingMode === "cover" ? "cover" : "split";
    const k = cols.length;
    const mult = MULTS[mode] ?? 0;

    // custo e payout por acerto
    let costC,
      perPlacementStakeC = null,
      perHitPayoutC;
    if (pricing === "split") {
      costC = stakeC;
      perPlacementStakeC = Math.floor(stakeC / k);
      perHitPayoutC = Math.floor((stakeC * mult) / k);
    } else {
      const factor = k === 7 ? 2 : k; // regras “vale”
      costC = stakeC * factor;
      perHitPayoutC = Math.floor(stakeC * mult);
    }

    // Saldo suficiente?
    const balance = await getBalance(user.email);
    if (balance < fromCents(costC)) return err("Saldo insuficiente.", 400);

    // Gera prêmios e filtra pelas colocações escolhidas
    const seed = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const allPrizes = generateSevenPrizes(seed, timestamp);
    const filtered = allPrizes.filter((p) => cols.includes(p.idx));

    // Match
    const { hits } = matchSelection(mode, selection, filtered);
    const hitsCount = hits.length;

    const payoutTotalC = hitsCount > 0 ? perHitPayoutC * hitsCount : 0;
    const deltaCoins = fromCents(-costC + payoutTotalC);
    const newBalance = await incrBy(user.email, deltaCoins);

    return NextResponse.json({
      seed,
      timestamp,
      prizes: allPrizes,
      consideredPlacements: cols,
      pricingMode: pricing,
      mode,
      selection,
      hits,
      win: hitsCount > 0,
      appliedStake: s, // stake base
      costCoins: fromCents(costC), // custo efetivo cobrado
      perPlacementStake:
        perPlacementStakeC !== null ? fromCents(perPlacementStakeC) : null,
      perHitPayout: fromCents(perHitPayoutC),
      payoutCoins: fromCents(payoutTotalC),
      multipliers: MULTS,
      balance: newBalance,
      notes: {
        pricing:
          "Dividir: custo=stake; payout=(stake×mult)/k. Vale: custo=stake×(k ou 2 se k=7); payout=stake×mult.",
        rule7:
          "7º prêmio disponível p/ Grupo/Dezena/Centena; indisponível em Milhar.",
      },
    });
  } catch (e) {
    console.error("simulate error:", e);
    return NextResponse.json({ error: "Erro no servidor." }, { status: 500 });
  }
}
