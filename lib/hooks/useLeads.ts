import { useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import useSWRInfinite from "swr/infinite";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

async function poster(url: string, { arg }: { arg: unknown }) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw await r.json();
  return r.json();
}

async function patcher(url: string, { arg }: { arg: unknown }) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw await r.json();
  return r.json();
}

async function deleter(url: string) {
  const r = await fetch(url, { method: "DELETE" });
  if (!r.ok) throw await r.json();
  return r.json();
}

/** Bir so'rovda nechta lid — server chegarasi ham shu (1000). */
const SAHIFA = 500;

/** Avtomatik yuklanadigan yuqori chegara — undan keyin qo'lda. */
const AVTO_CHEGARA = 5000;

/**
 * LIDLAR — SAHIFALAB YUKLANADI.
 *
 * Ilgari bitta so'rov edi va server 500 ta bilan cheklardi. Prodda
 * oqibati (Juniors Academy, 2026-09-15): 938 lidning 438 tasi ekranda
 * UMUMAN ko'rinmadi va markaz "import 500 tada to'xtabdi" deb o'yladi.
 *
 * Endi sahifalar ketma-ket olinadi va `jami` bilan solishtiriladi —
 * "yana bormi?" degan savolga javob bor.
 */
export function useLeads(params?: { stageId?: string; search?: string }) {
  const { items, total, isLoading, error, mutate } = useLeadsPaged(params);
  // Eski chaqiruvchilar massiv kutadi — shakl o'zgarishi ularni buzmasin.
  return { data: items, total, isLoading, error, mutate };
}

/** "Jonli" taxta — yangi lid/o'zgarish qanchalik tez ko'rinsin. */
const JONLI_MS = 20_000;

export function useLeadsPaged(params?: {
  stageId?: string; search?: string;
  /**
   * JONLI — boshqa joyda qo'shilgan/o'zgargan lid sahifa yangilanmasdan
   * ko'rinsin (target sahifasi, Meta, hamkasb). Faqat lidlar taxtasida
   * yoqiladi; bosh sahifa kabi boshqa chaqiruvchilarga kerak emas.
   */
  jonli?: boolean;
}) {
  const qs = (skip: number) => {
    const q = new URLSearchParams();
    if (params?.stageId) q.set("stageId", params.stageId);
    if (params?.search)  q.set("q", params.search);
    q.set("take", String(SAHIFA));
    q.set("skip", String(skip));
    return q.toString();
  };

  const { data, size, setSize, isLoading, error, mutate } = useSWRInfinite<{
    items: unknown[]; total: number; skip: number; take: number; latestAt?: string | null;
  }>(
    (index, oldingi) => {
      // Oldingi sahifa oxirgisi bo'lsa — to'xtaymiz.
      if (oldingi && oldingi.skip + oldingi.items.length >= oldingi.total) return null;
      return `/api/leads?${qs(index * SAHIFA)}`;
    },
    fetcher,
    { revalidateFirstPage: false },
  );

  const sahifalar = data ?? [];
  const items = sahifalar.flatMap((p) => p?.items ?? []);
  const total = sahifalar[0]?.total ?? 0;

  /**
   * YURAK URISHI — yengil so'rov (`take=1`), 20 soniyada bir.
   *
   * NEGA KERAK: ro'yxat `revalidateFirstPage: false` bilan olinadi (1183
   * lidni avto-yuklashda birinchi sahifa har safar qayta so'ralmasin).
   * Uning yon ta'siri — fokus yoki taymer bo'yicha qayta tekshiruv
   * HECH BIR sahifani qayta olmaydi: target sahifasidan kelgan lid
   * xodim sahifani qo'lda yangilamaguncha ko'rinmasdi (Doniyorjon,
   * 2026-09-24). Butun ro'yxatni 20 soniyada qayta olish esa 1000+
   * lidli markazda ortiqcha yuk.
   *
   * Yurak urishi `total` va `latestAt` (eng so'nggi `updatedAt`) ni
   * qaytaradi; farq bo'lsagina ro'yxat, bosqich sonlari va "vaqti
   * kelganlar" qayta olinadi.
   */
  const pulsKalit = params?.jonli
    ? `/api/leads?${qs(0).replace(`take=${SAHIFA}`, "take=1")}&puls=1`
    : null;
  const { data: puls } = useSWR<{ total: number; latestAt?: string | null }>(
    pulsKalit, fetcher, { refreshInterval: JONLI_MS, dedupingInterval: 5_000 });
  const bizdagi = sahifalar[0] as { latestAt?: string | null } | undefined;
  const bizdagiLatest = bizdagi?.latestAt ?? null;
  useEffect(() => {
    if (!puls || !bizdagi) return;
    if (puls.total === total && (puls.latestAt ?? null) === bizdagiLatest) return;
    void mutate();
    void globalMutate((k) => typeof k === "string"
      && (k.startsWith("/api/leads/counts") || k.startsWith("/api/leads/due")));
    // `bizdagi` obyekt — faqat qiymatlari muhim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puls?.total, puls?.latestAt, total, bizdagiLatest, mutate]);

  /**
   * QOLGAN SAHIFALAR O'ZI YUKLANADI.
   *
   * Tugmaga qoldirib bo'lmaydi: markaz 1183 ta lid import qilib, ekranda
   * 500 tasini ko'rsa — tugma yonida tursa ham — "import ishlamadi" deb
   * o'ylaydi. Aynan shu xabar keldi.
   *
   * Xavfsiz, chunki QOTISH kartochkalar sonidan edi, ma'lumot hajmidan
   * emas: ustun bir vaqtda 40 tadan chizadi (`kanban-column.tsx`).
   * 1183 ta yengil obyektni xotirada saqlash hech narsa turmaydi.
   *
   * Yuqori chegara baribir bor — juda katta bazada cheksiz so'rov
   * bo'lmasin; undan oshsa qo'lda yuklash tugmasi chiqadi.
   */
  const yuklangan = items.length;
  useEffect(() => {
    const oxirgi = sahifalar[sahifalar.length - 1];
    if (!oxirgi) return;
    // To'liq sahifa qaytgan bo'lsa demak davomi bor. Bu shart aylanishni
    // ham to'xtatadi: yarim sahifa kelishi — oxiri degani.
    const toliq = (oxirgi.items?.length ?? 0) >= oxirgi.take;
    if (toliq && yuklangan < oxirgi.total && yuklangan < AVTO_CHEGARA) {
      setSize((n) => n + 1);
    }
  }, [sahifalar, yuklangan, setSize]);

  return {
    items, total, isLoading, error, mutate,
    yuklangan,
    yanaBor: yuklangan < total,
    /** Avtomatik yuklash chegarasiga yetdi — qolganini qo'lda. */
    qolgaYetdi: yuklangan >= AVTO_CHEGARA && yuklangan < total,
    yanaYukla: () => setSize(size + 1),
  };
}

export function useCreateLead() {
  return useSWRMutation("/api/leads", poster);
}

export function useUpdateLead(id: string) {
  return useSWRMutation(`/api/leads/${id}`, patcher);
}

export function useDeleteLead(id: string) {
  return useSWRMutation(`/api/leads/${id}`, (url) => deleter(url));
}

/**
 * LID MANBALARI.
 *
 * Ro'yxat markazga bog'liq: kimdir "Maktab tashrifi" bilan ishlaydi,
 * kimdir "Banner" bilan. Ilgari u kodda qattiq yozilgan edi va markaz
 * o'z manbasini qo'sha olmasdi — natijada hamma narsa "Boshqa" ga
 * tushib, "qaysi reklama ishlayapti?" degan savol javobsiz qolardi.
 */
export function useLeadSources() {
  return useSWR<{ id: string; name: string }[]>("/api/leads/sources", fetcher);
}

/**
 * LID BOSQICHLARI (Kanban ustunlari) — markaz o'zi to'liq boshqaradi.
 *
 * Ilgari qattiq 5 qiymatli edi. `LeadSource`dan farqi: bu yerda
 * `sortOrder` MUHIM (ustunlar tartibi) va `kind` orqali maxsus xatti-
 * harakat (kurs talabi, konversiya) aniqlanadi — backend
 * `LeadStagesService`ga qarang.
 */
export interface LeadStage {
  id: string;
  name: string;
  kind: "NORMAL" | "WON" | "LOST";
  color: string;
  sortOrder: number;
}

export function useLeadStages() {
  return useSWR<LeadStage[]>("/api/leads/stages", fetcher);
}

export interface FeedItem {
  kind: "event" | "comment";
  id: string;
  at: string;
  actorName: string;
  text: string;
  changes: string[];
  editedAt?: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

export interface LeadFeed {
  lead: {
    id: string; name: string; createdAt: string;
    /** Ariza ma'lumotlari — tarix oynasi tepasida. */
    phone?: string; source?: string; note?: string | null; course?: string | null;
    school?: string | null; grade?: string | null;
    /** Target sahifasidagi qo'shimcha savollarga javoblar. */
    extra?: { label: string; value: string }[] | null;
  };
  items: FeedItem[];
  truncated: boolean;
  commentCount: number;
}

/**
 * BITTA LIDNING TASMASI — tizim tarixi va odam izohlari birga.
 *
 * `leadId` bo'sh bo'lsa so'rov YUBORILMAYDI (SWR kaliti `null`): oyna
 * yopiq turganda ham har renderda so'rov ketmasin.
 */
export function useLeadFeed(leadId: string | null) {
  return useSWR<LeadFeed>(leadId ? `/api/leads/${leadId}/feed` : null, fetcher);
}

/** Qo'ng'iroq natijalari — backend bilan bir xil ro'yxat. */
export const CALL_OUTCOMES = [
  { v: "GAPLASHDIM",    l: "Gaplashdim",    hint: "Keyingi bosqichga o'tadi" },
  { v: "JAVOB_BERMADI", l: "Javob bermadi", hint: "Bosqich o'zgarmaydi, urinish sanaladi" },
  { v: "QIZIQMADI",     l: "Qiziqmadi",     hint: "«Bekor» ga o'tadi" },
] as const;

export const LOST_REASONS = [
  { v: "NARX_QIMMAT",         l: "Narx qimmat" },
  { v: "VAQTI_TOGRI_KELMADI", l: "Vaqti to'g'ri kelmadi" },
  { v: "BOSHQA_MARKAZ",       l: "Boshqa markazga bordi" },
  { v: "JAVOB_BERMADI",       l: "Javob bermadi" },
  { v: "BOSHQA",              l: "Boshqa sabab" },
] as const;

export const LOST_REASON_UZ: Record<string, string> =
  Object.fromEntries(LOST_REASONS.map((r) => [r.v, r.l]));

export interface DueLead {
  id: string; name: string; phone: string; stageId: string;
  nextContactAt: string; contactAttempts: number; course?: string | null;
}

/**
 * BUGUN QO'NG'IROQ QILINADIGANLAR.
 *
 * Muddati o'tganlar ham shu ro'yxatda — ular yo'qolib ketmasligi
 * kerak, aks holda bir kun o'tkazib yuborilgan lid abadiy unutilardi.
 */
export function useDueLeads() {
  return useSWR<{ items: DueLead[]; overdue: number }>("/api/leads/due", fetcher);
}


// ─── SOTUV BO'LIMI (ROP) ─────────────────────────────────────────────────

export interface Assignee { id: string; name: string; role: string }

/** Lid biriktirish va "Sotuvchi" filtri uchun xodimlar ro'yxati. */
export function useLeadAssignees() {
  return useSWR<Assignee[]>("/api/leads/assignees", fetcher);
}

export interface LeadStatRow {
  userId: string | null;
  name: string;
  jami: number;
  aloqa: number;
  yutildi: number;
  yoqotildi: number;
  jarayonda: number;
  konversiya: number;
}

export interface LeadStats {
  from: string;
  to: string | null;
  rows: LeadStatRow[];
  jami: Omit<LeadStatRow, "userId" | "name">;
}

/**
 * Sotuvchilar hisoboti. `enabled` false bo'lsa SO'ROV KETMAYDI —
 * oddiy sotuvchida `leads.stats` yo'q va u har safar 403 olardi.
 */
export function useLeadStats(enabled: boolean, from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to)   qs.set("to", to);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useSWR<LeadStats>(enabled ? `/api/leads/stats${suffix}` : null, fetcher);
}

export interface DailyRow {
  userId: string;
  name: string;
  qongiroq: number;
  aylandi: number;
  yangiLid: number;
  bosqichga: Record<string, number>;
}

export interface DailyReport {
  date: string;
  stages: { id: string; name: string; kind: string }[];
  rows: DailyRow[];
}

/** Kunlik nazorat — "kun oxirida kim nima qildi". */
export function useLeadDaily(enabled: boolean, date?: string) {
  const suffix = date ? `?date=${date}` : "";
  return useSWR<DailyReport>(enabled ? `/api/leads/daily${suffix}` : null, fetcher);
}

// ─── O'CHIRILGAN LIDLAR ─────────────────────────────────────────────────

export interface DeletedLead {
  /** KORZINKA yozuvining id'si — tiklash aynan shuni talab qiladi. */
  id: string;
  title: string;
  subtitle: string;
  /** Nega o'chirilgan — o'chirishda MAJBURIY so'raladi. */
  reason: string | null;
  actorName: string;
  deletedAt: string;
}

/**
 * Taxtadagi "O'chirilganlar" ustuni.
 *
 * Switch O'CHIQ bo'lsa so'rov UMUMAN ketmaydi (`enabled` false → kalit
 * `null`). Bu muhim: taxta har ochilganda qo'shimcha so'rov yuborilsa,
 * 1000 lidli markazda birinchi chizilish sekinlashardi va ma'lumot
 * ko'pchilikka kerak ham emas.
 */
export function useDeletedLeads(enabled: boolean) {
  const { data, isLoading, mutate } = useSWR<{
    items: DeletedLead[]; nextCursor: string | null;
  }>(enabled ? "/api/leads/deleted?limit=50" : null, fetcher);
  return {
    items: data?.items ?? [],
    yanaBor: !!data?.nextCursor,
    isLoading,
    mutate,
  };
}

/** Korzinkadan lidni qaytaradi. `id` — korzinka yozuvining id'si. */
export async function restoreLead(trashId: string) {
  const r = await fetch(`/api/leads/deleted/${trashId}/restore`, { method: "POST" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error ?? "Tiklab bo'lmadi");
  return data;
}
