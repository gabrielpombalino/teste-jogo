"use client";

export default function SelectionPricingPicker({
  selectionsCount,
  selectionPricing,
  onChange,
}) {
  if ((selectionsCount || 0) <= 1) return null; // só exibe quando tem 2+

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="label">Aplicação da stake entre as seleções</div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`button ${selectionPricing === "each" ? "" : "ghost"}`}
          onClick={() => onChange("each")}
          title="COBRAR a stake para cada seleção (custo = stake × quantidade de seleções)"
        >
          Para cada
        </button>
        <button
          type="button"
          className={`button ${selectionPricing === "split" ? "" : "ghost"}`}
          onClick={() => onChange("split")}
          title="DIVIDIR a stake entre as seleções (custo = stake)"
        >
          Dividir
        </button>
      </div>
      <small className="muted" style={{ display: "block", marginTop: 8 }}>
        “Para cada” cobra a stake para cada aposta; “Dividir” reparte a stake
        única entre as N apostas.
      </small>
    </div>
  );
}
