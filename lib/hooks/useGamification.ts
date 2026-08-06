import useSWR from "swr";

/** Xatoni yutmaydigan fetcher — `useSms.ts` bilan bir xil yondashuv:
 *  "ruxsat yo'q" yoki "o'chirilgan" holatlari bo'sh ro'yxat bo'lib
 *  ko'rinmasligi kerak. */
const fetcher = async (url: string) => {
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error ?? `So'rov bajarilmadi (${r.status})`);
  return data;
};

// ─── Turlar ───────────────────────────────────────────────────────────────────

export interface LevelInfo {
  level: number;
  name: string;
  minXp: number;
  nextXp: number | null;
  progress: number;
}

export interface GamificationSettings {
  organizationId: string;
  /** Uchala kalit ham yoniqmi (platforma → markaz → markazning o'zi). */
  active: boolean;
  /** O'chiq bo'lsa — kim o'chirgan. `null` bo'lsa faqat markazning o'z kaliti. */
  blockedBy: "platform" | "organization" | null;
  enabled: boolean;
  coinName: string;
  coinIcon: string;

  attendanceEnabled: boolean;
  attendanceXp: number;
  attendanceCoin: number;
  lateXp: number;
  lateCoin: number;
  streakEvery: number;
  streakXp: number;
  streakCoin: number;

  paymentEnabled: boolean;
  onTimeDay: number;
  onTimeXp: number;
  onTimeCoin: number;
  earlyXp: number;
  earlyCoin: number;

  manualEnabled: boolean;
  manualMaxPerDay: number;

  leaderboardEnabled: boolean;
  levels: { level: number; name: string; minXp: number }[];
}

export interface GamificationStudent {
  id: string;
  name: string;
  phone: string;
  xpTotal: number;
  coinBalance: number;
  coinEarned: number;
  streak: number;
  bestStreak: number;
  level: LevelInfo;
}

export interface PointRow {
  id: string;
  xp: number;
  coin: number;
  reason: string;
  note: string | null;
  createdAt: string;
}

export interface LeaderboardRow {
  id: string;
  name: string;
  xp: number;
  streak: number;
}

export interface StudentGamification {
  active: boolean;
  coinName: string;
  coinIcon: string;
  student: {
    id: string;
    name: string;
    xpTotal: number;
    coinBalance: number;
    coinEarned: number;
    streak: number;
    bestStreak: number;
  };
  level: LevelInfo;
  monthXp: number;
  history: PointRow[];
}

// ─── Markaz paneli ────────────────────────────────────────────────────────────

export function useGamificationSettings() {
  return useSWR<GamificationSettings>("/api/gamification/settings", fetcher);
}

export function useGamificationStudents(q?: string, groupId?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (groupId && groupId !== "barchasi") params.set("groupId", groupId);
  const qs = params.toString();
  return useSWR<GamificationStudent[]>(`/api/gamification/students${qs ? `?${qs}` : ""}`, fetcher);
}

export function useGamificationLeaderboard(groupId?: string, month?: string) {
  const params = new URLSearchParams();
  if (groupId) params.set("groupId", groupId);
  if (month) params.set("month", month);
  return useSWR<{ month: string; rows: LeaderboardRow[] }>(
    groupId ? `/api/gamification/leaderboard?${params.toString()}` : null,
    fetcher,
  );
}

export function useStudentPointHistory(studentId?: string) {
  return useSWR<PointRow[]>(
    studentId ? `/api/gamification/students/${studentId}/history` : null,
    fetcher,
  );
}

// ─── O'quvchi paneli ──────────────────────────────────────────────────────────

export function usePanelGamification() {
  return useSWR<StudentGamification>("/api/panel/gamification", fetcher);
}

export function usePanelLeaderboard(groupId?: string) {
  const qs = groupId ? `?groupId=${groupId}` : "";
  return useSWR<{
    month: string;
    rows: LeaderboardRow[];
    groupId: string | null;
    groups: { id: string; name: string }[];
    me: string;
  }>(`/api/panel/gamification/leaderboard${qs}`, fetcher);
}

// ─── Yordamchilar ─────────────────────────────────────────────────────────────

export const REASON_LABELS: Record<string, string> = {
  ATTENDANCE:      "Darsga keldi",
  ATTENDANCE_LATE: "Kech keldi",
  STREAK:          "Ketma-ketlik bonusi",
  PAYMENT_ONTIME:  "O'z vaqtida to'lov",
  PAYMENT_EARLY:   "Oldindan to'lov",
  REFERRAL:        "Do'st taklif qildi",
  MANUAL:          "Qo'lda berildi",
  REDEEM:          "Do'konda sarflandi",
  REFUND:          "Qaytarildi",
  REVOKE:          "Bekor qilindi",
  ADJUSTMENT:      "Tuzatish",
};

export const REASON_COLORS: Record<string, string> = {
  ATTENDANCE:      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ATTENDANCE_LATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  STREAK:          "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  PAYMENT_ONTIME:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PAYMENT_EARLY:   "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  REFERRAL:        "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  MANUAL:          "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  REDEEM:          "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  REFUND:          "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  REVOKE:          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  ADJUSTMENT:      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};
