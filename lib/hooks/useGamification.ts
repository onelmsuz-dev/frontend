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

  shopEnabled: boolean;
  /** 1 coin necha so'm — DISCOUNT sovg'a narxini avtomatik hisoblash uchun. */
  discountRate: number;

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

// ─── Do'kon ───────────────────────────────────────────────────────────────────

export type RewardKind = "PHYSICAL" | "DISCOUNT" | "PRIVILEGE";
export type RedemptionStatus = "PENDING" | "APPROVED" | "DELIVERED" | "REJECTED";

export interface Reward {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  kind: RewardKind;
  cost: number;
  discountAmount: number | null;
  stock: number | null;
  isActive: boolean;
  sortOrder: number;
  branchId: string | null;
  branch?: { id: string; name: string } | null;
  _count?: { redemptions: number };
}

export interface Redemption {
  id: string;
  rewardTitle: string;
  rewardEmoji: string;
  kind: RewardKind;
  cost: number;
  discountAmount: number | null;
  status: RedemptionStatus;
  note: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  student?: { id: string; name: string; phone: string; coinBalance: number };
}

/** Markaz — do'kon boshqaruvi. */
export function useRewards() {
  return useSWR<{ rewards: Reward[]; discountRate: number; coinName: string; coinIcon: string }>(
    "/api/gamification/rewards", fetcher,
  );
}

/** Markaz — sovg'a so'rovlari. */
export function useRedemptions(status = "PENDING") {
  return useSWR<{ rows: Redemption[]; pendingCount: number }>(
    `/api/gamification/redemptions?status=${status}`, fetcher,
  );
}

/** O'quvchi — do'kon. */
export function usePanelShop() {
  return useSWR<{
    active: boolean;
    rewards: Omit<Reward, "isActive" | "sortOrder" | "branchId">[];
    coinBalance: number;
    coinName: string;
    coinIcon: string;
  }>("/api/panel/gamification/shop", fetcher);
}

/** O'quvchi — mening so'rovlarim. */
export function usePanelRedemptions() {
  return useSWR<Redemption[]>("/api/panel/gamification/redemptions", fetcher);
}

export const KIND_LABELS: Record<RewardKind, string> = {
  PHYSICAL:  "Jismoniy sovg'a",
  DISCOUNT:  "To'lovga chegirma",
  PRIVILEGE: "Imtiyoz",
};

export const KIND_COLORS: Record<RewardKind, string> = {
  PHYSICAL:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  DISCOUNT:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  PRIVILEGE: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

export const STATUS_LABELS: Record<RedemptionStatus, string> = {
  PENDING:   "Kutilmoqda",
  APPROVED:  "Tasdiqlandi",
  DELIVERED: "Topshirildi",
  REJECTED:  "Rad etildi",
};

export const STATUS_COLORS: Record<RedemptionStatus, string> = {
  PENDING:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  APPROVED:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  REJECTED:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

/**
 * Sovg'a narxini "necha darsda yig'iladi" ga aylantiradi.
 *
 * Markaz egasi uchun eng muhim ko'rsatkich: 500 coin'lik sumka 50 ta dars
 * degani — bu bir yarim yil. Narx real yoki emasligini shu ko'rsatadi.
 */
export function costInLessons(cost: number, coinPerLesson: number) {
  if (coinPerLesson <= 0) return null;
  const lessons = Math.ceil(cost / coinPerLesson);
  const weeks = Math.ceil(lessons / 3); // odatda haftada 3 dars
  return { lessons, weeks, months: Math.round((weeks / 4.3) * 10) / 10 };
}

/** Bitta o'quvchi oyiga o'rtacha necha coin yig'adi (12 dars + o'z vaqtida to'lov). */
export function monthlyEarning(s: Pick<GamificationSettings,
  "attendanceCoin" | "onTimeCoin" | "streakCoin" | "streakEvery" | "attendanceEnabled" | "paymentEnabled">) {
  const lessons = 12; // haftada 3 dars × 4 hafta
  const attendance = s.attendanceEnabled ? s.attendanceCoin * lessons : 0;
  const streak = s.attendanceEnabled && s.streakEvery > 0
    ? Math.floor(lessons / s.streakEvery) * s.streakCoin : 0;
  const payment = s.paymentEnabled ? s.onTimeCoin : 0;
  return attendance + streak + payment;
}
