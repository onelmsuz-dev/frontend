import { useSyncExternalStore } from "react";

/**
 * O'QUVCHILAR RO'YXATI FILTRLARI — foydalanuvchi o'zi o'zgartirmaguncha
 * saqlanadi. `useState` da turganda profilga kirib qaytganda sahifa qayta
 * o'rnatilib, filtr standartga tushib qolardi.
 *
 * URL emas: profildagi "Orqaga" va menyu oddiy `/students` ga olib boradi,
 * URL'dagi filtr shu yerda yo'qolardi. `localStorage` emas: filtr bir necha
 * kundan keyin ham yoqiq qolib, ro'yxat to'liqdek ko'rinmasligi kerak —
 * `sessionStorage` vkladka yopilguncha yashaydi.
 */

const KALIT = "oneroom:students:filters";

const STANDART = {
  search: "",
  filterEnroll: "barchasi",
  filterGroup: "barchasi",
  filterTeacher: "barchasi",
  filterDebt: "barchasi",
  joinedFrom: "",
  joinedTo: "",
  showFilters: false,
};

export type StudentFilters = typeof STANDART;

// `useSyncExternalStore` bir xil havolani kutadi — har o'qishda JSON'dan
// yangi obyekt qaytarilsa, cheksiz qayta chizish bo'lardi.
let joriy: StudentFilters | null = null;
const tinglovchilar = new Set<() => void>();

function oqi(): StudentFilters {
  if (joriy) return joriy;
  joriy = STANDART;
  try {
    const saqlangan = window.sessionStorage.getItem(KALIT);
    if (saqlangan) joriy = { ...STANDART, ...JSON.parse(saqlangan) };
  } catch {}
  return joriy as StudentFilters;
}

function yangila(ozgarish: Partial<StudentFilters>) {
  joriy = { ...oqi(), ...ozgarish };
  try { window.sessionStorage.setItem(KALIT, JSON.stringify(joriy)); } catch {}
  tinglovchilar.forEach(fn => fn());
}

function obuna(fn: () => void) {
  tinglovchilar.add(fn);
  return () => { tinglovchilar.delete(fn); };
}

export function useStudentFilters() {
  const filters = useSyncExternalStore(obuna, oqi, () => STANDART);
  return [filters, yangila] as const;
}
