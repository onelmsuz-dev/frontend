import useSWR, { mutate as globalMutate } from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());
const KEY = "/api/notifications";

export function useNotifications() {
  const { data, isLoading } = useSWR(KEY, fetcher, { refreshInterval: 30_000 });

  async function markAllRead() {
    await fetch(KEY, { method: "PATCH" });
    globalMutate(KEY);
  }

  return {
    items:    (data?.items  ?? []) as Notification[],
    unread:   (data?.unread ?? 0)  as number,
    isLoading,
    markAllRead,
  };
}

export type Notification = {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  isRead:    boolean;
  createdAt: string;
};
