"use client";

/**
 * O'QUVCHI PROFILI — "UMUMIY" KO'RINISH qismlari.
 *
 * Ilgari sahifa ochilishi bilan chapda uchta karta, o'ngda esa tanlangan
 * tabning to'liq tafsiloti chiqardi — "bu o'quvchi qarzdormi, darsga
 * kelyaptimi, qaysi guruhda" degan uchta oddiy savolga javob topish uchun
 * mayda yozuvlar orasidan qidirish kerak edi (egasi, 2026-10-05).
 *
 * Endi shu savollarga BIRINCHI EKRAN javob beradi:
 *   · `StudentHero`     — kim (ism, holat, telefonlar);
 *   · `StudentOverview` — hisob holati, davomat, guruhlar, so'nggi to'lovlar,
 *                         izohlar.
 * Tafsilot (balans tarkibi, chegirmalar, to'liq davomat, tarix, …) O'CHMAGAN —
 * o'z tablarida turibdi, bu yerdan bir bosishda ochiladi.
 */

import Link from "next/link";
import {
  ArrowRight, CalendarCheck2, Clock, Phone, Plus, Receipt, Snowflake, Users, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";
import { formatUzDate } from "@/lib/date-uz";
import { WEEKDAY_SHORT } from "@/lib/form-constants";
import { activeFreeze, type FreezeLike } from "@/lib/freeze";
import { methodShort } from "@/lib/payment-methods";

/* ── tiplar (sahifadagi `student` obyektidan kerakli maydonlar) ─────────── */
type Sg = {
  id: string; groupId: string; enrollmentStatus: string;
  freezes?: FreezeLike[];
  schedule?: { nextDue?: string | null; rule?: string } | null;
  group?: {
    id: string; name: string; scheduleDays?: string[]; startTime?: string; endTime?: string;
    teacher?: { user?: { name?: string } } | null;
    course?: { name?: string } | null;
  } | null;
};
type Att = { id?: string; date: string; status: string };
type Pay = { id: string; amount: number; date: string; method?: string | null; groupId?: string | null; ledgerGroupName?: string | null };

const CARD = "glass-panel border border-white/60 dark:border-white/10 rounded-2xl";

/* ── HERO ───────────────────────────────────────────────────────────────── */
export function StudentHero({
  name, avatar, statusLabel, statusCls, phone, parentPhone, parentName, joined, onPay,
}: {
  name: string; avatar?: string | null; statusLabel?: string; statusCls?: string;
  phone?: string | null; parentPhone?: string | null; parentName?: string | null;
  joined?: string | null; onPay?: () => void;
}) {
  return (
    <div className={cn(CARD, "flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4")}>
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 text-[18px] font-black text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" /> : name[0]}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[17px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{name}</h2>
            {statusLabel && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusCls)}>{statusLabel}</span>}
          </div>
          {joined && <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">{joined} dan beri o&apos;qiydi</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        {phone && (
          <a href={`tel:${phone}`} title="O'quvchiga qo'ng'iroq"
            className="flex h-9 items-center gap-2 rounded-xl glass-soft px-3 text-[13px] font-medium tabular-nums text-neutral-700 transition-colors hover:text-indigo-600 dark:text-neutral-200 dark:hover:text-indigo-300">
            <Phone className="h-3.5 w-3.5 text-neutral-400" />{phone}
          </a>
        )}
        {parentPhone && (
          <a href={`tel:${parentPhone}`} title={parentName ? `Ota-ona: ${parentName}` : "Ota-onaga qo'ng'iroq"}
            className="flex h-9 items-center gap-2 rounded-xl glass-soft px-3 text-[13px] font-medium tabular-nums text-neutral-700 transition-colors hover:text-indigo-600 dark:text-neutral-200 dark:hover:text-indigo-300">
            <Phone className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-[11px] font-semibold text-neutral-400">Ota-ona</span>{parentPhone}
          </a>
        )}
        {onPay && (
          <button type="button" onClick={onPay}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700">
            <Plus className="h-3.5 w-3.5" />To&apos;lov
          </button>
        )}
      </div>
    </div>
  );
}

/* ── UMUMIY ─────────────────────────────────────────────────────────────── */
const ATT: Record<string, { label: string; dot: string }> = {
  KELDI:       { label: "Keldi",       dot: "bg-emerald-500" },
  KECH_KELDI:  { label: "Kech keldi",  dot: "bg-amber-400" },
  SABABLI:     { label: "Sababli",     dot: "bg-sky-400" },
  KELMADI:     { label: "Kelmadi",     dot: "bg-red-500" },
  SINOV_DARSI: { label: "Sinov darsi", dot: "bg-violet-400" },
};

function Sarlavha({ icon: Icon, children, onMore, more }: {
  icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; onMore?: () => void; more?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        <Icon className="h-3.5 w-3.5" />{children}
      </p>
      {onMore && (
        <button type="button" onClick={onMore}
          className="flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          {more ?? "Batafsil"}<ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function StudentOverview({
  balance, canSeeMoney, canSeeAttendance, groups, attendance, attended, total, rate, payments, notes,
  paymentGroup, onPay, onTab,
}: {
  balance: number; canSeeMoney: boolean; canSeeAttendance: boolean;
  groups: Sg[]; attendance: Att[]; attended: number; total: number; rate: number;
  payments: Pay[];
  /** Izohlar bloki (`StudentNotes`, ixcham) — sahifa tayyorlab beradi. */
  notes?: React.ReactNode;
  paymentGroup: (p: Pay) => string | null;
  onPay: () => void; onTab: (id: string) => void;
}) {
  // Eng yaqin to'lov sanasi — guruhlar orasidan.
  const keyingi = groups
    .map((g) => g.schedule?.nextDue)
    .filter((d): d is string => !!d)
    .sort()[0];

  const oxirgi = [...attendance]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 12)
    .reverse();

  const kech = attendance.filter((a) => a.status === "KECH_KELDI").length;
  const kelmadi = attendance.filter((a) => a.status === "KELMADI").length;

  const qarz = balance < 0;
  const ortiqcha = balance > 0;

  return (
    // IKKI USTUN: chapda holat (hisob, davomat, guruh, to'lovlar), o'ngda
    // izohlar — sahifa ochilishi bilan ko'rinadi, pastga tushish shart emas.
    // Tor ekranda izohlar pastga o'tadi.
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
    <div className="min-w-0 space-y-4">
      <div className={cn("grid gap-4", canSeeMoney && canSeeAttendance ? "lg:grid-cols-2" : "grid-cols-1")}>
        {/* HISOB HOLATI — bitta aniq gap va bitta raqam. Tarkibi (guruhlar
            bo'yicha, chegirmalar, dinamika) "Moliya" tabida. */}
        {canSeeMoney && (
          <div className={cn(CARD, "p-5", qarz && "border-red-200 dark:border-red-400/25 bg-red-50/60! dark:bg-red-950/25!")}>
            <Sarlavha icon={Wallet} onMore={() => onTab("moliya")}>Hisob holati</Sarlavha>
            <p className={cn("text-[13px] font-semibold",
              qarz ? "text-red-600 dark:text-red-400" : ortiqcha ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500 dark:text-neutral-400")}>
              {qarz ? "Qarzdor" : ortiqcha ? "Oldindan to'langan" : "Qarzi yo'q"}
            </p>
            <p className={cn("mt-0.5 text-[30px] font-black leading-tight tracking-tight tabular-nums",
              qarz ? "text-red-600 dark:text-red-400" : "text-neutral-900 dark:text-neutral-100")}>
              {formatCurrency(Math.abs(balance))}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400">
                {keyingi
                  ? <>Keyingi hisob: <b className="font-semibold text-neutral-800 dark:text-neutral-200">{formatUzDate(keyingi)}</b></>
                  : "Rejalashtirilgan hisob yo'q"}
              </p>
              <button type="button" onClick={onPay}
                className={cn("flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold text-white transition-colors",
                  qarz ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700")}>
                <Plus className="h-3.5 w-3.5" />To&apos;lov qabul qilish
              </button>
            </div>
          </div>
        )}

        {/* DAVOMAT — foiz va oxirgi darslar nuqtalar bilan. */}
        {canSeeAttendance && (
          <div className={cn(CARD, "p-5")}>
            <Sarlavha icon={CalendarCheck2} onMore={() => onTab("davomat")}>Davomat</Sarlavha>
            {total === 0 ? (
              <p className="py-4 text-[13px] text-neutral-400">Hali davomat belgilanmagan</p>
            ) : (
              <>
                <div className="flex items-end gap-3">
                  <p className={cn("text-[30px] font-black leading-none tracking-tight tabular-nums",
                    rate >= 80 ? "text-emerald-600 dark:text-emerald-400" : rate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                    {rate}%
                  </p>
                  <p className="pb-1 text-[12.5px] text-neutral-500 dark:text-neutral-400">
                    {total}{" "}darsdan{" "}<b className="font-semibold text-neutral-800 dark:text-neutral-200">{attended}</b>{" "}tasiga o&apos;z vaqtida kelgan
                    {/* Foiz faqat O'Z VAQTIDA kelganlarni sanaydi (sahifadagi qoida).
                        Kechikish va sababli qoldirish alohida aytiladi — aks holda
                        past foiz "kelmayapti" deb o'qilardi. */}
                    {kech > 0 && <>,{" "}<b className="font-semibold text-neutral-800 dark:text-neutral-200">{kech}</b>{" "}tasiga kechikkan</>}
                    {kelmadi > 0 && <>,{" "}<b className="font-semibold text-red-600 dark:text-red-400">{kelmadi}</b>{" "}tasiga kelmagan</>}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="mb-1.5 text-[11px] text-neutral-400">Oxirgi {oxirgi.length} dars</p>
                  <div className="flex flex-wrap gap-1.5">
                    {oxirgi.map((a, i) => {
                      const c = ATT[a.status] ?? { label: a.status, dot: "bg-neutral-300" };
                      return <span key={a.id ?? i} title={`${formatUzDate(a.date)} — ${c.label}`} className={cn("h-3.5 w-3.5 rounded-full", c.dot)} />;
                    })}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    {Object.entries(ATT).filter(([k]) => oxirgi.some((a) => a.status === k)).map(([k, c]) => (
                      <span key={k} className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", c.dot)} />{c.label}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* GURUHLAR — har biri bitta qator. Almashtirish, muzlatish, to'lov
          jadvali va narx "Guruhlar" tabida. */}
      <div className={cn(CARD, "p-5")}>
        <Sarlavha icon={Users} onMore={() => onTab("guruhlar")} more={groups.length ? "Boshqarish" : "Guruhga qo'shish"}>
          {groups.length > 1 ? `Guruhlar · ${groups.length}` : "Guruh"}
        </Sarlavha>
        {groups.length === 0 ? (
          <p className="py-2 text-[13px] text-neutral-400">Hech qaysi guruhga biriktirilmagan</p>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-white/10">
            {groups.map((sg) => {
              const g = sg.group;
              const muz = activeFreeze(sg.freezes);
              const kunlar = (g?.scheduleDays ?? []).map((d) => WEEKDAY_SHORT[d] ?? d).join(", ");
              return (
                <div key={sg.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="flex flex-wrap items-center gap-2">
                      {g ? (
                        <Link href={`/groups/${g.id}`} className="truncate text-[14px] font-semibold text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400">
                          {g.name}
                        </Link>
                      ) : <span className="text-[14px] font-semibold text-neutral-500">Guruh o&apos;chirilgan</span>}
                      {sg.enrollmentStatus === "SINOV" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Sinov darsida</span>
                      )}
                      {muz && (
                        <span className="flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10.5px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                          <Snowflake className="h-3 w-3" />Muzlatilgan
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                      {[g?.course?.name, g?.teacher?.user?.name].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <p className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-neutral-600 dark:text-neutral-300">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    {kunlar || "—"}{g?.startTime ? ` · ${g.startTime}–${g.endTime}` : ""}
                  </p>
                  {canSeeMoney && sg.schedule?.nextDue && (
                    <p className="whitespace-nowrap text-[12px] text-neutral-500 dark:text-neutral-400" title={sg.schedule.rule}>
                      keyingi hisob <b className="font-semibold text-neutral-800 dark:text-neutral-200">{formatUzDate(sg.schedule.nextDue)}</b>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SO'NGGI TO'LOVLAR — uchtasi. To'liq ro'yxat, tahrirlash va chek "Moliya"da. */}
      {canSeeMoney && (
        <div className={cn(CARD, "p-5")}>
          <Sarlavha icon={Receipt} onMore={() => onTab("moliya")} more="Hammasi">So&apos;nggi to&apos;lovlar</Sarlavha>
          {payments.length === 0 ? (
            <p className="py-2 text-[13px] text-neutral-400">Hali to&apos;lov qilinmagan</p>
          ) : (
            <div className="divide-y divide-neutral-200/60 dark:divide-white/10">
              {payments.slice(0, 3).map((p) => {
                const guruh = paymentGroup(p);
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <p className="min-w-0 truncate text-[12.5px] text-neutral-500 dark:text-neutral-400">
                      <span className="font-medium tabular-nums text-neutral-700 dark:text-neutral-200">{formatUzDate(p.date)}</span>
                      {" · "}{methodShort(p.method)}{guruh ? ` · ${guruh}` : ""}
                    </p>
                    <p className={cn("shrink-0 text-[14px] font-bold tabular-nums",
                      p.amount < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                      {p.amount < 0 ? "−" : "+"}{formatCurrency(Math.abs(p.amount))}
                      {p.amount < 0 && <span className="ml-1.5 text-[11px] font-semibold">qaytarildi</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>

      {/* IZOHLAR — so'nggi uchtasi; shu yerning o'zidan yangi izoh qo'shiladi.
          To'liq ro'yxat "Ma'lumot" bo'limida. */}
      {notes && <div className="min-w-0">{notes}</div>}
    </div>
  );
}
