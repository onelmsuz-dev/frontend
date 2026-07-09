import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useOrganization() {
  return useSWR("/api/organization", fetcher);
}
