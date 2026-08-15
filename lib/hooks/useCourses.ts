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

export function useCourses() {
  const { activeBranchId } = useBranch();
  const qs = activeBranchId ? `?branchId=${activeBranchId}` : "";
  return useSWR(`/api/courses${qs}`, fetcher);
}

export function useCourse(id: string) {
  return useSWR(id ? `/api/courses/${id}` : null, fetcher);
}

export function useCreateCourse() {
  return useSWRMutation("/api/courses", poster);
}
