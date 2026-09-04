import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useBranch } from "@/lib/contexts/branch-context";
import { fetcher } from "@/lib/fetcher";

async function poster(url: string, { arg }: { arg: unknown }) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw await r.json();
  return r.json();
}

async function patcher(url: string, { arg }: { arg: unknown }) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw await r.json();
  return r.json();
}

async function deleter(url: string) {
  const r = await fetch(url, { method: "DELETE" });
  if (!r.ok) throw await r.json();
  return r.json();
}

export interface StudentsQuery {
  groupId?: string;
  search?: string;
  /** O'qituvchi bo'yicha — o'quvchining istalgan guruhi shu ustozniki bo'lsa. */
  teacherId?: string;
  /** "qarzdor" | "tolangan" — balans bo'yicha. */
  debt?: string;
  /** "SINOV" | "FAOL" | "CHIQIB_KETGAN" — a'zolik holati. */
  enrollmentStatus?: string;
  /** Qabul sanasi (`joinedAt`) oralig'i — "YYYY-MM-DD". */
  joinedFrom?: string;
  joinedTo?: string;
}

/**
 * Filtrlash SERVERDA bajariladi.
 *
 * Ilgari sahifa butun ro'yxatni tortib, brauzerda filtrlardi. Javob 1000 ta
 * qatorga cheklangani uchun katta markazda filtr "qolgan 1000 tadan" ishlab,
 * natija to'liq bo'lmasdi. Endi har bir filtr so'rovga qo'shiladi — SWR uchun
 * kalit ham o'zgaradi, ya'ni har bir kombinatsiya alohida keshlanadi.
 */
export function useStudents(params?: StudentsQuery) {
  const { activeBranchId } = useBranch();
  const query = new URLSearchParams();
  if (params?.groupId)   query.set("groupId",   params.groupId);
  if (params?.search)    query.set("q",         params.search);
  if (params?.teacherId) query.set("teacherId", params.teacherId);
  if (params?.debt)      query.set("debt",      params.debt);
  if (params?.enrollmentStatus) query.set("enrollmentStatus", params.enrollmentStatus);
  if (params?.joinedFrom) query.set("joinedFrom", params.joinedFrom);
  if (params?.joinedTo)   query.set("joinedTo",   params.joinedTo);
  if (activeBranchId)    query.set("branchId",  activeBranchId);
  const qs = query.toString();
  return useSWR(`/api/students${qs ? `?${qs}` : ""}`, fetcher);
}

export function useStudent(id: string) {
  return useSWR(id ? `/api/students/${id}` : null, fetcher);
}

export function useCreateStudent() {
  return useSWRMutation("/api/students", poster);
}

export function useUpdateStudent(id: string) {
  return useSWRMutation(`/api/students/${id}`, patcher);
}

export function useDeleteStudent(id: string) {
  return useSWRMutation(`/api/students/${id}`, (url) => deleter(url));
}
