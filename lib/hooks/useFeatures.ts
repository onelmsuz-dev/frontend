import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

/**
 * BOSQICHMA-BOSQICH CHIQARILGAN FUNKSIYALAR.
 *
 * `useMe` ga TIRKALMAGAN — u `revalidateOnFocus: false` bilan sozlangan va
 * ochiq turgan tabda hech qachon yangilanmasdi. Bayroqning butun qiymati esa
 * orqaga qaytarish tezligida: platforma admini funksiyani o'chirsa,
 * foydalanuvchi tabga qaytgan zahoti buni bilishi kerak.
 */
export function useFeatures() {
  return useSWR<Record<string, boolean>>("/api/features", fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: true,
  });
}

/**
 * `undefined` = hali noma'lum (yuklanmoqda).
 *
 * DIQQAT: chaqiruvchi joyda HECH QACHON `?? true` qilinmaydi. Noma'lum holat
 * "yoqilgan" deb talqin qilinsa, bayroq o'chiq markazda funksiya bir lahzaga
 * miltillab ko'rinardi.
 */
export function useFeature(key: string): boolean | undefined {
  const { data } = useFeatures();
  return data ? data[key] === true : undefined;
}
