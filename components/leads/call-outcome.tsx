"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LOST_REASONS } from "@/lib/hooks/useLeads";
import { useCourses } from "@/lib/hooks/useCourses";
import { Phone, PhoneOff, X, Undo2, Loader2, BookOpen } from "lucide-react";

/**
 * QO'NG'IROQ NATIJASI.
 *
 * Ilgari kartochkada BITTA tugma bor edi va u faqat "gaplashdim"
 * degan ma'noni berardi. Administrator qo'ng'iroq qilganda to'rt
 * narsadan birini eshitadi:
 *
 *   javob bermadi · gaplashdim · payshanbaga qo'ying · qiziqmayman
 *
 * Uchtasi uchun rostgo'y tugma yo'q edi — shuning uchun ehtiyotkor
 * odam hech nima bosmasdi va lidlar birinchi ustunda qotib qolardi.
 * Proddagi 12 liddan 10 tasi shunday.
 *
 * SABAB TUGMALAR BILAN, ERKIN MATN EMAS. Qo'ng'iroq paytida hech kim
 * gap yozib o'tirmaydi — o'sha 12 lidning 0 tasida izoh bor. Tayyor
 * tugma bir bosishda tanlanadi va keyin SANALADI: "nega yo'qotyapmiz"
 * degan savolga javob beradi.
 */

/** Sana chiplari — "payshanbaga qo'ying" degan javob uchun. */
function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CallOutcome({
  leadId, canAdvance, hasCourse, onDone,
}: {
  leadId: string;
  /** Oldinga siljish mumkinmi (oxirgi bosqichda emasmi). */
  canAdvance: boolean;
  /** Lidda kurs allaqachon belgilanganmi. */
  hasCourse: boolean;
  onDone: () => void;
}) {
  const { data: coursesRaw } = useCourses();
  const courses: { id: string; name: string }[] =
    Array.isArray(coursesRaw) ? coursesRaw : (coursesRaw?.data ?? []);

  const [open, setOpen] = useState<null | "reason" | "date" | "course">(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState<"JAVOB_BERMADI" | "GAPLASHDIM" | null>(null);
  /** Kurs so'ralganda — qaysi ekstra maydonlar bilan qayta yuborish kerak. */
  const [pendingExtra, setPendingExtra] = useState<Record<string, unknown>>({});

  async function send(outcome: string, extra: Record<string, unknown> = {}) {
    setBusy(outcome); setErr("");
    try {
      const r = await fetch(`/api/leads/${leadId}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, ...extra }),
      });
      const j = await r.json();
      if (!r.ok) {
        // Server AYNAN shu sababdan rad etsa — kurs tanlash bosqichini
        // ochamiz. Boshqa xatolar oddiy xabar bo'lib qoladi.
        //
        // ILGARI BU YERDA HECH NARSA YO'Q EDI: kurs so'raladigan oyna
        // faqat eski (endi ishlatilmaydigan) tugmadan ochilardi. «Gaplashdim»
        // bosilganda odam qizil xato matnini ko'rardi-yu, kurs tanlaydigan
        // joy topa olmasdi — o'lik uch.
        if (String(j?.error ?? "").includes("kursni tanlang")) {
          setPending(outcome as never); setPendingExtra(extra);
          setOpen("course"); setBusy(null);
          return;
        }
        throw new Error(j?.error ?? "Saqlab bo'lmadi");
      }
      setOpen(null); setPending(null); setPendingExtra({});
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(null); }
  }

  const btn = "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-40";

  if (open === "reason") {
    return (
      <div className="w-full space-y-1.5 pt-1.5">
        <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
          Nega qiziqmadi?
        </p>
        <div className="flex flex-wrap gap-1">
          {LOST_REASONS.map((r) => (
            <button key={r.v} disabled={!!busy}
              onClick={() => send("QIZIQMADI", { lostReason: r.v })}
              className={cn(btn, "bg-neutral-100 dark:bg-neutral-800",
                            "text-neutral-600 dark:text-neutral-300 hover:bg-red-50 hover:text-red-600")}>
              {busy === "QIZIQMADI" ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
              {r.l}
            </button>
          ))}
          <button onClick={() => { setOpen(null); setErr(""); }}
            className={cn(btn, "text-neutral-400")}>
            <X className="w-2.5 h-2.5" /> Bekor
          </button>
        </div>
        {err && <p className="text-[10px] text-red-600">{err}</p>}
      </div>
    );
  }

  if (open === "course") {
    return (
      <div className="w-full space-y-1.5 pt-1.5">
        <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
          Qaysi kursga yozildi?
        </p>
        {courses.length === 0 ? (
          <p className="text-[10px] text-neutral-400">Hali kurs yaratilmagan</p>
        ) : (
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {courses.map((c) => (
              <button key={c.id} disabled={!!busy}
                onClick={() => send(pending!, { ...pendingExtra, courseId: c.id })}
                className={cn(btn, "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300")}>
                {busy === pending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <BookOpen className="w-2.5 h-2.5" />}
                {c.name}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => { setOpen(null); setPending(null); setErr(""); }}
          className={cn(btn, "text-neutral-400")}>
          <X className="w-2.5 h-2.5" /> Bekor
        </button>
        {err && <p className="text-[10px] text-red-600">{err}</p>}
      </div>
    );
  }

  if (open === "date") {
    return (
      <div className="w-full space-y-1.5 pt-1.5">
        <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
          Qachon qayta bog&apos;lanamiz?
        </p>
        <div className="flex flex-wrap gap-1">
          {[["Ertaga", 1], ["3 kundan", 3], ["Bir haftadan", 7]].map(([l, n]) => (
            <button key={String(l)} disabled={!!busy}
              onClick={() => send(pending!, { nextContactAt: plusDays(n as number) })}
              className={cn(btn, "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400")}>
              {l}
            </button>
          ))}
          {/* Sanani belgilamasdan ham yopish mumkin — majburiy qilsak,
              odam tugmani umuman bosmay qo'yardi. */}
          <button disabled={!!busy} onClick={() => send(pending!)}
            className={cn(btn, "text-neutral-500 dark:text-neutral-400")}>
            Sanasiz
          </button>
        </div>
        {err && <p className="text-[10px] text-red-600">{err}</p>}
      </div>
    );
  }

  return (
    <div className="w-full pt-1.5 space-y-1">
      <div className="flex flex-wrap gap-1">
        {canAdvance && (
          <button disabled={!!busy}
            onClick={() => { setPending("GAPLASHDIM"); setOpen("date"); }}
            title={hasCourse ? "Gaplashdim — keyingi bosqichga o'tadi"
                              : "Gaplashdim — «To'ladi» bosqichida kurs so'raladi"}
            className={cn(btn, "bg-indigo-600 text-white hover:bg-indigo-700")}>
            <Phone className="w-2.5 h-2.5" />
            Gaplashdim
            {/* Kurs hali yo'q — oxirgi qadamda so'raladi (tooltipda
                aytilgan). Ilgari bu aynan shu tugma bosilganda XATO
                chiqib, kurs tanlaydigan joy bo'lmasdi; endi
                CallOutcome server rad etganda o'zi so'raydi. Tor
                kartochkada matn belgisi joy yemasin deb faqat
                tooltipda qoldirilgan. */}
            {!hasCourse && <span className="w-1 h-1 rounded-full bg-white/70" />}
          </button>
        )}
        <button disabled={!!busy}
          onClick={() => { setPending("JAVOB_BERMADI"); setOpen("date"); }}
          title="Javob bermadi — bosqich o'zgarmaydi, urinish sanaladi"
          className={cn(btn, "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300")}>
          <PhoneOff className="w-2.5 h-2.5" />{" "}Javob yo&apos;q
        </button>
        <button disabled={!!busy} onClick={() => { setOpen("reason"); setErr(""); }}
          title="Qiziqmadi — «Bekor» ga o'tadi"
          className={cn(btn, "text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20")}>
          <X className="w-2.5 h-2.5" /> Qiziqmadi
        </button>
      </div>
      {err && <p className="text-[10px] text-red-600">{err}</p>}
    </div>
  );
}

/** Bir qadam orqaga — noto'g'ri bosilgan tugmani tuzatish uchun. */
export function StepBack({ leadId, onDone }: { leadId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} title="Bir qadam orqaga"
      onClick={async () => {
        setBusy(true);
        try {
          await fetch(`/api/leads/${leadId}/back`, { method: "POST" });
          onDone();
        } finally { setBusy(false); }
      }}
      className="w-5 h-5 flex items-center justify-center rounded-md text-neutral-300
                 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                 transition-colors shrink-0 disabled:opacity-40">
      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
    </button>
  );
}
