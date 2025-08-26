// src/lib/coins-blob.js
import { put, head } from "@vercel/blob";
import crypto from "crypto";

const DEFAULT_COINS = 1000;
const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// fallback em memória (só p/ dev ou sem token)
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

async function readJsonFromUrl(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

export async function getBalance(email) {
  if (!hasBlob) {
    const k = `mem::${email.toLowerCase()}`;
    if (!mem.has(k)) mem.set(k, DEFAULT_COINS);
    return mem.get(k);
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
    const b = Number(json?.balance);
    return Number.isFinite(b) ? b : DEFAULT_COINS;
  } catch (e) {
    console.error("[coins-blob] getBalance error:", e);
    return DEFAULT_COINS;
  }
}

export async function setBalance(email, value) {
  const v = Math.max(0, value | 0);
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
  if (!hasBlob) {
    const k = `mem::${email.toLowerCase()}`;
    const cur = mem.get(k) ?? DEFAULT_COINS;
    const next = Math.max(0, cur + (delta | 0));
    mem.set(k, next);
    return next;
  }
  const cur = await getBalance(email);
  const next = Math.max(0, cur + (delta | 0));
  await setBalance(email, next);
  return next;
}
