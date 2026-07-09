import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useBranches() {
  return useSWR("/api/branches", fetcher);
}
