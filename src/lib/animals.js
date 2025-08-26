// src/lib/animals.js

// Lista dos 25 bichos (rótulos educativos — não é tabela oficial)
const ANIMAL_NAMES = [
  "Avestruz",
  "Águia",
  "Burro",
  "Borboleta",
  "Cachorro",
  "Cabra",
  "Carneiro",
  "Camelo",
  "Cobra",
  "Coelho",
  "Cavalo",
  "Elefante",
  "Galo",
  "Gato",
  "Jacaré",
  "Leão",
  "Macaco",
  "Porco",
  "Pavão",
  "Peru",
  "Touro",
  "Tigre",
  "Urso",
  "Veado",
  "Vaca",
];

// DEMO: 25 grupos * 4 dezenas = 100 dezenas (00–99) distribuídas de forma
// totalmente algorítmica para fins EDUCATIVOS (não corresponde a tabelas reais).
export const DEMO_ANIMALS = Array.from({ length: 25 }, (_, i) => {
  const base = i * 4;
  const dezenas = [base, base + 1, base + 2, base + 3].map((n) =>
    String(n).padStart(2, "0")
  );
  return {
    id: i + 1,
    name: ANIMAL_NAMES[i],
    dezenas,
  };
});

// Util: mapeia um número (0–99) para o índice de grupo 1–25 (4 dezenas por grupo)
export function groupFromNumber(num0To99) {
  return Math.floor(num0To99 / 4) + 1;
}
export function sanitizeDezena(v) {
  return String(v ?? "")
    .replace(/\D/g, "")
    .slice(0, 2);
}
export function sanitizeCentena(v) {
  return String(v ?? "")
    .replace(/\D/g, "")
    .slice(0, 3);
}
export function sanitizeMilhar(v) {
  return String(v ?? "")
    .replace(/\D/g, "")
    .slice(0, 4);
}
export function animalForGroupId(id) {
  return DEMO_ANIMALS.find((a) => a.id === id) || null;
}
