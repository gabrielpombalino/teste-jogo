"use client";

export default function GroupPicker({ groups, value, onChange }) {
  return (
    <ul className="group-grid" role="listbox" aria-label="Escolher grupo">
      {groups.map((g) => {
        const selected = g.id === value;
        return (
          <li key={g.id} className={`group-item ${selected ? "selected" : ""}`}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(g.id)}
              className="group-btn"
            >
              <div className="group-header">
                <span className="group-badge">G{g.id}</span>
                <strong className="group-name">{g.name}</strong>
              </div>
              <div className="group-sub">
                <span className="group-dezenas">{g.dezenas.join(", ")}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
