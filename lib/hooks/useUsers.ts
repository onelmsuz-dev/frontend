import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useUsers() {
  return useSWR("/api/users", fetcher);
}
