"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Phone, User, MessageSquare, AlertCircle } from "lucide-react";

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

export default function TargetPage() {
  const [markaz, setMarkaz] = useState<string | null>(null);
  const [topilmadi, setTopilmadi] = useState(false);

  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
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
    if (phone.replace(/\D/g, "").length < 7) { setXato("Telefon raqamini to'g'ri yozing"); return; }

    setYuborilyapti(true); setXato("");
    try {
      const r = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: subdomen(),
          name: name.trim(),
          phone: phone.trim(),
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
    <main className="min-h-dvh bg-gradient-to-b from-indigo-50 via-white to-white
      dark:from-indigo-950/30 dark:via-neutral-950 dark:to-neutral-950
      px-4 py-8 sm:py-14">
      <div className="w-full max-w-[420px] mx-auto">

        {/* MARKAZ BRANDI — tepada. Odam reklamani bosib kelganda
            "to'g'ri joyga tushdimmi" degan savolga darhol javob
            olishi kerak, aks holda formani to'ldirmaydi. */}
        <div className="text-center mb-7">
          {markaz === null ? (
            <div className="h-8 w-44 mx-auto rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ) : (
            <h1 className="text-[26px] sm:text-[30px] font-black text-neutral-900 dark:text-neutral-50
              leading-tight tracking-tight">
              {markaz}
            </h1>
          )}
          <p className="text-[13.5px] text-neutral-500 dark:text-neutral-400 mt-2">
            Ariza qoldiring — tez orada siz bilan bog&apos;lanamiz
          </p>
        </div>

        {yuborildi ? (
          /* MUVAFFAQIYAT — forma o'rnini butunlay egallaydi.
             Forma qolsa odam yana yuborishga urinardi. */
          <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200
            dark:border-white/10 shadow-sm p-7 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-green-100 dark:bg-green-900/30
              grid place-items-center mb-4">
              <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-[17px] font-bold text-neutral-900 dark:text-neutral-50">
              Arizangiz qabul qilindi
            </p>
            <p className="text-[13.5px] text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Tez orada telefon qilamiz. Rahmat!
            </p>
          </div>
        ) : (
          <form onSubmit={yubor}
            className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200
              dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-4">

            <Maydon ikonka={<User className="w-4 h-4" />} yorliq="Ismingiz">
              <input value={name} onChange={e => { setName(e.target.value); setXato(""); }}
                placeholder="Ism familiya"
                autoComplete="name"
                className={KIRISH} />
            </Maydon>

            <Maydon ikonka={<Phone className="w-4 h-4" />} yorliq="Telefon raqam">
              {/* `type="tel"` — mobilda RAQAMLI klaviatura ochiladi.
                  `text` bo'lsa odam harf klaviaturasida raqam qidirardi. */}
              <input value={phone} onChange={e => { setPhone(e.target.value); setXato(""); }}
                type="tel" inputMode="tel" autoComplete="tel"
                placeholder="+998 90 123 45 67"
                className={KIRISH} />
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

            {/* Tugma BALAND (h-12): mobilda barmoq bilan bosiladi. */}
            <button type="submit" disabled={yuborilyapti}
              className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700
                active:bg-indigo-800 disabled:opacity-60 text-white text-[15px] font-bold
                transition-colors flex items-center justify-center gap-2">
              {yuborilyapti
                ? <><Loader2 className="w-4 h-4 animate-spin" />Yuborilmoqda...</>
                : "Yuborish"}
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-neutral-400 mt-6">
          OneRoom orqali
        </p>
      </div>
    </main>
  );
}

const KIRISH =
  "w-full h-12 px-3.5 rounded-xl border border-neutral-300 dark:border-white/15 " +
  "bg-white dark:bg-neutral-950 text-[15px] text-neutral-900 dark:text-neutral-100 " +
  "placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500 " +
  "focus:ring-2 focus:ring-indigo-500/20 transition-colors";

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
