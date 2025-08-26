"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/auth";

const CoinsContext = createContext(null);

export function CoinsProvider({ children }) {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!user?.email) {
      setCoins(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/coins/me", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && typeof json.balance === "number") setCoins(json.balance);
      else setCoins(0);
    } catch {
      setCoins(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [user?.email]);

  return (
    <CoinsContext.Provider
      value={{
        coins,
        loading,
        refresh,
        // Mutação de saldo agora vem do servidor (/api/simulate ou /api/coins/reset)
        setCoins, // para refletir o saldo retornado pela API
      }}
    >
      {children}
    </CoinsContext.Provider>
  );
}

export const useCoins = () => {
  const ctx = useContext(CoinsContext);
  if (!ctx)
    throw new Error("useCoins deve ser usado dentro de <CoinsProvider>");
  return ctx;
};
