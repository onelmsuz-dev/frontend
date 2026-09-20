"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, Loader2, User, MessageSquare, AlertCircle, ShieldCheck } from "lucide-react";

/**
 * OCHIQ ARIZA SAHIFASI — `markaz.oneroom.uz/target`.
 *
 * Instagram/Facebook target reklamasi shu havolaga olib keladi.
 * Odam ism, telefon va izoh yozadi — lid o'sha zahoti markazning
 * Lidlar taxtasida paydo bo'ladi.
 *
 * LOGIN YO'Q va panel tartibidan TASHQARIDA: `(dashboard)` guruhiga
 * kirmaydi, ya'ni yon menyu, tarif tekshiruvi va boshqa hech narsa
 * yuklanmaydi. Reklamadan kelgan odam uchun sahifa iloji boricha
 * yengil bo'lishi kerak — u mobil internetda ochiladi va sekin
 * yuklansa shunchaki chiqib ketadi.
 *
 * MARKAZ SUBDOMENDAN aniqlanadi. Havolada markaz identifikatori
 * YO'Q — aks holda uni almashtirib boshqa markazga lid yozish
 * mumkin bo'lardi.
 */

function subdomen(): string {
  if (typeof window === "undefined") return "";
  const parts = window.location.hostname.split(".");
  // `demo.oneroom.uz` → ["demo","oneroom","uz"]; `oneroom.uz` → subdomen yo'q
  return parts.length > 2 ? parts[0] : "";
}

/**
 * MARKAZ BELGISI — nom harflaridan.
 *
 * Bazada logo maydoni yo'q, va uni shoshib qo'shish noto'g'ri
 * bo'lardi: har markaz fayl yuklashi, uni saqlash, o'lcham va
 * format tekshiruvi kerak. Ikki harf esa bugun ishlaydi va
 * sahifaga "tayyor" ko'rinish beradi.
 */
function harflar(nom: string): string {
  const s = nom.trim().split(/\s+/).filter(Boolean);
  if (s.length === 0) return "?";
  if (s.length === 1) return s[0].slice(0, 2).toUpperCase();
  return (s[0][0] + s[1][0]).toUpperCase();
}

/**
 * TELEFON — faqat raqam, va aynan 9 ta.
 *
 * `+998` maydonning O'ZIDA qotirilgan, kiritish mumkin emas: odam
 * uni qo'lda yozsa har xil ko'rinishda kelardi (`998...`, `+998...`,
 * `8998...`) va CRM'da bir xil odam ikki raqam bo'lib ko'rinardi.
 * Bu yerdan HAR DOIM `+998XXXXXXXXX` chiqadi.
 */
function faqatRaqam(v: string): string {
  return v.replace(/\D/g, "").slice(0, 9);
}

/** `901234567` → `90 123 45 67` — o'qish uchun. */
function chiroyli(d: string): string {
  const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)];
  return p.filter(Boolean).join(" ");
}

export default function TargetPage() {
  const [markaz, setMarkaz] = useState<string | null>(null);
  const [topilmadi, setTopilmadi] = useState(false);

  const [name, setName]   = useState("");
  const [tel, setTel]     = useState("");     // faqat 9 raqam
  const [note, setNote]   = useState("");
  const [yuborilyapti, setYuborilyapti] = useState(false);
  const [yuborildi, setYuborildi] = useState(false);
  const [xato, setXato] = useState("");

  useEffect(() => {
    /**
     * Subdomen bo'sh bo'lsa ham SO'ROV YUBORAMIZ: server bo'sh
     * subdomenga 404 qaytaradi va natija bitta yo'ldan — `catch` dan
     * o'tadi. Shu yerda darhol `setTopilmadi` qilish ham mumkin edi,
     * lekin effekt TANASIDA holat o'zgartirish ortiqcha qayta
     * chizishga olib keladi (`react-hooks/set-state-in-effect`).
     */
    fetch(`/api/public/center?subdomain=${encodeURIComponent(subdomen())}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { name: string }) => setMarkaz(d.name))
      .catch(() => setTopilmadi(true));
  }, []);

  const toliq = useMemo(() => name.trim().length >= 2 && tel.length === 9, [name, tel]);

  async function yubor(e: React.FormEvent) {
    e.preventDefault();
    if (yuborilyapti) return;
    /**
     * Brauzerda ham tekshiramiz — server baribir tekshiradi, lekin
     * tezlik chegarasi VALIDATSIYADAN OLDIN ishlaydi: noto'g'ri
     * to'ldirilgan urinishlar ham sanaladi va odam o'z arizasi bilan
     * o'zini bloklab qo'yishi mumkin edi.
     */
    if (name.trim().length < 2) { setXato("Ismingizni to'liq yozing"); return; }
    if (tel.length !== 9) { setXato("Telefon raqam 9 ta raqamdan iborat bo'lishi kerak"); return; }

    setYuborilyapti(true); setXato("");
    try {
      const r = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: subdomen(),
          name: name.trim(),
          phone: `+998${tel}`,
          note: note.trim() || undefined,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setXato(d?.error ?? "Yuborilmadi — birozdan keyin urinib ko'ring"); return; }
      setYuborildi(true);
    } catch {
      setXato("Internet aloqasi yo'q — qaytadan urinib ko'ring");
    } finally { setYuborilyapti(false); }
  }

  if (topilmadi) {
    return (
      <main className="min-h-dvh grid place-items-center p-6 bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-neutral-300 mb-3" />
          <p className="text-[14px] font-semibold text-neutral-700 dark:text-neutral-200">
            Sahifa topilmadi
          </p>
          <p className="text-[12.5px] text-neutral-500 mt-1">
            Havola to&apos;liq ochilmagan bo&apos;lishi mumkin.
          </p>
        </div>
      </main>
    );
  }

  return (
    /* `min-h-dvh` — `vh` EMAS: mobil brauzerda manzil paneli
       yig'ilganda `vh` sakrab, forma qimirlab turardi. */
    <main className="relative min-h-dvh overflow-hidden bg-[#fbfbfd] dark:bg-[#0a0a0c]
      px-4 py-10 sm:py-16">

      {/* FON — yumshoq nur dog'lari. `pointer-events-none`: ular
          formadagi bosishlarni yutib qo'ymasligi kerak. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full
          bg-indigo-400/20 dark:bg-indigo-500/10 blur-[90px]" />
        <div className="absolute -bottom-40 -right-20 w-[24rem] h-[24rem] rounded-full
          bg-violet-400/15 dark:bg-violet-500/10 blur-[90px]" />
      </div>

      <div className="w-full max-w-[420px] mx-auto">

        {/* MARKAZ BRANDI — tepada. Odam reklamani bosib kelganda
            "to'g'ri joyga tushdimmi" degan savolga darhol javob
            olishi kerak, aks holda formani to'ldirmaydi. */}
        <div className="text-center mb-8">
          {markaz === null ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-200
                dark:bg-neutral-800 animate-pulse" />
              <div className="h-7 w-48 mx-auto mt-4 rounded-lg bg-neutral-200
                dark:bg-neutral-800 animate-pulse" />
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl grid place-items-center
                bg-gradient-to-br from-indigo-500 to-violet-600
                shadow-lg shadow-indigo-500/25">
                <span className="text-white text-[22px] font-black tracking-tight">
                  {harflar(markaz)}
                </span>
              </div>
              <h1 className="text-[25px] sm:text-[29px] font-black text-neutral-900
                dark:text-neutral-50 leading-tight tracking-tight mt-4">
                {markaz}
              </h1>
            </>
          )}
          <p className="text-[13.5px] text-neutral-500 dark:text-neutral-400 mt-2.5">
            Ariza qoldiring — tez orada siz bilan bog&apos;lanamiz
          </p>
        </div>

        {yuborildi ? (
          /* MUVAFFAQIYAT — forma o'rnini butunlay egallaydi.
             Forma qolsa odam yana yuborishga urinardi. */
          <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80
            dark:border-white/10 shadow-xl shadow-neutral-900/5 p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 dark:bg-green-900/30
              grid place-items-center mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" strokeWidth={3} />
            </div>
            <p className="text-[18px] font-bold text-neutral-900 dark:text-neutral-50">
              Arizangiz qabul qilindi
            </p>
            <p className="text-[13.5px] text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Tez orada telefon qilamiz. Rahmat!
            </p>
          </div>
        ) : (
          <form onSubmit={yubor}
            className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80
              dark:border-white/10 shadow-xl shadow-neutral-900/5 p-5 sm:p-6 space-y-4">

            <Maydon ikonka={<User className="w-4 h-4" />} yorliq="Ismingiz">
              <input value={name} onChange={e => { setName(e.target.value); setXato(""); }}
                placeholder="Ism familiya"
                autoComplete="name" enterKeyHint="next"
                className={KIRISH} />
            </Maydon>

            <Maydon ikonka={<TelIkonka />} yorliq="Telefon raqam">
              {/* `+998` QOTIRILGAN — kiritish mumkin emas. Odam uni
                  qo'lda yozsa har xil ko'rinishda kelardi va CRM'da
                  bir odam ikki raqam bo'lib ko'rinardi. */}
              <div className={`${KIRISH} flex items-center gap-0 p-0 overflow-hidden`}>
                <span className="h-full px-3.5 grid place-items-center text-[15px] font-semibold
                  text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800
                  border-r border-neutral-200 dark:border-white/10 select-none">
                  +998
                </span>
                <input
                  value={chiroyli(tel)}
                  onChange={e => { setTel(faqatRaqam(e.target.value)); setXato(""); }}
                  type="tel" inputMode="numeric" autoComplete="tel-national"
                  enterKeyHint="next"
                  placeholder="90 123 45 67"
                  className="flex-1 min-w-0 h-full px-3 bg-transparent text-[15px]
                    tracking-wide text-neutral-900 dark:text-neutral-100
                    placeholder:text-neutral-400 focus:outline-none" />
              </div>
            </Maydon>

            <Maydon ikonka={<MessageSquare className="w-4 h-4" />} yorliq="Izoh" ixtiyoriy>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                rows={3} maxLength={500}
                placeholder="Qaysi kurs qiziqtiradi?"
                className={`${KIRISH} h-auto py-2.5 resize-none leading-relaxed`} />
            </Maydon>

            {xato && (
              <p className="text-[12.5px] font-medium text-red-600 dark:text-red-400">{xato}</p>
            )}

            {/* Tugma BALAND (h-12): mobilda barmoq bilan bosiladi.
                To'ldirilmaganda ham BOSILADI — shunda xato matni
                chiqadi. O'chiq tugma odamga NEGA ishlamayotganini
                aytmaydi va u sahifadan chiqib ketardi. */}
            <button type="submit" disabled={yuborilyapti}
              className={`w-full h-12 rounded-2xl text-[15px] font-bold transition-all
                flex items-center justify-center gap-2 text-white
                ${toliq
                  ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-600/25"
                  : "bg-neutral-400 dark:bg-neutral-700"}
                disabled:opacity-60`}>
              {yuborilyapti
                ? <><Loader2 className="w-4 h-4 animate-spin" />Yuborilmoqda...</>
                : "Yuborish"}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Ma&apos;lumotlaringiz faqat markazga yuboriladi
            </p>
          </form>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-7 opacity-60">
          <Image src="/logo.png" alt="" width={16} height={16} className="rounded" />
          <span className="text-[11px] text-neutral-400">OneRoom</span>
        </div>
      </div>
    </main>
  );
}

const KIRISH =
  "w-full h-12 px-3.5 rounded-xl border border-neutral-300 dark:border-white/15 " +
  "bg-white dark:bg-neutral-950 text-[15px] text-neutral-900 dark:text-neutral-100 " +
  "placeholder:text-neutral-400 focus:outline-none focus-within:border-indigo-500 " +
  "focus:border-indigo-500 focus-within:ring-2 focus:ring-2 focus-within:ring-indigo-500/20 " +
  "focus:ring-indigo-500/20 transition-colors";

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
  ikonka, yorliq, ixtiyoriy, children,
}: {
  ikonka: React.ReactNode;
  yorliq: string;
  ixtiyoriy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold
        text-neutral-600 dark:text-neutral-300 mb-1.5">
        <span className="text-neutral-400">{ikonka}</span>
        {yorliq}
        {ixtiyoriy && <span className="font-normal text-neutral-400">· ixtiyoriy</span>}
      </span>
      {children}
    </label>
  );
}
