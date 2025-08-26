// src/app/api/draw7/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { groupFromNumber } from "@/lib/animals";

// Gera 5 blocos de 8 hex do SHA-256 para 5 milhares (0..9999)
// 6º = soma dos 5 % 10000
// 7º = penúltima centena de (1º * 2º) => floor(prod/100) % 1000
export async function GET() {
  try {
    const seed = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const hash = crypto
      .createHash("sha256")
      .update(`${seed}:${timestamp}`)
      .digest("hex");

    // 64 hex chars; usamos os 5 primeiros blocos de 8
    const blocks = [0, 8, 16, 24, 32].map((start) =>
      hash.slice(start, start + 8)
    );
    const milhares = blocks.map((h) => parseInt(h, 16) % 10000); // [m1..m5]

    const m1 = milhares[0];
    const m2 = milhares[1];
    const m3 = milhares[2];
    const m4 = milhares[3];
    const m5 = milhares[4];

    // 6º prêmio: soma mod 10000
    const m6 = (m1 + m2 + m3 + m4 + m5) % 10000;

    // 7º prêmio: penúltima centena do produto do 1º e 2º
    const produto = m1 * m2; // até ~1e8
    const c7 = Math.floor(produto / 100) % 1000; // centena 000..999

    // Função de anotar (valor -> dezena/grupo)
    const ann = (value, kind) => {
      const dez = kind === "centena" ? value % 100 : value % 100;
      const grp = groupFromNumber(dez);
      return { value, dezena: dez, group: grp, kind };
    };

    const prizes = [
      { idx: 1, ...ann(m1, "milhar") },
      { idx: 2, ...ann(m2, "milhar") },
      { idx: 3, ...ann(m3, "milhar") },
      { idx: 4, ...ann(m4, "milhar") },
      { idx: 5, ...ann(m5, "milhar") },
      { idx: 6, ...ann(m6, "milhar"), from: "sum(m1..m5) % 10000" },
      {
        idx: 7,
        ...ann(c7, "centena"),
        from: "penultima-centena(m1*m2)",
        product: produto,
      },
    ];

    return NextResponse.json({ seed, timestamp, prizes });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao gerar sorteio educativo." },
      { status: 500 }
    );
  }
}
