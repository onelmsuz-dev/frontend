import useSWR from "swr";

/**
 * Xatoni yutmaydigan fetcher.
 *
 * Ilgari bu yerda oddiy `r.json()` turgan edi: so'rov 403/404 qaytarsa ham
 * SWR uni "muvaffaqiyat" deb qabul qilardi va sahifa ism/telefonsiz bo'sh
 * holda chizilardi — foydalanuvchi nima bo'lganini bilmasdi. Endi xato
 * `error` bo'lib qaytadi va panel aniq sabab ko'rsatadi.
 */
const fetcher = async (url: string) => {
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data?.error ?? `So'rov bajarilmadi (${r.status})`) as Error & { status?: number };
    err.status = r.status;
    throw err;
  }
  return data;
};

// ─── O'quvchi paneli ──────────────────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  parentPhone: string | null;
  parentName: string | null;
  school: string | null;
  birthDate: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
  branch: { id: string; name: string } | null;
  organization: { name: string } | null;
  _count: { groups: number };
}

export interface AttendanceBreakdown {
  KELDI: number;
  KECH_KELDI: number;
  KELMADI: number;
  SABABLI: number;
}

export interface StudentAttendance {
  records: {
    id: string; date: string; status: string;
    note: string | null; group: { name: string } | null;
  }[];
  rate: number;
  total: number;
  present: number;
  breakdown: AttendanceBreakdown;
}

export interface ScheduleItem {
  date: string;
  groupId: string;
  groupName: string;
  courseName: string | null;
  teacherName: string | null;
  roomName: string | null;
  startTime: string;
  endTime: string;
}

export function useStudentProfile() {
  return useSWR<StudentProfile>("/api/panel/profile", fetcher);
}
export function useStudentGroups() {
  return useSWR("/api/panel/groups", fetcher);
}
export function useStudentPayments() {
  return useSWR("/api/panel/payments", fetcher);
}
export function useStudentAttendance() {
  return useSWR<StudentAttendance>("/api/panel/attendance", fetcher);
}
/** Yaqin 14 kundagi darslar. */
export function useStudentSchedule() {
  return useSWR<ScheduleItem[]>("/api/panel/schedule", fetcher);
}

// ─── O'qituvchi paneli ────────────────────────────────────────────────────────
export function useTeacherSummary() {
  return useSWR("/api/panel/teacher/summary", fetcher);
}
