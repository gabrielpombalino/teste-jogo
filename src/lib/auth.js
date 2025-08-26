// src/lib/auth.js
import crypto from "crypto";

const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const dec = (str) => JSON.parse(Buffer.from(str, "base64url").toString("utf8"));

function signHS256(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function signJWT(payload, { expSec = 60 * 60 * 24 * 7 } = {}) {
  const secret = process.env.AUTH_SECRET || "dev-secret";
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expSec };
  const unsigned = `${enc(header)}.${enc(body)}`;
  const sig = signHS256(unsigned, secret);
  return `${unsigned}.${sig}`;
}

export function verifyJWT(token) {
  try {
    const secret = process.env.AUTH_SECRET || "dev-secret";
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const check = signHS256(`${h}.${p}`, secret);
    if (check !== s) return null;
    const payload = dec(p);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getUserFromCookie(request) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const m = cookie.match(/(?:^|;\s*)edu_session=([^;]+)/);
    if (!m) return null;
    const token = decodeURIComponent(m[1]);
    const payload = verifyJWT(token);
    if (!payload?.email) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

/** OTP token assinado (stateless), guardado em cookie httpOnly */
export function signOTP(email, code, { expSec = 5 * 60 } = {}) {
  const secret = process.env.AUTH_SECRET || "dev-secret";
  const header = { alg: "HS256", typ: "OTP" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    email: email.toLowerCase(),
    code,
    iat: now,
    exp: now + expSec,
  };
  const unsigned = `${enc(header)}.${enc(body)}`;
  const sig = signHS256(unsigned, secret);
  return `${unsigned}.${sig}`;
}

export function verifyOTP(token) {
  try {
    const secret = process.env.AUTH_SECRET || "dev-secret";
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const check = signHS256(`${h}.${p}`, secret);
    if (check !== s) return null;
    const payload = dec(p);
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.email || !payload?.code) return null;
    if (payload.exp && payload.exp < now) return null;
    return payload; // { email, code, iat, exp }
  } catch {
    return null;
  }
}
