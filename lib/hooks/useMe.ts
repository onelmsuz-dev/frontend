import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
  staffRoleId: string | null;
  orgSubdomain: string | null;
  acceptsPayments?: boolean;
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
