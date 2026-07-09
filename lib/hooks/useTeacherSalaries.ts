import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTeacherSalaries(month?: string) {
  const url = month
    ? `/api/teacher-salaries?month=${month}`
    : "/api/teacher-salaries";
  return useSWR(url, fetcher);
}
