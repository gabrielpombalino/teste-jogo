export const metadata = { title: "Regras (educativo)" };

import { DEMO_ANIMALS } from "@/lib/animals";

export default function Regras() {
  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>Regras — conteúdo educativo</h1>
      <p>
        Historicamente, jogos de sorte costumam usar <strong>grupos</strong> que
        agregam faixas de números. Nesta simulação didática, temos 25 grupos
        fictícios e os números de 00 a 99 são distribuídos igualmente (4 por
        grupo).
      </p>

      <div style={{ marginTop: 16 }}>
        <h3>Tabela fictícia (didática)</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {DEMO_ANIMALS.map((g) => (
            <div key={g.id} className="card" style={{ padding: 12 }}>
              <strong>{g.name}</strong>
              <div className="label">Dezenas (DEMO):</div>
              <div>{g.dezenas.join(", ")}</div>
            </div>
          ))}
        </div>
      </div>

      <hr />
      <p>
        <strong>Importante:</strong> Este material não incentiva apostas. O
        objetivo é mostrar como uma interface pode <em>simular</em> sorteios e
        apresentar resultados com transparência (seed + timestamp).
      </p>
    </main>
  );
}
