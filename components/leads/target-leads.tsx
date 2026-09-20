"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Link2, Copy, Check, Share2, FileText, Sheet, Users, Search, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { formatUzDate } from "@/lib/date-uz";
import { TargetGuide } from "@/components/leads/target-guide";

/**
 * TARGET LIDLARI — `markaz.oneroom.uz/target` sahifasidan kelganlar.
 *
 * Bu tab ATAYLAB taxtadan alohida. Taxta — ish jarayoni (bosqichdan
 * bosqichga surish), bu yerdagi savol esa boshqa: "reklama qancha
 * ariza olib keldi va ular bilan nima qildik". Ro'yxat ko'rinishi
 * shu savolga javob beradi, kanban esa bermaydi.
 *
 * MA'LUMOT ALOHIDA SO'RALADI, taxtadagi ro'yxatdan filtrlanmaydi:
 * taxta sahifalab yuklanadi va undan filtrlansa, tabda lidlarning
 * FAQAT YUKLANGAN QISMI ko'rinardi — soni esa to'g'ri ko'rinib
 * turardi. Prodda shunga o'xshash xato bo'lgan (Juniors Academy).
 */

const MANBA = "Target";

interface Lid {
  id: string;
  name: string;
  phone: string;
  note: string | null;
  createdAt: string;
  stage?: { name: string; color?: string | null } | null;
  assignedTo?: { name: string } | null;
}

export function TargetLeads() {
  /**
   * SUBDOMEN manzil satridan olinadi — serverdan so'ralmaydi.
   *
   * `useState` ning DANGASA boshlang'ichi, `useEffect` emas: effekt
   * ichida holat o'zgartirish ortiqcha qayta chizishga olib keladi.
   * Bu tab faqat foydalanuvchi bosganda chiziladi, ya'ni o'sha paytda
   * brauzerdamiz va `window` bor.
   */
  const [subdomain] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const parts = window.location.hostname.split(".");
    return parts.length > 2 ? parts[0] : null;
  });

  const { data, isLoading } = useSWR<{ items?: Lid[] } | Lid[]>(
    `/api/leads?source=${encodeURIComponent(MANBA)}&take=1000`, fetcher);

  const lidlar: Lid[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    return data?.items ?? [];
  }, [data]);

  const [q, setQ] = useState("");
  const [tanlangan, setTanlangan] = useState<Set<string>>(new Set());
  const [nusxaOlindi, setNusxaOlindi] = useState<string>("");

  const havola = subdomain ? `https://${subdomain}.oneroom.uz/target` : "";

  const korinadi = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return lidlar;
    return lidlar.filter(l =>
      l.name.toLowerCase().includes(s) || (l.phone ?? "").includes(s));
  }, [lidlar, q]);

  /** Belgilanganlar, belgilanmasa — ko'rinib turganlarning hammasi. */
  const amalUchun = useMemo(
    () => (tanlangan.size ? korinadi.filter(l => tanlangan.has(l.id)) : korinadi),
    [korinadi, tanlangan]);

  const hammasiBelgilangan =
    korinadi.length > 0 && korinadi.every(l => tanlangan.has(l.id));

  function belgila(id: string) {
    setTanlangan(p => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function hammasini() {
    setTanlangan(hammasiBelgilangan ? new Set() : new Set(korinadi.map(l => l.id)));
  }

  async function nusxa(matn: string, belgi: string) {
    try {
      await navigator.clipboard.writeText(matn);
      setNusxaOlindi(belgi);
      setTimeout(() => setNusxaOlindi(""), 1800);
    } catch {
      // `clipboard` HTTPS va foydalanuvchi harakatini talab qiladi;
      // rad etilsa jim qolgandan ko'ra matnni ko'rsatgan afzal.
      window.prompt("Nusxa oling:", matn);
    }
  }

  const matnRoyxat = (list: Lid[]) => list
    .map(l => `${l.name} — ${l.phone}${l.note ? ` (${l.note})` : ""}`)
    .join("\n");

  async function ulash() {
    const matn = matnRoyxat(amalUchun);
    // Web Share — telefonda Telegram/WhatsApp ro'yxati chiqadi.
    // Kompyuterda odatda yo'q, shuning uchun nusxaga tushadi.
    if (navigator.share) {
      try { await navigator.share({ title: "Target lidlari", text: matn }); return; }
      catch { /* foydalanuvchi bekor qildi */ }
    }
    await nusxa(matn, "ulash");
  }

  /**
   * EXCEL — CSV, `﻿` (BOM) bilan.
   *
   * BOM SHART: usiz Excel faylni UTF-8 deb tanimaydi va o'zbekcha
   * harflar («o'», «g'») krakozyabraga aylanadi. Haqiqiy `.xlsx`
   * yozish uchun kutubxona kerak bo'lardi — loyihada faqat O'QIGICH
   * bor, va bitta eksport uchun 300 KB qo'shish arzimaydi.
   */
  function excel() {
    const qator = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      ["Ism", "Telefon", "Izoh", "Bosqich", "Mas'ul", "Sana"].map(qator).join(";"),
      ...amalUchun.map(l => [
        l.name, l.phone, l.note ?? "", l.stage?.name ?? "",
        l.assignedTo?.name ?? "", formatUzDate(l.createdAt),
      ].map(qator).join(";")),
    ].join("\r\n");
    yuklab(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), "csv");
  }

  async function pdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(14);
    doc.text("Target lidlari", 14, 16);
    doc.setFontSize(9);
    doc.text(`${amalUchun.length} ta · ${formatUzDate(new Date())}`, 14, 22);

    let y = 32;
    doc.setFontSize(10);
    for (const l of amalUchun) {
      // Sahifa to'lganda yangisini ochamiz — aks holda qatorlar
      // varaq chetidan chiqib, ko'rinmay qolardi.
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`${l.name} — ${l.phone}`, 14, y);
      y += 5;
      if (l.note) {
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(l.note, 180), 18, y);
        y += 5;
        doc.setFontSize(10);
      }
    }
    yuklab(doc.output("blob"), "pdf");
  }

  function yuklab(blob: Blob, ken: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `target-lidlar-${new Date().toISOString().slice(0, 10)}.${ken}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  return (
    <div className="p-5 space-y-4">

      {/* ── HAVOLA — eng tepada, chunki bu tabning birinchi ishi ── */}
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl shrink-0 grid place-items-center
            bg-indigo-100/70 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Link2 className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
              Reklama havolasi
            </p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Instagram/Facebook reklamasida shu havolani bering — forma to&apos;ldirilsa
              ariza shu yerga tushadi
            </p>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <code className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-neutral-100
                dark:bg-neutral-800 text-[12.5px] font-mono text-neutral-700
                dark:text-neutral-200 truncate">
                {havola || "—"}
              </code>
              <button type="button" disabled={!havola}
                onClick={() => nusxa(havola, "havola")}
                className={cn("h-9 px-3.5 rounded-xl text-[12.5px] font-semibold",
                  "flex items-center gap-1.5 transition-colors disabled:opacity-50",
                  nusxaOlindi === "havola"
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white")}>
                {nusxaOlindi === "havola"
                  ? <><Check className="w-3.5 h-3.5" />Nusxa olindi</>
                  : <><Copy className="w-3.5 h-3.5" />Nusxa olish</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── YO'RIQNOMA — havoladan KEYIN, ro'yxatdan OLDIN.
             Yig'ilgan holatda turadi, ya'ni har kungi ishga xalaqit
             bermaydi, lekin birinchi marta ochgan odam uni ko'radi. */}
      <TargetGuide />

      {/* ── QIDIRUV + AMALLAR ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Ism yoki telefon..."
            className="w-full h-9 pl-8 pr-3 rounded-xl glass-soft border border-white/60
              dark:border-white/10 text-[12.5px] text-neutral-700 dark:text-neutral-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>

        {/* Amallar BELGILANGANLAR ustida; hech biri belgilanmasa —
            ko'rinib turgan hammasi ustida. "Avval belgilang" deb
            to'xtatish ortiqcha qadam bo'lardi. */}
        {[
          { l: "Nusxa",  i: Copy,   f: () => nusxa(matnRoyxat(amalUchun), "royxat") },
          { l: "Yuborish", i: Share2, f: ulash },
          { l: "Excel",  i: Sheet,  f: excel },
          { l: "PDF",    i: FileText, f: pdf },
        ].map(a => {
          const I = a.i;
          const on = a.l === "Nusxa" && nusxaOlindi === "royxat";
          return (
            <button key={a.l} type="button" onClick={a.f}
              disabled={amalUchun.length === 0}
              className={cn("h-9 px-3 rounded-xl text-[12.5px] font-semibold",
                "flex items-center gap-1.5 border transition-colors disabled:opacity-40",
                on
                  ? "bg-green-600 text-white border-green-600"
                  : "glass-soft border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-indigo-400")}>
              {on ? <Check className="w-3.5 h-3.5" /> : <I className="w-3.5 h-3.5" />}
              {on ? "Olindi" : a.l}
            </button>
          );
        })}
      </div>

      {tanlangan.size > 0 && (
        <p className="text-[11.5px] text-indigo-600 dark:text-indigo-400 font-semibold -mt-1">
          {tanlangan.size} ta belgilandi — amallar faqat shularga tegishli
        </p>
      )}

      {/* ── RO'YXAT ── */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="glass-soft">
                <th className="px-3 py-2.5 w-9">
                  <input type="checkbox" checked={hammasiBelgilangan}
                    onChange={hammasini} aria-label="Hammasini belgilash"
                    className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                </th>
                {["Ism", "Telefon", "Izoh", "Bosqich", "Sana"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-[11px] font-bold uppercase
                    tracking-wider text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[12.5px] text-neutral-400">
                  Yuklanmoqda...
                </td></tr>
              )}

              {!isLoading && lidlar.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <Users className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                  <p className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
                    Hali ariza yo&apos;q
                  </p>
                  <p className="text-[12px] text-neutral-400 mt-1">
                    Yuqoridagi havolani reklamaga qo&apos;ying — arizalar shu yerga tushadi.
                  </p>
                </td></tr>
              )}

              {!isLoading && lidlar.length > 0 && korinadi.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[12.5px] text-neutral-400">
                  Qidiruv bo&apos;yicha topilmadi
                </td></tr>
              )}

              {korinadi.map(l => {
                const on = tanlangan.has(l.id);
                return (
                  <tr key={l.id}
                    onClick={() => belgila(l.id)}
                    className={cn("border-t border-white/50 dark:border-white/10 cursor-pointer transition-colors",
                      on ? "bg-indigo-50/70 dark:bg-indigo-950/30"
                         : "hover:bg-white/50 dark:hover:bg-white/5")}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" checked={on} readOnly tabIndex={-1}
                        className="w-4 h-4 accent-indigo-600 pointer-events-none" />
                    </td>
                    <td className="px-3 py-2.5 text-[12.5px] font-semibold
                      text-neutral-800 dark:text-neutral-100 whitespace-nowrap">
                      {l.name}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {/* Telefon bosilganda qo'ng'iroq — sotuvchining
                          asosiy ishi shu, va raqamni qo'lda terish
                          ortiqcha qadam edi. */}
                      <a href={`tel:${l.phone}`} onClick={e => e.stopPropagation()}
                        className="text-[12.5px] font-medium text-indigo-600 dark:text-indigo-400
                          hover:underline inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" />{l.phone || "—"}
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-neutral-500 dark:text-neutral-400
                      max-w-[220px] truncate">
                      {l.note || "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg
                        bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                        {l.stage?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-neutral-500
                      dark:text-neutral-400 whitespace-nowrap">
                      {formatUzDate(l.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
