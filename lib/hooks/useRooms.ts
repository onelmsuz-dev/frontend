import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

/**
 * Barcha filiallar xonalari (filtrlanmagan) — Sozlamalar sahifasi shu
 * ro'yxatni filial bo'yicha guruhlab ko'rsatadi, shuning uchun bu yerda
 * activeBranchId bo'yicha cheklab bo'lmaydi. Faqat aktiv filial xonalari
 * kerak bo'lgan joyda (masalan guruh yaratish) natijani chaqiruvchi tomonda
 * filtrlang (masalan useBranch().activeBranchId bilan).
 */
export function useRooms() {
  return useSWR("/api/rooms", fetcher);
}
