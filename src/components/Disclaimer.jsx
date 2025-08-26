"use client";

import { useEffect, useState } from "react";

export default function Disclaimer() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const ok = localStorage.getItem("edu_disclaimer_ok") === "1";
    setAccepted(ok);
  }, []);

  const accept = () => {
    localStorage.setItem("edu_disclaimer_ok", "1");
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
      }}
    >
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>Uso educativo</h2>
        <p>
          Este projeto é uma <strong>simulação educativa</strong>. Não há
          dinheiro real, pagamentos, prêmios ou instruções para apostar de
          verdade. O “jogo do bicho” é <strong>ilegal no Brasil</strong>.
        </p>
        <ul>
          <li>Conteúdo lúdico e informativo</li>
          <li>Sem cash-out/retirada</li>
          <li>
            Mapeamento de grupos/animais é <em>ficcional</em>
          </li>
        </ul>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="button" onClick={accept}>
            Entendi e desejo prosseguir
          </button>
        </div>
      </div>
    </div>
  );
}
