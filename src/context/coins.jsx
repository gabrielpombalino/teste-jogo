"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/auth";

const CoinsContext = createContext(null);

function keyFor(email) {
  const id = email ? email.toLowerCase() : "anon";
  return `edu_coins::${id}`;
}

export function CoinsProvider({ children }) {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    // carrega coins do usuário atual
    const k = keyFor(user?.email);
    const v = parseInt(localStorage.getItem(k) || "0", 10);
    if (!Number.isFinite(v) || v <= 0) {
      localStorage.setItem(k, "1000"); // bônus inicial lúdico
      setCoins(1000);
    } else {
      setCoins(v);
    }
  }, [user?.email]);

  const write = (value) => {
    const k = keyFor(user?.email);
    localStorage.setItem(k, String(value));
  };

  const mutate = (delta) => {
    setCoins((c) => {
      const next = Math.max(0, c + delta);
      write(next);
      return next;
    });
  };

  const setExact = (value) => {
    const v = Math.max(0, value | 0);
    setCoins(v);
    write(v);
  };

  return (
    <CoinsContext.Provider
      value={{
        coins,
        addCoins: (v) => mutate(Math.abs(v)),
        subCoins: (v) => mutate(-Math.abs(v)),
        setCoins: setExact,
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
