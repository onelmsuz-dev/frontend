import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useBranches() {
  return useSWR("/api/branches", fetcher);
}
