import atributos from "../data/atributos.json";

export const ATRIBUTOS = atributos;

export function getAtributoById(id) {
  return ATRIBUTOS.find((a) => a.id === id) || null;
}

export function formatTreinamento(value) {
  if (!value) return "Destreinado";
  const v = String(value).toLowerCase();
  if (v === "treinado") return "Treinado";
  if (v === "veterano") return "Veterano";
  if (v === "expert") return "Expert";
  if (v === "destreinado" || v === "nenhum") return "Destreinado";
  return value;
}

export function formatDT(dtObj) {
  const oficiais = dtObj?.oficiais || [];
  const parts = [];
  if (oficiais.length) parts.push(oficiais.join(", "));
  if (dtObj?.incluiLivre) parts.push("Livre");
  if (dtObj?.incluiNenhuma) parts.push("Nenhuma");
  return parts.length ? parts.join(" • ") : "Livre • Nenhuma";
}

export function linkifyCapitulo(text) {
  // Troca referências "consulte/visite o capítulo X" por "clique aqui"
  if (!text) return text;
  return text.replace(/(para saber mais sobre\s+[^.]+?)\s+(consulte|visite)\s+o\s+cap[íi]tulo\s+([\w\d]+)/gi, "$1 clique aqui");
}
