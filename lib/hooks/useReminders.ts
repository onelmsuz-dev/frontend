import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export type ReminderStatus = "JARAYONDA" | "MUDDATI_OTGAN" | "BAJARILGAN";

export interface Reminder {
  id: string;
  /** Umumiy (o'quvchisiz) vazifada `null`. */
  studentId: string | null;
  studentName: string | null;
  text: string;
  dueDate: string | null;
  done: boolean;
  doneAt: string | null;
  assigneeId: string;
  assigneeName: string;
  createdAt: string;
  createdBy: string | null;
  status: ReminderStatus;
}

/** `/api/reminders/report` — backend BUTUN jadval bo'yicha sanaydi. */
export interface RemindersReport {
  total: number;
  done: number;
  /** Ochiq va muddati hali o'tmagan (frontenddagi "Jarayonda"). */
  open: number;
  overdue: number;
  byAssignee: { assigneeId: string; assigneeName: string; done: number; open: number; overdue: number }[];
}

export function useStaffMembers(enabled = true) {
  return useSWR<StaffMember[]>(enabled ? "/api/staff-members" : null, fetcher);
}

/**
 * Joriy foydalanuvchiga biriktirilgan vazifalar — top-header belgisi
 * shundan sanaydi. `enabled` — funksiya bayrog'i: o'chiq bo'lsa so'rov
 * UMUMAN yuborilmaydi (ilgari har bir foydalanuvchi har daqiqada 404
 * olib turardi).
 */
export function useMyTasks(enabled = true) {
  return useSWR<Reminder[]>(enabled ? "/api/reminders?assigneeId=me" : null, fetcher, { refreshInterval: 60_000 });
}

/**
 * Ochiq vazifalar — CEO hisobotidagi ro'yxat uchun. Sonlar esa
 * `useRemindersReport` dan: ro'yxat so'rovi 200 ta bilan cheklangan,
 * sanoq esa butun jadval bo'yicha bo'lishi kerak.
 */
export function useOpenReminders(enabled = true) {
  return useSWR<Reminder[]>(enabled ? "/api/reminders?status=open&limit=200" : null, fetcher);
}

export function useRemindersReport(enabled = true) {
  return useSWR<RemindersReport>(enabled ? "/api/reminders/report" : null, fetcher);
}

function revalidateReminders() {
  mutate((k: unknown) => typeof k === "string" && k.includes("/reminders"), undefined, { revalidate: true });
}

/** Xato bo'lsa server matni, muvaffaqiyatda `null`. */
async function xato(res: Response): Promise<string | null> {
  if (res.ok) return null;
  const d = await res.json().catch(() => ({}));
  return (d as { error?: string })?.error ?? "Bajarilmadi";
}

export async function toggleReminderDone(id: string, done: boolean): Promise<string | null> {
  try {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    return await xato(res);
  } catch {
    return "Serverga ulanib bo'lmadi";
  } finally {
    revalidateReminders();
  }
}

export async function deleteReminder(id: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    return await xato(res);
  } catch {
    return "Serverga ulanib bo'lmadi";
  } finally {
    revalidateReminders();
  }
}

/**
 * UMUMIY VAZIFA — o'quvchiga bog'liq bo'lmasligi ham mumkin (masalan
 * "yangi guruh jadvalini tasdiqlash"). `studentId` berilsa backend
 * shu o'quvchiga biriktiradi (`/vazifalarim`da ixtiyoriy tanlov).
 */
export async function createReminder(data: { text: string; dueDate?: string; assigneeId: string; studentId?: string }) {
  const res = await fetch("/api/reminders", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  revalidateReminders();
  return res.ok;
}
