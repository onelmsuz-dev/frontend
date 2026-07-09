import useSWR from "swr";
import { useBranchQueryString } from "@/lib/contexts/branch-context";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDashboard() {
  const qs = useBranchQueryString();
  return useSWR(`/api/dashboard${qs}`, fetcher);
}
