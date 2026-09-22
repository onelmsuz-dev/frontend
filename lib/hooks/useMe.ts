import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface MeData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  teacherId: string | null;
  studentId: string | null;
  organizationId: string | null;
  branchId: string | null;
  /** Xodim ko'ra oladigan filiallar. Bo'sh = barchasi. */
  branchIds?: string[];
  staffRoleId: string | null;
  orgSubdomain: string | null;
  acceptsPayments?: boolean;
  /** Markaz tanlagan shrift o'lchami — `<html data-font>` shundan qo'yiladi. */
  uiFontScale?: "STANDART" | "ORTA" | "KATTA" | "JUDA_KATTA";
  /** Tarif muddati + grace-period tugagan — org resurslari backendda bloklangan. */
  subscriptionBlocked?: boolean;
  /**
   * Tarif holati to'liq — panel tepasidagi ogohlantirish uchun.
   * `null` — o'quvchi yoki platforma admini (ularda tarif tushunchasi yo'q).
   */
  subscription?: {
    active: boolean;
    daysLeft: number;
    expiresAt: string | null;
    /** Muddat TUGAMAGAN, lekin 3 kun yoki kamroq qolgan. */
    warning: boolean;
    expired: boolean;
    blocked: boolean;
  } | null;
  permissions: string[];
}

/** Joriy foydalanuvchi + effective permissionlar (BFF → backend /api/me). */
export function useMe() {
  const { data, error, isLoading } = useSWR<MeData>("/api/me", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
  return { me: data, isLoading, error };
}

/** Permission tekshiruvi ("*" = hammasi). */
export function hasPerm(permissions: string[] | undefined, key: string): boolean {
  if (!permissions) return false;
  return permissions.includes("*") || permissions.includes(key);
}
