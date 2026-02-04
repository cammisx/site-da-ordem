import origens from "../data/origens.json";
import classes from "../data/classes.json";
import pericias from "../data/pericias.json";
import equipamentos from "../data/equipamentos.json";
import rituais from "../data/rituais.json";

export const DB = {
  origens,
  classes,
  pericias,
  equipamentos,
  rituais,
};

export function listByCategory(categoryKey) {
  const arr = DB[categoryKey] || [];
  return [...arr].sort((a, b) => (a?.nome || "").localeCompare(b?.nome || "", "pt-BR"));
}

export function getById(categoryKey, id) {
  const arr = DB[categoryKey] || [];
  return arr.find((x) => x?.id === id) || null;
}
