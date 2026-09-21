"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Check, Loader2, User, MessageSquare, ShieldCheck, BookOpen, School, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mavzuOl, type TargetTheme } from "@/lib/target-theme";

/**
 * ARIZA SAHIFASINING KO'RINISHI — bitta komponent, IKKI JOYDA.
 *
 *   `/target`                 — haqiqiy, ochiq sahifa
 *   Sozlamalardagi namuna     — markaz nimani ko'rishini oldindan ko'rsatadi
 *
 * NEGA BITTA: namuna alohida yozilsa, u sahifadan asta-sekin ajralib
 * ketardi — markaz bir narsani ko'rib sozlar, mijoz boshqasini ko'rardi.
 * Bunday farqni hech kim payqamaydi, chunki ikkovini yonma-yon
 * ko'rib bo'lmaydi.
 *
 * `onSubmit` BERILMASA — namuna rejimi: forma yuborilmaydi.
 */

export interface TargetConfig {
  logoUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  buttonText?: string | null;
  successText?: string | null;
  theme?: TargetTheme | null;
  showNote?: boolean;
  showCourse?: boolean;
  showSchool?: boolean;
  showGrade?: boolean;
}

export interface TargetQiymat {
  name: string;
  tel: string;          // faqat 9 raqam
  note: string;
  courseId: string;
  school: string;
  grade: string;
}

export const BOSH_QIYMAT: TargetQiymat = {
  name: "", tel: "", note: "", courseId: "", school: "", grade: "",
};

/** Faqat raqam, aynan 9 ta. */
export const faqatRaqam = (v: string) => v.replace(/\D/g, "").slice(0, 9);
/** `901234567` → `90 123 45 67`. */
const chiroyli = (d: string) =>
  [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");

export function TargetPageView({
  markaz, config, courses = [], onSubmit, namuna = false,
}: {
  markaz: string | null;
  config: TargetConfig | null;
  courses?: { id: string; name: string }[];
  onSubmit?: (v: TargetQiymat) => Promise<string | null>;
  /** Sozlamadagi namuna — forma yuborilmaydi, o'lchamlar kichikroq. */
  namuna?: boolean;
}) {
  const m = mavzuOl(config?.theme);
  const [v, setV] = useState<TargetQiymat>(BOSH_QIYMAT);
  const [yuborilyapti, setYuborilyapti] = useState(false);
  const [yuborildi, setYuborildi] = useState(false);
  const [xato, setXato] = useState("");

  const toliq = useMemo(
    () => v.name.trim().length >= 2 && v.tel.length === 9, [v]);

  async function yubor(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit || yuborilyapti) return;
    /* Brauzerda ham tekshiramiz — server baribir tekshiradi, lekin
       tezlik chegarasi VALIDATSIYADAN OLDIN ishlaydi va odam noto'g'ri
       to'ldirilgan urinishlar bilan o'zini bloklab qo'yishi mumkin. */
    if (v.name.trim().length < 2) { setXato("Ismingizni to'liq yozing"); return; }
    if (v.tel.length !== 9) { setXato("Telefon raqam 9 ta raqamdan iborat bo'lishi kerak"); return; }

    setYuborilyapti(true); setXato("");
    const err = await onSubmit(v);
    setYuborilyapti(false);
    if (err) { setXato(err); return; }
    setYuborildi(true);
  }

  const KIRISH = cn(
    "w-full h-12 px-3.5 rounded-xl border text-[15px] transition-colors",
    "focus:outline-none focus-within:ring-2", m.maydon);

  return (
    <div className={cn("relative w-full", namuna ? "py-7 px-4" : "min-h-dvh py-10 sm:py-16 px-4",
      m.fon, namuna && "rounded-2xl overflow-hidden")}>

      {/* FON — yumshoq nur dog'lari. `pointer-events-none`: ular
          formadagi bosishlarni yutib qo'ymasligi kerak. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={cn("absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full blur-[90px]", m.dog1)} />
        <div className={cn("absolute -bottom-40 -right-20 w-[24rem] h-[24rem] rounded-full blur-[90px]", m.dog2)} />
      </div>

      <div className={cn("relative w-full mx-auto", namuna ? "max-w-[340px]" : "max-w-[420px]")}>

        {/* MARKAZ BRENDI */}
        <div className={cn("text-center", namuna ? "mb-5" : "mb-8")}>
          {config?.logoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={config.logoUrl} alt=""
              className={cn("mx-auto object-contain mb-3.5", namuna ? "h-10" : "h-14")} />
          )}
          {markaz === null ? (
            <div className="h-8 w-52 mx-auto rounded-lg bg-neutral-200 animate-pulse" />
          ) : (
            <h1 className={cn("font-black leading-tight tracking-tight", m.sarlavha,
              namuna ? "text-[19px]" : "text-[27px] sm:text-[32px]")}>
              {config?.title || markaz}
            </h1>
          )}
          <p className={cn("mt-2.5", m.tavsif, namuna ? "text-[11.5px]" : "text-[13.5px]")}>
            {config?.subtitle || "Ariza qoldiring — tez orada siz bilan bog'lanamiz"}
          </p>
        </div>

        {yuborildi ? (
          /* MUVAFFAQIYAT — forma o'rnini butunlay egallaydi.
             Forma qolsa odam yana yuborishga urinardi. */
          <div className={cn("rounded-3xl border p-8 text-center", m.karta)}>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 grid place-items-center mb-4">
              <Check className="w-8 h-8 text-green-600" strokeWidth={3} />
            </div>
            <p className={cn("text-[18px] font-bold", m.sarlavha)}>Arizangiz qabul qilindi</p>
            <p className={cn("text-[13.5px] mt-2 leading-relaxed", m.tavsif)}>
              {config?.successText || "Tez orada telefon qilamiz. Rahmat!"}
            </p>
          </div>
        ) : (
          <form onSubmit={yubor}
            className={cn("rounded-3xl border space-y-4", m.karta, namuna ? "p-4" : "p-5 sm:p-6")}>

            <Maydon m={m} ikonka={<User className="w-4 h-4" />} yorliq="Ismingiz">
              <input value={v.name} onChange={e => { setV(p => ({ ...p, name: e.target.value })); setXato(""); }}
                placeholder="Ism familiya" autoComplete="name" enterKeyHint="next"
                className={KIRISH} />
            </Maydon>

            <Maydon m={m} ikonka={<TelIkonka />} yorliq="Telefon raqam">
              {/* `+998` QOTIRILGAN — odam uni qo'lda yozsa har xil
                  ko'rinishda kelardi va CRM'da bir odam ikki raqam
                  bo'lib ko'rinardi. */}
              <div className={cn(KIRISH, "flex items-center p-0 overflow-hidden")}>
                <span className={cn("h-full px-3.5 grid place-items-center text-[15px] font-semibold",
                  "border-r select-none opacity-70", m.maydonYorliq)}>
                  +998
                </span>
                <input value={chiroyli(v.tel)}
                  onChange={e => { setV(p => ({ ...p, tel: faqatRaqam(e.target.value) })); setXato(""); }}
                  type="tel" inputMode="numeric" autoComplete="tel-national" enterKeyHint="next"
                  placeholder="90 123 45 67"
                  className="flex-1 min-w-0 h-full px-3 bg-transparent text-[15px] tracking-wide
                    focus:outline-none placeholder:opacity-50" />
              </div>
            </Maydon>

            {config?.showCourse && courses.length > 0 && (
              <Maydon m={m} ikonka={<BookOpen className="w-4 h-4" />} yorliq="Qaysi kurs" ixtiyoriy>
                <select value={v.courseId}
                  onChange={e => setV(p => ({ ...p, courseId: e.target.value }))}
                  className={KIRISH}>
                  <option value="">Tanlang…</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Maydon>
            )}

            {config?.showSchool && (
              <Maydon m={m} ikonka={<School className="w-4 h-4" />} yorliq="Maktab" ixtiyoriy>
                <input value={v.school} onChange={e => setV(p => ({ ...p, school: e.target.value }))}
                  placeholder="12-maktab" maxLength={120} className={KIRISH} />
              </Maydon>
            )}

            {config?.showGrade && (
              <Maydon m={m} ikonka={<Hash className="w-4 h-4" />} yorliq="Sinf" ixtiyoriy>
                <input value={v.grade} onChange={e => setV(p => ({ ...p, grade: e.target.value }))}
                  placeholder="9-A" maxLength={20} className={KIRISH} />
              </Maydon>
            )}

            {config?.showNote !== false && (
              <Maydon m={m} ikonka={<MessageSquare className="w-4 h-4" />} yorliq="Izoh" ixtiyoriy>
                <textarea value={v.note} onChange={e => setV(p => ({ ...p, note: e.target.value }))}
                  rows={3} maxLength={500} placeholder="Savolingiz bormi?"
                  className={cn(KIRISH, "h-auto py-2.5 resize-none leading-relaxed")} />
              </Maydon>
            )}

            {xato && <p className="text-[12.5px] font-medium text-red-500">{xato}</p>}

            {/* Tugma to'ldirilmaganda ham BOSILADI (rangi o'chadi):
                o'chiq tugma odamga NEGA ishlamayotganini aytmaydi va u
                sahifadan chiqib ketardi. */}
            <button type="submit" disabled={yuborilyapti}
              className={cn("w-full h-12 rounded-2xl text-[15px] font-bold text-white",
                "transition-all flex items-center justify-center gap-2 shadow-lg",
                toliq ? m.tugma : "bg-neutral-400 shadow-none", "disabled:opacity-60")}>
              {yuborilyapti
                ? <><Loader2 className="w-4 h-4 animate-spin" />Yuborilmoqda...</>
                : (config?.buttonText || "Yuborish")}
            </button>

            <p className={cn("flex items-center justify-center gap-1.5 text-[11px]", m.mayda)}>
              <ShieldCheck className="w-3.5 h-3.5" />
              Ma&apos;lumotlaringiz faqat markazga yuboriladi
            </p>
          </form>
        )}

        <div className={cn("flex items-center justify-center gap-2", namuna ? "mt-5" : "mt-8")}>
          <Image src="/logo.png" alt="OneRoom" width={20} height={20}
            className="rounded-md opacity-70" />
          <span className={cn("text-[12px] font-semibold", m.mayda)}>OneRoom</span>
        </div>
      </div>
    </div>
  );
}

function TelIkonka() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6
        19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2
        2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57
        2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function Maydon({
  m, ikonka, yorliq, ixtiyoriy, children,
}: {
  m: ReturnType<typeof mavzuOl>;
  ikonka: React.ReactNode;
  yorliq: string;
  ixtiyoriy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={cn("flex items-center gap-1.5 text-[12.5px] font-semibold mb-1.5",
        m.maydonYorliq)}>
        <span className="opacity-60">{ikonka}</span>
        {yorliq}
        {ixtiyoriy && <span className="font-normal opacity-60">· ixtiyoriy</span>}
      </span>
      {children}
    </label>
  );
}
