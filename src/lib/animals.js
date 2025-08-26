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
export const DEMO_ANIMALS = Array.from({ length: 25 }, (_, i) => {
  const start = i * 4 + 1; // 1,5,9,...,97
  const dezenas = [0, 1, 2, 3]
    .map((k) => (start + k) % 100) // wrap: 100 -> 0 (vira "00")
    .map((n) => String(n).padStart(2, "0"));

  const animal = ANIMAL_NAMES[i] ?? `Grupo ${i + 1}`;

  return {
    id: i + 1,
    name: animal, // <- UI usa g.name: agora mostra o bicho
    animal, // alias semântico (opcional)
    label: `${String(i + 1).padStart(2, "0")} — ${animal}`, // útil se quiser
    dezenas, // ex.: G1 = 01,02,03,04 ... G25 = 97,98,99,00
  };
});

// Util: mapeia um número (0–99) para o índice de grupo 1–25 (4 dezenas por grupo)
export function groupFromNumber(num0To99) {
  const n = Number(num0To99) % 100;
  if (n === 0) return 25; // 00 pertence ao último grupo
  return Math.floor((n - 1) / 4) + 1; // 01..04 -> 1, 05..08 -> 2, ..., 97..00 -> 25
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
