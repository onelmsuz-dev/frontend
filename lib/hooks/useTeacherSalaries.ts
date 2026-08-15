import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useTeacherSalaries(month?: string) {
  const url = month
    ? `/api/teacher-salaries?month=${month}`
    : "/api/teacher-salaries";
  return useSWR(url, fetcher);
}
