"use client";

const ALL = [1, 2, 3, 4, 5, 6, 7];

export default function PlacementsPicker({ mode, value, onChange }) {
  const selected = new Set(value);

  // ✅ 7º liberado para grupo/dezena/centena; bloqueado apenas para milhar
  const allow7 = mode !== "milhar";

  function toggle(n) {
    if (n === 7 && !allow7) return;
    const next = new Set(selected);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    if (next.size === 0) return; // precisa ter pelo menos 1
    onChange(Array.from(next).sort((a, b) => a - b));
  }

  function setRange(a, b) {
    const arr = [];
    for (let i = a; i <= b; i++) {
      if (i === 7 && !allow7) continue;
      arr.push(i);
    }
    if (arr.length === 0) return;
    onChange(arr);
  }

  function clearAll() {
    onChange([1]); // default seguro
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="label">Colocações</div>

      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {ALL.map((n) => {
          const disabled = n === 7 && !allow7;
          const isOn = selected.has(n) && !disabled;
          return (
            <button
              key={n}
              type="button"
              className={`button ${isOn ? "" : "ghost"}`}
              onClick={() => toggle(n)}
              disabled={disabled}
              title={
                disabled
                  ? "No modo MILHAR, o 7º prêmio não está disponível"
                  : `${n}º prêmio`
              }
            >
              {n}º
            </button>
          );
        })}
      </div>

      <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="button ghost"
          onClick={() => setRange(1, 5)}
        >
          1–5
        </button>
        <button
          type="button"
          className="button ghost"
          onClick={() => setRange(1, 6)}
        >
          1–6
        </button>
        <button
          type="button"
          className="button ghost"
          onClick={() => setRange(1, 7)}
          disabled={!allow7}
          title={!allow7 ? "1–7 indisponível no modo MILHAR" : "Selecionar 1–7"}
        >
          1–7
        </button>
        <button type="button" className="button ghost" onClick={clearAll}>
          Limpar
        </button>
      </div>

      <small className="muted" style={{ display: "block", marginTop: 8 }}>
        A stake é dividida igualmente entre as colocações selecionadas.
        {allow7
          ? " Neste modo, o 7º prêmio está disponível."
          : " No modo MILHAR, o 7º prêmio fica indisponível."}
      </small>
    </div>
  );
}
