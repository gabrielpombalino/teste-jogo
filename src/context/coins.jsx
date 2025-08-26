"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CoinsContext = createContext(null);

export function CoinsProvider({ children }) {
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    const v = parseInt(localStorage.getItem("edu_coins") || "0", 10);
    if (Number.isNaN(v) || v <= 0) {
      localStorage.setItem("edu_coins", "1000"); // bônus inicial lúdico
      setCoins(1000);
    } else {
      setCoins(v);
    }
  }, []);

  const mutate = (delta) => {
    setCoins((c) => {
      const next = Math.max(0, c + delta);
      localStorage.setItem("edu_coins", String(next));
      return next;
    });
  };

  const setExact = (value) => {
    const v = Math.max(0, value | 0);
    setCoins(v);
    localStorage.setItem("edu_coins", String(v));
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
