import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useOrganization() {
  return useSWR("/api/organization", fetcher);
}
