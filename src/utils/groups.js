import { GROUPS } from "../constants/app";

// Warna default untuk grup yang tidak dikenal (sama dgn "lain_lain"/textM).
const FALLBACK_GROUP_COLOR = "#6b7280";

// Ambil label grup: utamakan grup custom (categoryGroups), lalu konstanta GROUPS, lalu id mentah.
export const getGroupLabel = (id, categoryGroups = []) => {
  if(!id) return "Lain-lain";
  const found = categoryGroups.find(group => group?.id === id);
  return found?.label || GROUPS[id]?.label || id;
};

// Ambil warna grup dengan urutan prioritas yang sama.
export const getGroupColor = (id, categoryGroups = []) => {
  const found = categoryGroups.find(group => group?.id === id);
  return found?.color || GROUPS[id]?.color || FALLBACK_GROUP_COLOR;
};
