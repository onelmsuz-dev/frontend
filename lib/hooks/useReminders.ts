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
  studentId: string;
  studentName: string;
  text: string;
  dueDate: string | null;
  done: boolean;
  doneAt: string | null;
  assigneeId: string;
  assigneeName: string;
  createdAt: string;
  createdBy: string;
  status: ReminderStatus;
}

export function useStaffMembers() {
  return useSWR<StaffMember[]>("/api/staff-members", fetcher);
}

/** Joriy foydalanuvchiga biriktirilgan vazifalar — top-header belgisi shundan sanaydi. */
export function useMyTasks() {
  return useSWR<Reminder[]>("/api/reminders?assigneeId=me", fetcher, { refreshInterval: 60_000 });
}

/** Barcha vazifalar — CEO hisoboti uchun. */
export function useAllReminders() {
  return useSWR<Reminder[]>("/api/reminders", fetcher);
}

function revalidateReminders() {
  mutate((k: unknown) => typeof k === "string" && k.includes("/reminders"), undefined, { revalidate: true });
}

export async function toggleReminderDone(id: string, done: boolean) {
  await fetch(`/api/reminders/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  revalidateReminders();
}

export async function deleteReminder(id: string) {
  await fetch(`/api/reminders/${id}`, { method: "DELETE" });
  revalidateReminders();
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
