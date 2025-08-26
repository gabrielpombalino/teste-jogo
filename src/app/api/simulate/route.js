// src/app/api/simulate/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { groupFromNumber } from "@/lib/animals";

const MAX_STAKE = 50;

// multiplicadores meramente didáticos
const MULTS = {
  grupo: 10, // checa contra os 7 prêmios (grupo pela dezena)
  dezena: 50, // checa contra os 7 prêmios (dezena = últimos 2 dígitos)
  centena: 150, // checa contra os 6 milhares (últimas 3) + 7º (centena)
  milhar: 1000, // checa contra os 6 milhares somente
};

function err(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// Gera 7 prêmios conforme regras educativas:
// 1º..5º = 5 milhares independentes
// 6º     = soma dos 5 primeiros % 10000 (milhar)
// 7º     = penúltima centena do produto (1º x 2º) => floor(prod/100) % 1000 (centena)
function generateSevenPrizes(seed, timestamp) {
  const hash = crypto
    .createHash("sha256")
    .update(`${seed}:${timestamp}`)
    .digest("hex");
  const blocks = [0, 8, 16, 24, 32].map((start) =>
    hash.slice(start, start + 8)
  );
  const milhares = blocks.map((h) => parseInt(h, 16) % 10000); // m1..m5 (0..9999)

  const [m1, m2, m3, m4, m5] = milhares;
  const m6 = (m1 + m2 + m3 + m4 + m5) % 10000; // 6º milhar
  const produto = m1 * m2;
  const c7 = Math.floor(produto / 100) % 1000; // 7º centena

  // helper para anotar dezena/grupo
  const annotate = (value, kind, extra = {}) => {
    // dezena é sempre os últimos 2 dígitos do número "base" do prêmio
    const dez = value % 100;
    const grp = groupFromNumber(dez);
    return { value, dezena: dez, group: grp, kind, ...extra };
  };

  const prizes = [
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

  return prizes;
}

// Compara a seleção com os 7 prêmios conforme o modo
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
        const cent = p.value % 1000;
        if (cent === selNum) hits.push(p.idx);
      } else {
        // 7º prêmio é centena "pura"
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
    const { mode, selection, stake } = await req.json();

    if (!["grupo", "dezena", "centena", "milhar"].includes(mode)) {
      return err("Modo inválido.");
    }

    const s = Number(stake);
    if (!Number.isFinite(s) || s <= 0 || s > MAX_STAKE) {
      return err(`Stake inválida (1–${MAX_STAKE}).`);
    }

    // seed/timestamp para transparência
    const seed = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // gera os 7 prêmios conforme regras
    const prizes = generateSevenPrizes(seed, timestamp);

    // avalia acerto conforme modo
    const { hits } = matchSelection(mode, selection, prizes);
    const win = hits.length > 0;

    const multiplier = MULTS[mode] ?? 0;
    const payoutCoins = win ? s * multiplier : 0;

    return NextResponse.json({
      seed,
      timestamp,
      prizes, // tabela completa (1..7 c/ dezena e grupo)
      mode,
      selection,
      hits, // índices dos prêmios que deram match
      win,
      appliedStake: s,
      payoutCoins,
      multipliers: MULTS,
      notes: {
        six: "6º = soma dos 5 primeiros (mod 10000)",
        seven: "7º = penúltima centena do produto do 1º×2º",
        group: "Grupo é calculado pela dezena (últimos 2 dígitos).",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Erro no servidor." }, { status: 500 });
  }
}
