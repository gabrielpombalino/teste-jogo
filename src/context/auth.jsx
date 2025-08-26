"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(true);

  async function refresh() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = await res.json();
      setUser(json.user);
    } catch {
      setUser(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
  }

  return (
    <AuthCtx.Provider value={{ user, busy, refresh, setUser, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
