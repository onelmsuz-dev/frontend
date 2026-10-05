"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopHeader } from "@/components/layout/top-header";
import { BranchFilter } from "@/components/layout/branch-filter";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { StudentDeleteModal } from "@/components/students/student-delete-modal";
import { StudentFormModal } from "@/components/students/student-form-modal";
import { StudentBulkBar } from "@/components/students/student-bulk-bar";
import { StudentImportModal } from "@/components/students/student-import-modal";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Phone, MessageSquare, Edit, GraduationCap, Trash2, Plus,
  UserCheck, Upload, Download, X, MoreHorizontal, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOUR_TARGETS } from "@/lib/onboarding/steps";
import { useStudents } from "@/lib/hooks/useStudents";
import { useGroups } from "@/lib/hooks/useGroups";
import { useTeachers } from "@/lib/hooks/useTeachers";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { payStatusFromBalance, PAY_STATUS_CFG } from "@/lib/payment-status";
import { toCsv, downloadFile, exportPhone } from "@/lib/csv";
import { mutate } from "swr";
import { formatUzDate } from "@/lib/date-uz";
import { formatCurrency, formatNumber } from "@/lib/money";
import { TabGlide, segCls } from "@/components/ui/tab-glide";

function fmt(v: number) {
  return formatCurrency(v);
}
/** Kartochka uchun — valyuta prefiksisiz, yorliqda "so'm" deb yozilgan. */
function fmtSum(v: number) {
  return formatNumber(v);
}
/** Bir martada chiziladigan qatorlar soni. */
const SAHIFA_OLCHAMI = 50;

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

/**
 * O'QUVCHI HOLATI.
 *
 * Ilgari "Ketgan" faol guruh a'zoligi yo'qligidan chiqarilardi — endigina
 * qo'shilgan, hali guruhga biriktirilmagan o'quvchi ham "Ketgan" bo'lib
 * ko'rinardi va "Jami" hisobidan tushib qolardi. Endi:
 *   YANGI    — qo'shilgan, lekin HECH QACHON guruhga biriktirilmagan;
 *   SINOV    — guruhda, sinov darsida;
 *   FAOL     — guruhda, faol o'qiyapti;
 *   GURUHSIZ — guruhda BO'LGAN, lekin hozir hech qaysisida yo'q;
 *   KETGAN   — ATAYLAB shunday belgilangan (o'quvchi kartochkasidagi tugma).
 *
 * GURUHSIZ ni "Yangi" ga qo'shib yubormaymiz: yarim yil o'qib, keyin
 * guruhdan chiqarilgan o'quvchini "endigina keldi" deb ko'rsatish yolg'on
 * bo'lardi va u endigina kelganlar orasida yo'qolib ketardi.
 */
const ENROLL_CFG: Record<string, { label: string; cls: string }> = {
  YANGI:          { label: "Yangi",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  GURUHSIZ:       { label: "Guruhsiz", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  SINOV:          { label: "Sinov",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  FAOL:           { label: "Faol",   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CHIQIB_KETGAN:  { label: "Ketgan", cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500" },
};

const selectCls =
  "text-xs h-9 px-2.5 rounded-lg border border-white/60 dark:border-white/10 glass-soft " +
  "text-neutral-700 dark:text-neutral-300 outline-none focus:border-indigo-500 transition-colors";

function revalidate() {
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/students"), undefined, { revalidate: true });
}

/**
 * O'quvchining chiqib ketmagan barcha a'zoliklari.
 *
 * Ilgari sahifa hamma joyda `s.groups?.[0]` deb olardi — ya'ni faqat ENG
 * SO'NGGI guruh. Bitta markazda bir o'quvchi 2-3 fanga qatnashishi odatiy
 * hol; qolgan guruhlari ro'yxatda umuman ko'rinmasdi va statistika ham
 * shu bitta a'zolik bo'yicha hisoblanardi.
 */
function activeGroupsOf(s: any): any[] {
  return (s.groups ?? []).filter((g: any) => g.enrollmentStatus !== "CHIQIB_KETGAN");
}

/** Ro'yxatda ko'rsatiladigan yagona a'zolik holati (eng "kuchlisi"). */
function enrollOf(s: any): string {
  // "Ketgan" — faqat ataylab belgilangan bo'lsa.
  if (s.archivedAt) return "CHIQIB_KETGAN";
  const active = activeGroupsOf(s);
  if (active.length > 0) {
    return active.some((g: any) => g.enrollmentStatus === "FAOL") ? "FAOL" : "SINOV";
  }
  // Guruhi yo'q. Umuman bo'lmaganmi yoki chiqarilganmi — farqlaymiz.
  return (s.groups ?? []).length === 0 ? "YANGI" : "GURUHSIZ";
}

export default function StudentsPage() {
  const router = useRouter();
  // Ruxsat bo'yicha amallar. Ilgari tugmalar hammaga ko'rinardi va bosilganda
  // backend 403 qaytarardi — o'qituvchiga go'yo o'zgartira olganday tuyulardi.
  const { me } = useMe();
  const canCreate = hasPerm(me?.permissions, "students.create");
  const canUpdate = hasPerm(me?.permissions, "students.update");
  const canDelete = hasPerm(me?.permissions, "students.delete");
  const canSendSms = hasPerm(me?.permissions, "sms.send");
  // Qarz — moliyaviy ma'lumot. "To'lov qabul qilmaydi" deb belgilangan
  // o'qituvchida `payments.view` bo'lmaydi va u qarzni umuman ko'rmaydi
  // (server ham javobda balansni bermaydi).
  const canSeeMoney = hasPerm(me?.permissions, "payments.view");

  const [search,       setSearch]       = useState("");
  const [filterEnroll, setFilterEnroll] = useState("barchasi");
  const [filterGroup,  setFilterGroup]  = useState("barchasi");
  const [filterTeacher,setFilterTeacher]= useState("barchasi");
  const [filterDebt,   setFilterDebt]   = useState("barchasi");
  /** Qabul sanasi oralig'i — "shu davrda qo'shilganlar". */
  const [joinedFrom,   setJoinedFrom]   = useState("");
  const [joinedTo,     setJoinedTo]     = useState("");

  const [modalMode,    setModalMode]    = useState<"create" | "edit" | null>(null);
  const [modalInitial, setModalInitial] = useState<any>(null);
  const [showImport,   setShowImport]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [activating,   setActivating]   = useState<string | null>(null);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  // Qatordagi SMS tugmasi: shu o'quvchini tanlab, ommaviy paneldagi SMS
  // oynasini ochadi — yuborish mantiqi bitta joyda qoladi.
  const [smsOpen,      setSmsOpen]      = useState(false);
  /** Qo'shimcha filtrlar paneli (guruh, o'qituvchi, to'lov, sana) ochiqmi. */
  const [showFilters,  setShowFilters]  = useState(false);
  /** Tashqaridan ochiladigan ommaviy amal (jadvaldagi "+ Guruh" tugmasi). */
  const [bulkAction,   setBulkAction]   = useState<string | null>(null);
  /** "+ Guruh" orqali ochilganini eslab qolamiz (tanlovni tozalash uchun). */
  const singleAssign = useRef(false);
  const smsToOne = (id: string) => { setSelectedIds(new Set([id])); setSmsOpen(true); };

  // Filtrlar SERVERGA yuboriladi — javob 1000 ta bilan cheklangani uchun
  // brauzerda filtrlash katta markazda to'liq natija bermasdi.
  const { data: studentsRaw, isLoading } = useStudents({
    search,
    groupId:   filterGroup   !== "barchasi" ? filterGroup   : undefined,
    teacherId: filterTeacher !== "barchasi" ? filterTeacher : undefined,
    debt:      filterDebt    !== "barchasi" ? filterDebt    : undefined,
    enrollmentStatus: filterEnroll !== "barchasi" ? filterEnroll : undefined,
    joinedFrom: joinedFrom || undefined,
    joinedTo:   joinedTo   || undefined,
  });
  // HOLAT YORLIQLARIDAGI SANOQ uchun — xuddi shu filtrlar, faqat HOLATSIZ.
  // Yorliq bosilganda ro'yxat torayadi; sanoq ham shu ro'yxatdan olinsa,
  // qolgan yorliqlar 0 bo'lib qolardi. Holat tanlanmaganda kalit yuqoridagi
  // so'rov bilan bir xil — SWR bitta so'rov yuboradi.
  const { data: sanoqRaw, isLoading: sanoqLoading } = useStudents({
    search,
    groupId:   filterGroup   !== "barchasi" ? filterGroup   : undefined,
    teacherId: filterTeacher !== "barchasi" ? filterTeacher : undefined,
    debt:      filterDebt    !== "barchasi" ? filterDebt    : undefined,
    joinedFrom: joinedFrom || undefined,
    joinedTo:   joinedTo   || undefined,
  });
  const { data: groupsRaw }   = useGroups({ status: "ACTIVE,UPCOMING" });
  const { data: teachersRaw } = useTeachers();

  // `useMemo` shart: bu massivlar `useEffect`/`useMemo` bog'liqliklarida
  // ishlatiladi. Har renderda yangi `[]` yaratilsa, tanlovni tozalaydigan
  // effekt HAR renderda ishga tushib, cheksiz aylanishga olib kelardi.
  const students: any[] = useMemo(
    () => (Array.isArray(studentsRaw) ? studentsRaw : []), [studentsRaw]);
  const sanoq: any[] = useMemo(
    () => (Array.isArray(sanoqRaw) ? sanoqRaw : []), [sanoqRaw]);
  const groups: any[] = useMemo(
    () => (Array.isArray(groupsRaw) ? groupsRaw : []), [groupsRaw]);
  const teachers: any[] = useMemo(
    () => (Array.isArray(teachersRaw) ? teachersRaw : []), [teachersRaw]);

  const stats = useMemo(() => ({
    // "Jami" — ro'yxatdagi HAMMA o'quvchi (ketganlar ham). Ilgari faqat
    // guruhi borlar sanalar va yangi qo'shilganlar hisobga kirmasdi.
    jami:  sanoq.length,
    yangi: sanoq.filter(s => enrollOf(s) === "YANGI").length,
    // "Guruhsiz" KARTASI backenddagi "GURUHSIZ" filtri bilan BIR XIL
    // hisoblashi kerak: hozir hech qaysi guruhda faol/sinov emas (arxiv
    // bo'lmasa) — `enrollOf()`dagi tor "YANGI"/"GURUHSIZ" ajratimidan
    // MUSTAQIL. `enrollOf()` esa jadvaldagi HOLAT belgisi uchun
    // qoladi — u yerda "hech qachon guruhga tushmagan" va "guruhdan
    // chiqqan"ni alohida ko'rsatish foydali, faqat bu kartaning
    // yig'indisiga kirmasligi kerak emas edi.
    guruhsiz: sanoq.filter(s => !s.archivedAt && activeGroupsOf(s).length === 0).length,
    // FAOL / SINOV — server filtri bilan AYNAN bir xil qoida: shu holatdagi
    // KAMIDA BITTA a'zoligi bor o'quvchi (`groups: { some: … }`). Ilgari
    // `enrollOf()` (yagona "eng kuchli" holat) bilan sanalardi: bir guruhda
    // faol, ikkinchisida sinovdagi o'quvchi faqat "Faol"ga tushar, yorliqda
    // "Sinov 9" yozilib, bosilganda esa 10 ta qator chiqardi. Endi yorliqdagi
    // son bosilgandagi ro'yxat soniga teng (bunday o'quvchi ikkalasida sanaladi).
    sinov: sanoq.filter(s => (s.groups ?? []).some((g: { enrollmentStatus?: string }) => g.enrollmentStatus === "SINOV")).length,
    faol:  sanoq.filter(s => (s.groups ?? []).some((g: { enrollmentStatus?: string }) => g.enrollmentStatus === "FAOL")).length,
    ketgan: sanoq.filter(s => enrollOf(s) === "CHIQIB_KETGAN").length,
    qarz:  sanoq.filter(s => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0),
  }), [sanoq]);

  // BO'LIB KO'RSATISH. Ro'yxat ilgari to'liq chizilardi: 120 o'quvchi —
  // 6600px sahifa, katta markazda (1000 gacha) esa brauzer sezilarli
  // sekinlashardi. Endi avval SAHIFA_OLCHAMI ta qator, qolgani tugma bilan.
  // Filtr o'zgarsa hisob boshidan boshlanadi — `imzo` shuni kuzatadi
  // (effektda `setState` chaqirmaslik uchun holat imzo bilan birga saqlanadi).
  const imzo = [search, filterEnroll, filterGroup, filterTeacher, filterDebt, joinedFrom, joinedTo].join("|");
  const [korsatish, setKorsatish] = useState({ imzo, soni: SAHIFA_OLCHAMI });
  const limit = korsatish.imzo === imzo ? korsatish.soni : SAHIFA_OLCHAMI;
  const korinadigan = useMemo(() => students.slice(0, limit), [students, limit]);

  // Tanlov EKRANDAGI ro'yxatdan hosil qilinadi, `selectedIds` dan emas.
  // Shu sabab filtr o'zgarib, ba'zi o'quvchilar ko'rinmay qolsa, ommaviy
  // amal ularga TEGMAYDI — foydalanuvchi ko'rmayotgan qatorga hech qachon
  // ta'sir qilinmaydi. (Effekt bilan sinxronlash o'rniga — shunchaki
  // hisoblab olamiz.)
  const selected = useMemo(
    () => korinadigan.filter(s => selectedIds.has(s.id)).map(s => ({ id: s.id, name: s.name })),
    [korinadigan, selectedIds],
  );
  // "Hammasini tanlash" — faqat CHIZILGAN qatorlar: foydalanuvchi ko'rmayotgan
  // (hali ochilmagan) o'quvchiga ommaviy amal tegmasligi kerak.
  const allSelected = korinadigan.length > 0 && korinadigan.every(s => selectedIds.has(s.id));

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(korinadigan.map(s => s.id)));
  }
  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreate() { setModalInitial(null); setModalMode("create"); }
  function openEdit(s: any) { setModalInitial(s); setModalMode("edit"); }

  /** Sinovdagi BARCHA a'zoliklarni faollashtiradi (bir nechta guruh bo'lishi mumkin). */
  async function activate(student: any) {
    const trials = activeGroupsOf(student).filter((g: any) => g.enrollmentStatus === "SINOV");
    if (trials.length === 0) return;
    setActivating(student.id);
    try {
      for (const sg of trials) {
        await fetch(`/api/student-groups/${sg.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollmentStatus: "FAOL" }),
        });
      }
      revalidate();
    } finally { setActivating(null); }
  }

  /** Ekrandagi (filtrlangan) ro'yxatni CSV qilib beradi. */
  function exportCsv() {
    const rows = students.map(s => {
      const gs = activeGroupsOf(s);
      return [
        s.name,
        exportPhone(s.phone),
        exportPhone(s.parentPhone),
        s.parentName ?? "",
        s.school ?? "",
        s.gender === "MALE" ? "Erkak" : s.gender === "FEMALE" ? "Ayol" : "",
        gs.map((g: any) => g.group?.name).filter(Boolean).join(" | "),
        gs.map((g: any) => g.group?.teacher?.user?.name).filter(Boolean).join(" | "),
        ENROLL_CFG[enrollOf(s)]?.label ?? "",
        // Qarz ustuni faqat moliya huquqi bo'lganda — aks holda javobda
        // balans yo'q va eksportda chalg'ituvchi "0" chiqardi.
        ...(canSeeMoney ? [Math.round(s.balance ?? 0)] : []),
        formatUzDate(s.joinedAt ?? s.createdAt),
      ];
    });
    downloadFile(
      `oquvchilar-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        ["Ism", "Telefon", "Ota-ona telefoni", "Ota-ona ismi", "Maktab", "Jinsi",
         "Guruh", "O'qituvchi", "Holat",
         ...(canSeeMoney ? ["Balans"] : []), "Qo'shilgan"],
        rows,
      ),
    );
  }

  /**
   * Bitta o'quvchini guruhga biriktirish.
   *
   * Alohida oyna yozmaymiz — mavjud ommaviy "Guruhga qo'shish" oynasi
   * ishlatiladi: u sinovga qo'shish, filial doirasi va xatolarni allaqachon
   * to'g'ri hal qiladi. Shu o'quvchini tanlab, o'sha oynani ochamiz.
   */
  function assignToGroup(id: string) {
    singleAssign.current = true;
    setSelectedIds(new Set([id]));
    setBulkAction("add-to-group");
  }

  /**
   * Oyna yopilganda tanlovni ham tozalaymiz — aks holda bitta qatordan
   * biriktirgandan keyin ekranda "1 ta tanlandi" paneli osilib qolardi.
   */
  function handleBulkActionChange(a: string | null) {
    setBulkAction(a);
    if (a === null && singleAssign.current) {
      singleAssign.current = false;
      setSelectedIds(new Set());
    }
  }

  const filtersOn =
    filterEnroll !== "barchasi" || filterGroup !== "barchasi" ||
    filterTeacher !== "barchasi" || filterDebt !== "barchasi" || !!search ||
    !!joinedFrom || !!joinedTo;

  /** Panel ichidagi (yashirin turadigan) filtrlardan nechtasi yoqilgan. */
  const qoshimchaFiltr =
    (filterGroup !== "barchasi" ? 1 : 0) + (filterTeacher !== "barchasi" ? 1 : 0) +
    (filterDebt !== "barchasi" ? 1 : 0) + (joinedFrom || joinedTo ? 1 : 0);

  function clearFilters() {
    setSearch(""); setFilterEnroll("barchasi"); setFilterGroup("barchasi");
    setFilterTeacher("barchasi"); setFilterDebt("barchasi");
    setJoinedFrom(""); setJoinedTo("");
  }

  return (
    <div>
      <TopHeader
        title="O'quvchilar"
        subtitle={isLoading ? "Yuklanmoqda..." : filtersOn
          ? `${students.length} ta o'quvchi (filtr bo'yicha)`
          : `Jami ${students.length} ta o'quvchi`}
        action={canCreate ? { label: "Yangi o'quvchi", onClick: openCreate } : undefined}
      />

      <StudentFormModal
        open={modalMode !== null}
        mode={modalMode ?? "create"}
        initial={modalInitial}
        onClose={() => setModalMode(null)}
        onSaved={revalidate}
      />

      <StudentDeleteModal
        student={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDone={revalidate}
      />

      <StudentImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onDone={revalidate}
        groups={groups}
      />

      {/* Tanlov faol bo'lganda suzuvchi panel oxirgi qatorni yopmasligi uchun
          pastdan joy ajratamiz. */}
      <div className={cn("p-5 space-y-5", selected.length > 0 && "pb-28 lg:pb-24")}>
        {/* HOLAT YORLIQLARI — sanoq va filtr BIR JOYDA.
            Ilgari tepada 7 ta katta kartochka (Jami, Yangi, Faol, …) va
            pastda xuddi shu nomli filtr tugmalari alohida turardi: bir xil
            ma'lumot ikki marta, birinchi ekranning uchdan biri. Endi har bir
            yorliq sonni ko'rsatadi VA bosilganda ro'yxatni shu holatga
            toraytiradi. */}
        <div className="flex flex-wrap items-center gap-2"
          title={qoshimchaFiltr > 0 || search ? "Sonlar tanlangan filtr bo'yicha hisoblangan" : undefined}>
          <TabGlide variant="segment" watch={filterEnroll} className="flex min-w-0 max-w-full gap-0.5 overflow-x-auto no-scrollbar glass-soft p-1 rounded-xl">
            {[
              // "Jami" ro'yxatdagi qatorlardan sanaladi, ro'yxat esa serverda
              // 1000 ta bilan cheklangan — chegaraga yetilsa raqam yolg'on
              // bo'lib qolmasligi uchun "1000+" deb yoziladi.
              { v: "barchasi", l: "Barchasi", n: stats.jami >= 1000 ? "1000+" : stats.jami },
              { v: "YANGI",    l: "Yangi",    n: stats.yangi },
              { v: "FAOL",     l: "Faol",     n: stats.faol },
              { v: "SINOV",    l: "Sinov",    n: stats.sinov },
              { v: "GURUHSIZ", l: "Guruhsiz", n: stats.guruhsiz },
              { v: "KETGAN",   l: "Ketgan",   n: stats.ketgan },
            ].map(f => {
              const faol = filterEnroll === f.v;
              return (
                <button key={f.v} onClick={() => setFilterEnroll(f.v)} aria-pressed={faol} data-tab-active={faol}
                  className={segCls(faol, "flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-semibold")}>
                  {f.l}
                  <span className={cn("tabular-nums text-[11.5px] font-bold",
                    faol ? "text-indigo-600 dark:text-indigo-300" : "text-neutral-400 dark:text-neutral-500")}>
                    {sanoqLoading ? "·" : f.n}
                  </span>
                </button>
              );
            })}
          </TabGlide>

          {/* JAMI QARZ — bosilsa faqat qarzdorlar qoladi (yana bosilsa qaytadi). */}
          {canSeeMoney && (stats.qarz > 0 || filterDebt === "qarzdor") && (
            <button onClick={() => setFilterDebt(filterDebt === "qarzdor" ? "barchasi" : "qarzdor")}
              aria-pressed={filterDebt === "qarzdor"}
              title={filterDebt === "qarzdor" ? "Hammasini ko'rsatish" : "Faqat qarzdorlarni ko'rsatish"}
              className={cn("ml-auto shrink-0 flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-[12.5px] font-semibold whitespace-nowrap border transition-colors",
                filterDebt === "qarzdor"
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-red-200/80 dark:border-red-400/20 bg-red-50/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/30")}>
              Jami qarz
              <span className="tabular-nums font-bold">{sanoqLoading ? "·" : fmtSum(stats.qarz)}</span>
              so&apos;m
            </button>
          )}
        </div>

        {/* QIDIRUV + FILTRLAR. Bir qator: qidiruv doim ko'rinadi, qolgan
            filtrlar (filial, guruh, o'qituvchi, to'lov, qabul sanasi) "Filtrlar"
            tugmasi ortida — kamdan-kam ishlatiladi, lekin ilgari har doim
            ikkinchi qatorni to'liq egallardi. Nechtasi yoqilgani tugmada
            ko'rinadi, ya'ni panel yopiq bo'lsa ham filtr "yashirinib" qolmaydi. */}
        <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input placeholder="Ism, telefon..." className="pl-9 h-9 text-sm w-full"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <button onClick={() => setShowFilters(v => !v)} aria-expanded={showFilters}
            className={cn("shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border transition-colors",
              showFilters || qoshimchaFiltr > 0
                ? "border-indigo-300 dark:border-indigo-400/40 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                : "glass-soft border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300")}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtrlar
            {qoshimchaFiltr > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {qoshimchaFiltr}
              </span>
            )}
          </button>

          {filtersOn && (
            <button onClick={clearFilters}
              className="shrink-0 flex items-center gap-1 h-9 px-2.5 rounded-lg text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
              <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tozalash</span>
            </button>
          )}

          {/* Eksport / Import — kunda bir ishlatiladigan amallar, menyuda. */}
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Eksport va import" title="Eksport va import"
              className="ml-auto shrink-0 w-9 h-9 flex items-center justify-center rounded-lg glass-soft border border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 transition-colors outline-none">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[210px]">
              <DropdownMenuItem onClick={exportCsv} disabled={students.length === 0}>
                <Download className="w-3.5 h-3.5" /> Eksport (CSV) — {students.length} ta
              </DropdownMenuItem>
              {canCreate && (
                <DropdownMenuItem onClick={() => setShowImport(true)}>
                  <Upload className="w-3.5 h-3.5" />{" "}Excel&apos;dan import
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showFilters && (
        <div className="flex items-center gap-2.5 flex-wrap glass-soft border border-white/60 dark:border-white/10 rounded-2xl p-3">
          <BranchFilter />

          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className={selectCls}>
            <option value="barchasi">Barcha guruhlar</option>
            {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className={selectCls}>
            <option value="barchasi">Barcha o&apos;qituvchilar</option>
            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
          </select>

          {canSeeMoney && (
            <select value={filterDebt} onChange={e => setFilterDebt(e.target.value)} className={selectCls}>
              <option value="barchasi">To&apos;lov: barchasi</option>
              <option value="qarzdor">Faqat qarzdorlar</option>
              <option value="tolangan">Qarzi yo&apos;qlar</option>
            </select>
          )}

          {/* Qabul sanasi oralig'i — "shu davrda qo'shilganlar". */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 shrink-0">Qabul sanasi:</span>
            <DatePicker value={joinedFrom} max={joinedTo || undefined} clearable
              placeholder="Dan" className="h-9 w-32 text-xs"
              onChange={setJoinedFrom} />
            <span className="text-neutral-300 dark:text-neutral-600">—</span>
            <DatePicker value={joinedTo} min={joinedFrom || undefined} clearable
              placeholder="Gacha" className="h-9 w-32 text-xs"
              onChange={setJoinedTo} />
          </div>
        </div>
        )}
        </div>

        {/* Jadval */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                {canUpdate && (
                  <TableHead className="w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      disabled={students.length === 0}
                      aria-label="Hammasini tanlash"
                      className="accent-indigo-600 w-3.5 h-3.5 align-middle cursor-pointer disabled:opacity-40" />
                  </TableHead>
                )}
                {/* "O'qituvchi" ustuni yo'q: u guruhdan kelib chiqadi — guruh
                    yorlig'i ustiga borilganda va o'quvchi profilida ko'rinadi. */}
                {["O'quvchi", "Telefon", "Guruhlar", "Holat",
                  ...(canSeeMoney ? ["To'lov"] : []), ""].map(h => (
                  <TableHead key={h} className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({length: 5 + (canSeeMoney ? 1 : 0) + (canUpdate ? 1 : 0)}).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : korinadigan.map((s: any, sIdx: number) => {
                    const gs      = activeGroupsOf(s);
                    const enrollK = enrollOf(s);
                    const enroll  = ENROLL_CFG[enrollK];
                    const payKey  = payStatusFromBalance(s.balance, enrollK);
                    const pay     = PAY_STATUS_CFG[payKey];
                    const isSel = selectedIds.has(s.id);
                    const hasTrial = gs.some((g: any) => g.enrollmentStatus === "SINOV");
                    return (
                      <TableRow key={s.id}
                        // Yo'l ko'rsatuvchi "o'quvchini guruhga biriktiring"
                        // qadamida birinchi qatorni ko'rsatadi.
                        data-tour={sIdx === 0 ? TOUR_TARGETS.studentRowFirst : undefined}
                        onClick={() => router.push(`/students/${s.id}`)}
                        className={cn("cursor-pointer transition-colors",
                          isSel ? "bg-indigo-50/70 dark:bg-indigo-900/20" : "hover:bg-white/60 dark:hover:bg-white/10")}>
                        {canUpdate && (
                          <TableCell onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isSel} onChange={() => toggleOne(s.id)}
                              aria-label={`${s.name} ni tanlash`}
                              className="accent-indigo-600 w-3.5 h-3.5 align-middle cursor-pointer" />
                          </TableCell>
                        )}
                        <TableCell>
                          {/* Ism — Link: qator bosilishi bilan bir xil manzil, lekin
                              klaviatura bilan ham yuriladi va hoverda URL ko'rinadi */}
                          <Link href={`/students/${s.id}`} onClick={e => e.stopPropagation()}
                            className="flex items-center gap-3 group/name">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shrink-0",
                              // Rang HOLAT bilan bir xil bo'lsin: ilgari
                              // `isActive` ga qarardi va "Yangi" o'quvchi
                              // nishoni ko'k, avatari sariq bo'lib chiqardi.
                              enrollK !== "CHIQIB_KETGAN"
                                ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                                : "bg-gradient-to-br from-amber-400 to-orange-400"
                            )}>
                              {s.name[0]}
                            </div>
                            {/* BIR QATOR. Qabul sanasi (tahrirlanadigan biznes sanasi;
                                eski yozuvda bo'sh bo'lsa — yaratilgan sana) ism
                                ustiga borilganda va profilda ko'rinadi. */}
                            <p title={`Qabul sanasi: ${formatUzDate(s.joinedAt ?? s.createdAt)}`}
                              className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 group-hover/name:text-indigo-600 dark:group-hover/name:text-indigo-400 transition-colors whitespace-nowrap">
                              {s.name}
                            </p>
                          </Link>
                        </TableCell>
                        <TableCell>
                          {/* Ota-ona raqami — raqam ustiga borilganda va profilda. */}
                          <p title={s.parentPhone ? `Ota-ona: ${s.parentPhone}` : undefined}
                            className="text-[13px] text-neutral-700 dark:text-neutral-300 whitespace-nowrap tabular-nums">{s.phone}</p>
                        </TableCell>
                        <TableCell>
                          {/* BARCHA guruhlar. Bitta o'quvchi bir nechta fanga
                              qatnashishi mumkin — ilgari faqat bittasi ko'rinardi. */}
                          {gs.length === 0
                            ? (canUpdate ? (
                                // Bo'sh yacheykada o'lik chiziq turardi va
                                // biriktirish uchun o'quvchini ochish kerak
                                // edi. Endi shu yerdan bir bosishda.
                                <button
                                  onClick={e => { e.stopPropagation(); assignToGroup(s.id); }}
                                  title="Guruhga biriktirish"
                                  className="inline-flex items-center gap-1 h-6 px-2 rounded-lg text-[12px] font-semibold
                                    text-indigo-600 dark:text-indigo-400 border border-dashed
                                    border-indigo-300/70 dark:border-indigo-400/30
                                    hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                  <Plus className="w-3 h-3" />
                                  Guruh
                                </button>
                              ) : <span className="text-[13px] text-neutral-400">—</span>)
                            : (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {gs.map((g: any) => (
                                  <span key={g.id}
                                    title={[g.group?.teacher?.user?.name && `O'qituvchi: ${g.group.teacher.user.name}`,
                                      g.enrollmentStatus === "SINOV" && "Sinov darsida"].filter(Boolean).join(" · ") || undefined}
                                    className={cn("text-[11px] px-2 py-0.5 rounded-lg font-medium whitespace-nowrap",
                                      g.enrollmentStatus === "SINOV"
                                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                        : "glass-soft text-neutral-600 dark:text-neutral-300")}>
                                    {g.group?.name ?? "—"}
                                  </span>
                                ))}
                              </div>
                            )}
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", enroll?.cls)}>
                            {enroll?.label ?? "—"}
                          </span>
                        </TableCell>
                        {canSeeMoney && (
                          <TableCell>
                            <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-semibold", pay?.cls)}>
                              {pay?.label}
                            </span>
                          </TableCell>
                        )}
                        <TableCell>
                          {/* Amal tugmalari qator bosilishini ishga tushirmasligi kerak */}
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {canUpdate && hasTrial && (
                              <button
                                onClick={() => activate(s)}
                                disabled={activating === s.id}
                                title="Sinovdagi a'zoliklarni faollashtirish"
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50">
                                <UserCheck className="w-3 h-3" />
                                {activating === s.id ? "..." : "Faollashtirish"}
                              </button>
                            )}
                            {/* AMALLAR — bitta menyuda. Ilgari har qatorda 4 ta ikonka
                                (120 qator × 4) turardi va "O'chirish" tahrirlash bilan
                                yonma-yon edi. Endi o'chirish ajratilgan va qizil. */}
                            <DropdownMenu>
                              <DropdownMenuTrigger aria-label={`${s.name} — amallar`} title="Amallar"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/70 dark:hover:bg-white/10 data-popup-open:bg-white/70 dark:data-popup-open:bg-white/10 transition-colors outline-none">
                                <MoreHorizontal className="w-4 h-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[180px]">
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => openEdit(s)}>
                                    <Edit className="w-3.5 h-3.5" /> Tahrirlash
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => { window.location.href = `tel:${s.phone}`; }}>
                                  <Phone className="w-3.5 h-3.5" />{" "}Qo&apos;ng&apos;iroq qilish
                                </DropdownMenuItem>
                                {canSendSms && (
                                  <DropdownMenuItem onClick={() => smsToOne(s.id)}>
                                    <MessageSquare className="w-3.5 h-3.5" /> SMS yuborish
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(s)}>
                                      <Trash2 className="w-3.5 h-3.5" />{" "}O&apos;chirish
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
              }
            </TableBody>
          </Table>
          </div>
          {!isLoading && students.length > korinadigan.length && (
            <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 border-t border-white/50 dark:border-white/10">
              <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                {korinadigan.length}{" "}/ {students.length}{" "}ta ko&apos;rsatilmoqda
              </span>
              <button onClick={() => setKorsatish({ imzo, soni: limit + SAHIFA_OLCHAMI })}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                Yana {Math.min(SAHIFA_OLCHAMI, students.length - korinadigan.length)}{" "}ta
              </button>
              <button onClick={() => setKorsatish({ imzo, soni: students.length })}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold glass-soft text-neutral-600 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-white/10 transition-colors">
                Hammasini ko&apos;rsatish
              </button>
            </div>
          )}
          {!isLoading && students.length === 0 && (
            <div className="flex flex-col items-center py-16 text-neutral-400">
              <GraduationCap className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Hech narsa topilmadi</p>
              {filtersOn && (
                <button onClick={clearFilters} className="mt-2 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Filtrlarni tozalash
                </button>
              )}
            </div>
          )}
        </div>

        <StudentBulkBar
          selected={selected}
          groups={groups}
          onClear={() => setSelectedIds(new Set())}
          onDone={revalidate}
          canUpdate={canUpdate}
          canSendSms={canSendSms}
          smsOpen={smsOpen}
          onSmsOpenChange={setSmsOpen}
          actionOpen={bulkAction}
          onActionOpenChange={handleBulkActionChange}
        />
      </div>
    </div>
  );
}
