import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export interface StaffRole {
  id: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  _count?: { users: number };
}

export interface PermissionGroup {
  key: string;
  label: string;
  permissions: { key: string; label: string }[];
}

export function useStaffRoles() {
  return useSWR<StaffRole[]>("/api/staff-roles", fetcher);
}

export function usePermissionCatalog() {
  return useSWR<PermissionGroup[]>("/api/staff-roles/permissions", fetcher);
}

export function useCreateStaffRole() {
  return useSWRMutation("/api/staff-roles", poster);
}

export function useUpdateStaffRole(id: string) {
  return useSWRMutation(`/api/staff-roles/${id}`, patcher);
}

export function useDeleteStaffRole(id: string) {
  return useSWRMutation(`/api/staff-roles/${id}`, (url: string) => deleter(url));
}
