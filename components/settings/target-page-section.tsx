"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import {
  Upload, X, Check, Loader2, Link2, Copy, Eye, Palette, Type, ListChecks,
  Smartphone, Monitor, HelpCircle, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { MAVZULAR, type TargetTheme } from "@/lib/target-theme";
import {
  TargetPageView, type TargetConfig, type Maydon,
} from "@/components/target/target-page-view";
import { TargetFieldEditor } from "@/components/settings/target-field-editor";

/**
 * ARIZA SAHIFASI SOZLAMASI.
 *
 * Markaz reklamasi `markaz.oneroom.uz/target` ga olib keladi — ya'ni bu
 * sahifa markazning yuzi. Standart ko'rinish hammaga to'g'ri kelmaydi,
 * shuning uchun logotip, matnlar, maydonlar va mavzu sozlanadi.
 *
 * NAMUNA HAQIQIY SAHIFANING O'ZIDAN chiziladi (`TargetPageView`) —
 * alohida yozilsa, u sahifadan asta-sekin ajralib ketardi va markaz
 * bir narsani ko'rib sozlar, mijoz boshqasini ko'rardi.
 */

/** Logotip shu o'lchamgacha kichraytiriladi. */
const LOGO_MAX_SIDE = 200;
/** Server chegarasi 200 000; bu yerda ehtiyot uchun pastroq. */
const LOGO_MAX_BYTE = 180_000;

/**
 * Faylni kichraytirib base64 ga o'giradi.
 *
 * PNG saqlanadi — logotipda shaffoflik ko'p uchraydi va JPEG uni oq
 * fonga aylantirib, qorong'i mavzuda xunuk kvadrat chiqarardi.
 */
function rasmniTayyorla(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Fayl o'qilmadi"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasm yuklanmadi"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > LOGO_MAX_SIDE) {
          height = Math.round(height * LOGO_MAX_SIDE / width); width = LOGO_MAX_SIDE;
        } else if (height > LOGO_MAX_SIDE) {
          width = Math.round(width * LOGO_MAX_SIDE / height); height = LOGO_MAX_SIDE;
        }
        const c = document.createElement("canvas");
        c.width = width; c.height = height;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("Rasm tayyorlanmadi"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(c.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type Sozlama = TargetConfig & { theme: TargetTheme; fields?: Maydon[] | null };

const BOSH: Sozlama = {
  logoUrl: null, title: null, subtitle: null, buttonText: null, successText: null,
  theme: "BINAFSHA", showNote: true, showCourse: false, showSchool: false, showGrade: false,
  fields: null,
};

export function TargetPageSection({
  subdomain, onBack,
}: {
  subdomain: string | null;
  /** Berilsa — TO'LIQ EKRAN rejimi va tepada orqaga tugmasi. */
  onBack?: () => void;
}) {
  const { data, mutate } = useSWR<Sozlama>("/api/target-page", fetcher);
  const { data: org } = useSWR<{ name?: string }>("/api/organization", fetcher);
  const { data: kurslarRaw } = useSWR<{ id: string; name: string }[]>("/api/courses", fetcher);
  const kurslar = Array.isArray(kurslarRaw) ? kurslarRaw : [];

  /**
   * `null` — "hali tegilmadi", ya'ni serverdagi qiymat ko'rsatiladi.
   * Holatni effekt bilan serverdan ko'chirib olish ham mumkin edi,
   * lekin unda so'rov yangilanganda saqlanmagan tahrir jimgina
   * almashib ketardi.
   */
  const [qolda, setQolda] = useState<Sozlama | null>(null);
  const saqlangan: Sozlama = { ...BOSH, ...(data ?? {}) };
  const s = qolda ?? saqlangan;

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [nusxa, setNusxa] = useState(false);
  /**
   * NAMUNA QAYSI QURILMADA. Standart — TELEFON: reklamadan kelgan
   * odamlarning deyarli hammasi mobil qurilmada ochadi, ya'ni markaz
   * birinchi navbatda o'shani ko'rishi kerak.
   */
  const [qurilma, setQurilma] = useState<"mobil" | "kompyuter">("mobil");
  const fayl = useRef<HTMLInputElement>(null);

  const oz = (p: Partial<Sozlama>) => { setQolda({ ...s, ...p }); setMsg(null); };
  const ozgardi = JSON.stringify(s) !== JSON.stringify(saqlangan);
  const havola = subdomain ? `https://${subdomain}.oneroom.uz/target` : "";

  async function logoTanla(f: File | null) {
    if (!f) return;
    setMsg(null);
    try {
      const url = await rasmniTayyorla(f);
      if (url.length > LOGO_MAX_BYTE) {
        setMsg({ ok: false, text: "Rasm juda katta — soddaroq logotip tanlang" });
        return;
      }
      oz({ logoUrl: url });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  }

  async function saqla() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/target-page", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: s.logoUrl ?? "",
          title: s.title ?? "", subtitle: s.subtitle ?? "",
          buttonText: s.buttonText ?? "", successText: s.successText ?? "",
          theme: s.theme,
          showNote: s.showNote, showCourse: s.showCourse,
          showSchool: s.showSchool, showGrade: s.showGrade,
          fields: s.fields ?? [],
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: d?.error ?? "Saqlanmadi" }); return; }
      setMsg({ ok: true, text: "Saqlandi" });
      setQolda(null);
      mutate();
    } catch {
      setMsg({ ok: false, text: "Serverga ulanib bo'lmadi" });
    } finally { setSaving(false); }
  }

  const tana = (
    <div className="space-y-4">

      {/* ── HAVOLA ── */}
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl shrink-0 grid place-items-center
            bg-indigo-100/70 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Link2 className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
              Ariza sahifangiz
            </p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Reklamada shu havolani bering — to&apos;ldirilgan forma Lidlar bo&apos;limiga tushadi
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <code className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800
                text-[12.5px] font-mono text-neutral-700 dark:text-neutral-200 truncate">
                {havola || "—"}
              </code>
              <button type="button" disabled={!havola}
                onClick={async () => {
                  try { await navigator.clipboard.writeText(havola); setNusxa(true); setTimeout(() => setNusxa(false), 1800); }
                  catch { window.prompt("Nusxa oling:", havola); }
                }}
                className={cn("h-9 px-3.5 rounded-xl text-[12.5px] font-semibold text-white",
                  "flex items-center gap-1.5 transition-colors disabled:opacity-50",
                  nusxa ? "bg-green-600" : "bg-indigo-600 hover:bg-indigo-700")}>
                {nusxa ? <><Check className="w-3.5 h-3.5" />Olindi</> : <><Copy className="w-3.5 h-3.5" />Nusxa</>}
              </button>
              {havola && (
                <a href={havola} target="_blank" rel="noreferrer"
                  className="h-9 px-3 rounded-xl glass-soft border border-white/60 dark:border-white/10
                    text-[12.5px] font-semibold text-neutral-600 dark:text-neutral-300
                    flex items-center gap-1.5 hover:border-indigo-400 transition-colors">
                  <Eye className="w-3.5 h-3.5" />Ochish
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* YARIM-YARIM: sozlama chapda, natija o'ngda. Tor ekranda
          ustma-ust tushadi va namuna pastda qoladi — telefonda
          sozlash kamdan-kam bo'ladi. */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">

        {/* ── SOZLAMALAR ── */}
        <div className="space-y-4 min-w-0">

          {/* LOGOTIP */}
          <Blok ikonka={<Upload className="w-4 h-4" />} sarlavha="Logotip"
            tavsif="Sahifa tepasida, markaz nomi ustida chiqadi">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl border border-dashed border-neutral-300
                dark:border-white/15 grid place-items-center overflow-hidden shrink-0
                bg-white dark:bg-neutral-900">
                {s.logoUrl
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={s.logoUrl} alt="" className="w-full h-full object-contain" />
                  : <Upload className="w-5 h-5 text-neutral-300" />}
              </div>
              <div className="flex flex-wrap gap-2">
                <input ref={fayl} type="file" accept="image/*" className="hidden"
                  onChange={e => { void logoTanla(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                <Button type="button" variant="outline" className="h-9 text-[12.5px]"
                  onClick={() => fayl.current?.click()}>
                  Rasm tanlash
                </Button>
                {s.logoUrl && (
                  <button type="button" onClick={() => oz({ logoUrl: null })}
                    className="h-9 px-3 rounded-xl text-[12.5px] font-semibold text-red-600
                      hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" />Olib tashlash
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2">
              Rasm avtomatik kichraytiriladi. Shaffof fonli PNG eng yaxshi ko&apos;rinadi.
            </p>
          </Blok>

          {/* MATNLAR */}
          <Blok ikonka={<Type className="w-4 h-4" />} sarlavha="Matnlar"
            tavsif="Bo'sh qoldirilsa standart matn ishlatiladi">
            <div className="space-y-2.5">
              <Matn yorliq="Sarlavha" qiymat={s.title} max={80}
                joy={org?.name ?? "Markaz nomi"}
                ozgar={v => oz({ title: v })} />
              <Matn yorliq="Tavsif" qiymat={s.subtitle} max={160}
                joy="Ariza qoldiring — tez orada siz bilan bog'lanamiz"
                ozgar={v => oz({ subtitle: v })} />
              <Matn yorliq="Tugma yozuvi" qiymat={s.buttonText} max={30}
                joy="Yuborish" ozgar={v => oz({ buttonText: v })} />
              <Matn yorliq="Yuborilgandan keyingi matn" qiymat={s.successText} max={200}
                joy="Tez orada telefon qilamiz. Rahmat!"
                ozgar={v => oz({ successText: v })} />
            </div>
          </Blok>

          {/* MAYDONLAR */}
          <Blok ikonka={<ListChecks className="w-4 h-4" />} sarlavha="Qaysi maydonlar so'ralsin"
            tavsif="Ism va telefon har doim so'raladi — ularsiz lidning ma'nosi yo'q">
            <div className="space-y-1.5">
              <Kalit yoqiq={s.showCourse} ozgar={v => oz({ showCourse: v })}
                nom="Qaysi kurs"
                izoh={kurslar.length === 0
                  ? "Avval kurs qo'shing — aks holda ro'yxat bo'sh chiqadi"
                  : `${kurslar.length} ta kurs ro'yxatda chiqadi`} />
              <Kalit yoqiq={s.showSchool} ozgar={v => oz({ showSchool: v })}
                nom="Maktab" izoh="Maktab o'quvchilari bilan ishlaydigan markazlar uchun" />
              <Kalit yoqiq={s.showGrade} ozgar={v => oz({ showGrade: v })}
                nom="Sinf" izoh="Masalan 9-A" />
              <Kalit yoqiq={s.showNote !== false} ozgar={v => oz({ showNote: v })}
                nom="Izoh" izoh="Mijoz savolini yozishi uchun" />
            </div>
          </Blok>

          {/* QO'SHIMCHA SAVOLLAR — markazning o'zi yozadi. */}
          <Blok ikonka={<HelpCircle className="w-4 h-4" />} sarlavha="O'z savollaringiz"
            tavsif="Yosh, manzil, email — ko'pi bilan 3 ta">
            <TargetFieldEditor value={(s.fields as Maydon[]) ?? []}
              onChange={v => oz({ fields: v })} />
          </Blok>

          {/* MAVZU */}
          <Blok ikonka={<Palette className="w-4 h-4" />} sarlavha="Ko'rinish"
            tavsif="Fon va ranglar">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MAVZULAR.map(m => {
                const on = s.theme === m.kalit;
                return (
                  <button key={m.kalit} type="button" onClick={() => oz({ theme: m.kalit })}
                    className={cn("rounded-xl border-2 p-2 transition-colors text-left",
                      on ? "border-indigo-600 dark:border-indigo-400"
                         : "border-white/60 dark:border-white/10 hover:border-neutral-400")}>
                    <div className="h-10 rounded-lg mb-1.5" style={{ background: m.namuna }} />
                    <p className={cn("text-[11.5px] font-bold",
                      on ? "text-indigo-700 dark:text-indigo-300"
                         : "text-neutral-600 dark:text-neutral-300")}>
                      {m.nom}
                    </p>
                  </button>
                );
              })}
            </div>
          </Blok>

          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={saqla} disabled={saving || !ozgardi || !data}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 h-10">
              {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saqlanmoqda...</> : "Saqlash"}
            </Button>
            {ozgardi && !saving && (
              <button type="button" onClick={() => { setQolda(null); setMsg(null); }}
                className="text-[12px] font-semibold text-neutral-500 hover:text-neutral-700">
                Bekor qilish
              </button>
            )}
            {msg && (
              <span className={cn("text-[12px] font-medium",
                msg.ok ? "text-green-600" : "text-red-600")}>{msg.text}</span>
            )}
            {ozgardi && !msg && (
              <span className="text-[11.5px] font-semibold text-amber-600 dark:text-amber-400">
                Saqlanmagan — o&apos;ng tomondagi namuna sizniki, mijoz hali eskisini ko&apos;radi
              </span>
            )}
          </div>
        </div>

        {/* ── NAMUNA ──
            Sahifaning O'ZIDAN chiziladi (`TargetPageView`), alohida
            yozilmagan — aks holda u sahifadan asta-sekin ajralib
            ketardi va markaz bir narsani ko'rib sozlar, mijoz
            boshqasini ko'rardi. */}
        <div className="lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400
              uppercase tracking-wider">
              Mijoz shuni ko&apos;radi
            </p>
            {/* QURILMA ALMASHTIRGICHI — mobil standart, chunki
                reklamadan kelganlarning deyarli hammasi telefonda. */}
            <div className="flex gap-0.5 p-0.5 rounded-lg glass-soft">
              {([
                { v: "mobil" as const,     i: Smartphone, t: "Telefon" },
                { v: "kompyuter" as const, i: Monitor,    t: "Kompyuter" },
              ]).map(q => {
                const I = q.i;
                return (
                  <button key={q.v} type="button" onClick={() => setQurilma(q.v)} title={q.t}
                    className={cn("w-7 h-7 grid place-items-center rounded-md transition-colors",
                      qurilma === q.v
                        ? "bg-indigo-600 text-white"
                        : "text-neutral-400 hover:text-neutral-600")}>
                    <I className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-auto transition-all">
            {/* TELEFON RAMKASI — iPhone Pro Max nisbatida (430×932).
                Namuna haqiqiy qurilma o'lchamida ekanini ko'rsatadi:
                ramkasiz markaz uni kichik rasm deb o'ylab, matn
                uzunligini noto'g'ri baholardi va telefonda sarlavha
                ikki qatorga tushib ketardi. */}
            {qurilma === "mobil" ? (
              <div className="relative mx-auto" style={{ width: 300 }}>
                <div className="relative rounded-[3rem] bg-neutral-900 p-[10px]
                  shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)]
                  ring-1 ring-neutral-700/60">
                  {/* Yon tugmalar — ramkaga qurilma ko'rinishini beradi. */}
                  <span className="absolute -left-[3px] top-[110px] w-[3px] h-9 rounded-l bg-neutral-700" />
                  <span className="absolute -left-[3px] top-[160px] w-[3px] h-14 rounded-l bg-neutral-700" />
                  <span className="absolute -right-[3px] top-[140px] w-[3px] h-20 rounded-r bg-neutral-700" />

                  <div className="relative rounded-[2.4rem] overflow-hidden bg-white"
                    style={{ height: 620 }}>
                    {/* DYNAMIC ISLAND — kontent ustida suzadi.
                        `pointer-events-none`: u namunadagi bosishlarni
                        yutib qo'ymasligi kerak. */}
                    <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-20
                      w-[86px] h-[26px] rounded-full bg-black" />
                    <div className="h-full overflow-y-auto">
                      <TargetPageView markaz={org?.name ?? "Markaz"} config={s}
                        courses={kurslar} namuna />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-white/60 dark:border-white/10">
                <div className="h-[560px] overflow-y-auto">
                  <TargetPageView markaz={org?.name ?? "Markaz"} config={s}
                    courses={kurslar} />
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-neutral-400 text-center mt-2">
            Namuna — forma bu yerdan yuborilmaydi
          </p>
        </div>
      </div>
    </div>
  );

  if (!onBack) return tana;

  /**
   * TO'LIQ EKRAN — sozlama va namuna yonma-yon sig'ishi uchun.
   *
   * Sozlamalar sahifasining ichida bu bo'lim tor ustunga tiqilib,
   * namuna kichrayib ketardi — markaz esa aynan NAMUNAGA qarab
   * ishlaydi (egasining talabi, 2026-09-21).
   *
   * `fixed` + `z-50`: yon menyu va tepa sarlavha ostida qolmasin.
   * Orqaga tugmasi sozlamalarga qaytaradi.
   */
  return (
    <div className="fixed inset-0 z-50 bg-[#fbfbfd] dark:bg-neutral-950 flex flex-col">
      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 h-14
        border-b border-neutral-200 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80
        backdrop-blur">
        <button type="button" onClick={onBack}
          className="h-9 px-3 -ml-1 rounded-xl text-[13px] font-semibold
            text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5
            hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />Sozlamalar
        </button>
        <div className="w-px h-5 bg-neutral-200 dark:bg-white/10" />
        <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
          Ariza sahifasi
        </p>
        {ozgardi && (
          <span className="ml-auto text-[11.5px] font-semibold text-amber-600 dark:text-amber-400">
            Saqlanmagan
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-[1500px] mx-auto">{tana}</div>
      </div>
    </div>
  );
}

function Blok({
  ikonka, sarlavha, tavsif, children,
}: {
  ikonka: React.ReactNode; sarlavha: string; tavsif: string; children: React.ReactNode;
}) {
  return (
    <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl shrink-0 grid place-items-center
          bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
          {ikonka}
        </div>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100">{sarlavha}</p>
          <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">{tavsif}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Matn({
  yorliq, qiymat, joy, max, ozgar,
}: {
  yorliq: string; qiymat: string | null | undefined; joy: string;
  max: number; ozgar: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11.5px] font-semibold text-neutral-600 dark:text-neutral-300">
        {yorliq}
      </span>
      <input value={qiymat ?? ""} onChange={e => ozgar(e.target.value)}
        placeholder={joy} maxLength={max}
        className="w-full h-9 px-3 mt-1 rounded-xl glass-soft border border-white/60
          dark:border-white/10 text-[12.5px] text-neutral-800 dark:text-neutral-100
          placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
    </label>
  );
}

function Kalit({
  yoqiq, ozgar, nom, izoh,
}: {
  yoqiq: boolean | undefined; ozgar: (v: boolean) => void; nom: string; izoh: string;
}) {
  return (
    <button type="button" onClick={() => ozgar(!yoqiq)}
      className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left
        hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
      <span className={cn("h-4 w-4 shrink-0 mt-0.5 rounded border grid place-items-center transition-colors",
        yoqiq ? "bg-indigo-600 border-indigo-600" : "border-neutral-300 dark:border-neutral-600")}>
        {yoqiq && <Check className="w-3 h-3 text-white" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] font-semibold text-neutral-800 dark:text-neutral-100">{nom}</span>
        <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">{izoh}</span>
      </span>
    </button>
  );
}
