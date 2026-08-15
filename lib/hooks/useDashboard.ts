import useSWR from "swr";
import { useBranchQueryString } from "@/lib/contexts/branch-context";
import { fetcher } from "@/lib/fetcher";

export function useDashboard() {
  const qs = useBranchQueryString();
  return useSWR(`/api/dashboard${qs}`, fetcher);
}
