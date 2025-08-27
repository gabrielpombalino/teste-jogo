"use client";

export default function PricingModePicker({
  mode,
  placements,
  pricingMode,
  onChange,
}) {
  const k = placements?.length || 1;
  const allow7 = mode !== "milhar";
  const has7 = placements?.includes?.(7);

  // fator dos "vales": 1–7 = 2×; demais = k×

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="label">Como calcular a stake nas colocações?</div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`button ${pricingMode === "split" ? "" : "ghost"}`}
          onClick={() => onChange("split")}
          title="Divide a stake igualmente entre as colocações selecionadas."
        >
          Dividir
        </button>
        <button
          type="button"
          className={`button ${pricingMode === "cover" ? "" : "ghost"}`}
          onClick={() => onChange("cover")}
          title="Cobra multiplicadores de custo (vale)."
        >
          Vale
        </button>
      </div>

      <small className="muted" style={{ display: "block", marginTop: 8 }}>
        <strong>Dividir stake</strong>: custo = stake; payout por acerto =
        (stake × multiplicador) ÷ n colocações.
      </small>
      <small className="muted" style={{ display: "block" }}>
        <strong>Vale</strong>: custo = stake × <code>{k === 7 ? "2" : k}</code>
        {k === 7
          ? " (1–7 = 2×)"
          : k > 1
          ? ` (${k} colocações = ${k}×)`
          : " (1º = 1×)"}
        ; payout por acerto = stake × multiplicador.
        {!allow7 && has7 && " (No modo MILHAR, o 7º não é permitido.)"}
      </small>
    </div>
  );
}
