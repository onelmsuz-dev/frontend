import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useUsers() {
  return useSWR("/api/users", fetcher);
}
