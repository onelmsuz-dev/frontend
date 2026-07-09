import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── O'quvchi paneli ──────────────────────────────────────────────────────────
export function useStudentProfile() {
  return useSWR("/api/panel/profile", fetcher);
}
export function useStudentGroups() {
  return useSWR("/api/panel/groups", fetcher);
}
export function useStudentPayments() {
  return useSWR("/api/panel/payments", fetcher);
}
export function useStudentAttendance() {
  return useSWR("/api/panel/attendance", fetcher);
}

// ─── O'qituvchi paneli ────────────────────────────────────────────────────────
export function useTeacherSummary() {
  return useSWR("/api/panel/teacher/summary", fetcher);
}
