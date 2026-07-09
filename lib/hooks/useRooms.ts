import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useRooms() {
  return useSWR("/api/rooms", fetcher);
}
