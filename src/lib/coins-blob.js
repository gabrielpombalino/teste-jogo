// src/lib/coins-blob.js
import { put, head } from "@vercel/blob";
import crypto from "crypto";

const DEFAULT_COINS = 1000.0; // bônus inicial com 2 casas
const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// fallback em memória (dev/sem token)
const mem = (globalThis.__COINS_MEM__ ||= new Map());

function emailHash(email) {
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 20);
}
function pathFor(email) {
  return `coins/v1/${emailHash(email)}.json`;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

async function readJsonFromUrl(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

export async function getBalance(email) {
  if (!hasBlob) {
    const k = `mem::${email.toLowerCase()}`;
    if (!mem.has(k)) mem.set(k, DEFAULT_COINS);
    return round2(mem.get(k));
  }
  const pathname = pathFor(email);
  try {
    const meta = await head(pathname).catch(() => null);
    if (!meta) {
      await put(
        pathname,
        JSON.stringify({
          balance: DEFAULT_COINS,
          updatedAt: new Date().toISOString(),
        }),
        {
          access: "public",
          contentType: "application/json",
          addRandomSuffix: false,
        }
      );
      return DEFAULT_COINS;
    }
    const json = await readJsonFromUrl(meta.url);
    const b = round2(json?.balance);
    if (!Number.isFinite(b) || b < 0) return DEFAULT_COINS;
    return b;
  } catch (e) {
    console.error("[coins-blob] getBalance error:", e);
    return DEFAULT_COINS;
  }
}

export async function setBalance(email, value) {
  const v = Math.max(0, round2(value));
  if (!hasBlob) {
    mem.set(`mem::${email.toLowerCase()}`, v);
    return v;
  }
  const pathname = pathFor(email);
  await put(
    pathname,
    JSON.stringify({ balance: v, updatedAt: new Date().toISOString() }),
    {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    }
  );
  return v;
}

export async function incrBy(email, delta) {
  const cur = await getBalance(email);
  const next = Math.max(0, round2(cur + Number(delta || 0)));
  await setBalance(email, next);
  return next;
}
