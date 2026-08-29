"use client";

import { useRef, useState } from "react";
import { mutate } from "swr";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { parseDelimited, mapLeadRows, toCsv, downloadFile, type MappedLead } from "@/lib/csv";
import { readTable } from "@/lib/xlsx";
import { SourcePicker } from "./source-picker";
import { Upload, FileDown, AlertCircle, CheckCircle2, CircleAlert, GraduationCap } from "lucide-react";

/**
 * LIDLARNI OMMAVIY QO'SHISH.
 *
 * ASOSIY HOLAT — MAKTAB TASHRIFI. Markaz maktabga boradi, 200-300
 * bolaning ro'yxatini yig'adi, ba'zan test o'tkazadi. Shu ro'yxat
 * Excel'da bo'ladi va uni bittalab kiritish real emas.
 *
 * Ikki narsa ataylab yumshatilgan:
 *
 *  • TELEFON MAJBURIY EMAS. Maktabdagi bolalarning ko'pida telefon
 *    yo'q. Majburiy qilsak, ro'yxatning yarmi kirmasdi.
 *  • BALL USTUNLARI o'zi tanib olinadi. "Matematika", "Ona tili"
 *    kabi sonli ustunlar lid kartochkasida saqlanadi.
 *
 * Yuborishdan OLDIN nima o'qilgani ko'rsatiladi — 300 qatorni
 * ko'r-ko'rona yuborib, keyin tozalab o'tirmaslik uchun.
 */

const TEMPLATE_HEADERS = ["Ism", "Telefon", "Maktab", "Sinf", "Izoh"];
const TEMPLATE_SAMPLE = [
  ["Alisher Soipov", "998951236575", "12-maktab", "9-A", "Matematikaga qiziqadi"],
  ["Dilnoza Karimova", "", "12-maktab", "9-A", ""],
];

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

interface ImportSummary {
  created: number;
  duplicates: number;
  skipped: number;
}

export function LeadImportModal({ open, onClose, onDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [raw,     setRaw]     = useState("");
  const [rows,    setRows]    = useState<MappedLead[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [scoreCols, setScoreCols] = useState<string[]>([]);
  const [headerless, setHeaderless] = useState(false);
  const [source,  setSource]  = useState("Maktab tashrifi");
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  function reset() {
    setRaw(""); setRows([]); setMatched([]); setScoreCols([]);
    setHeaderless(false); setErr(""); setSummary(null);
  }
  function closeAll() { reset(); onClose(); }

  function ingestTable(table: string[][]) {
    setErr(""); setSummary(null);
    const p = mapLeadRows(table);
    setRows(p.rows); setMatched(p.matched);
    setScoreCols(p.scoreColumns); setHeaderless(p.headerless);
  }

  function ingest(text: string) {
    setRaw(text);
    ingestTable(parseDelimited(text));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";     // bir xil faylni qayta tanlash ham ishlasin
    if (!f) return;
    try {
      const table = await readTable(f, parseDelimited);
      setRaw(toCsv(table[0] ?? [], table.slice(1)));
      ingestTable(table);
    } catch (e) {
      setErr((e as Error).message || "Faylni o'qib bo'lmadi");
    }
  }

  async function submit() {
    if (rows.length === 0) { setErr("Yuborish uchun qator yo'q"); return; }
    if (!source.trim())    { setErr("Manba tanlang"); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: source.trim(), rows: rows.slice(0, 1000) }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Xatolik"); return; }
      setSummary(data.summary ?? data);
      mutate("/api/leads");
      onDone();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  const withPhone = rows.filter((r) => (r.phone ?? "").replace(/\D/g, "").length >= 9).length;
  const capped = rows.length > 1000;

  return (
    <Modal open={open} onClose={closeAll} size="lg"
      title="Lidlarni import qilish"
      subtitle={summary ? "Natija" : "Excel yoki Google Sheets'dan"}
      footer={
        summary ? (
          <>
            <Button onClick={closeAll}
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px]">
              Yopish
            </Button>
            <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={reset}>
              Yana import
            </Button>
          </>
        ) : (
          <>
            <Button onClick={submit} disabled={busy || rows.length === 0}
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
              {busy ? "Yuborilmoqda…"
                    : rows.length > 0 ? `${Math.min(rows.length, 1000)} ta lidni qo'shish`
                                      : "Qo'shish"}
            </Button>
            <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={closeAll}>
              Bekor
            </Button>
          </>
        )
      }>
      {summary ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div className="text-[13px] leading-relaxed">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {summary.created}{" "}ta lid qo&apos;shildi
              </p>
              {(summary.duplicates > 0 || summary.skipped > 0) && (
                <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                  {summary.duplicates > 0 && `${summary.duplicates} ta takror (shu telefon allaqachon bor)`}
                  {summary.duplicates > 0 && summary.skipped > 0 && " · "}
                  {summary.skipped > 0 && `${summary.skipped} ta o'tkazib yuborildi`}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Manba */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-semibold
                         bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400
                         hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Excel yoki CSV tanlash
            </button>
            <input ref={fileRef} type="file" onChange={onFile} className="hidden"
              accept=".xlsx,.csv,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
            <button type="button"
              onClick={() => downloadFile("lidlar-namuna.csv", toCsv(TEMPLATE_HEADERS, TEMPLATE_SAMPLE))}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-semibold
                         glass-soft text-neutral-600 dark:text-neutral-300
                         hover:bg-white/70 dark:hover:bg-white/10 transition-colors">
              <FileDown className="w-3.5 h-3.5" /> Namuna
            </button>
          </div>

          <FormField label="Jadvaldan nusxa"
            hint="Google Sheets / Excel'dan kataklarni belgilab Ctrl+C, keyin bu yerga Ctrl+V">
            <Textarea rows={4} value={raw}
              onChange={(e) => ingest(e.target.value)}
              placeholder={"Ism\tTelefon\tMaktab\tSinf\nAli Valiyev\t998901234567\t12-maktab\t9-A"} />
          </FormField>

          <FormField label="Bu ro'yxat qayerdan keldi?">
            <SourcePicker value={source} onChange={setSource} disabled={busy} />
          </FormField>

          {/* O'qilgani */}
          {rows.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {rows.length}{" "}ta qator o&apos;qildi
                </span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {withPhone} tasida telefon bor
                </span>
              </div>

              {headerless && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <CircleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-px" />
                  <p className="text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Sarlavha qatori topilmadi — birinchi ustun <b>ism</b>,
                    ikkinchisi <b>telefon</b> deb olindi. Quyidagi jadvalni
                    tekshiring.
                  </p>
                </div>
              )}

              {scoreCols.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-px" />
                  <p className="text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Ball ustunlari deb olindi:{" "}
                    <b>{scoreCols.join(", ")}</b>. Ular lid kartochkasida saqlanadi.
                  </p>
                </div>
              )}

              {capped && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <CircleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-px" />
                  <p className="text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Bir martada 1000 tadan yuboriladi — birinchi 1000 tasi
                    ketadi, qolganini keyin yana yuklang.
                  </p>
                </div>
              )}

              {/* Dastlabki qatorlar */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/60">
                      <tr className="text-left text-neutral-500 dark:text-neutral-400">
                        <th className="px-2.5 py-1.5 font-semibold">Ism</th>
                        <th className="px-2.5 py-1.5 font-semibold">Telefon</th>
                        {matched.includes("school") && <th className="px-2.5 py-1.5 font-semibold">Maktab</th>}
                        {matched.includes("grade")  && <th className="px-2.5 py-1.5 font-semibold">Sinf</th>}
                        {scoreCols.map((c) => (
                          <th key={c} className="px-2.5 py-1.5 font-semibold whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 6).map((r, i) => (
                        <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                          <td className="px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100">{r.name}</td>
                          <td className={cn("px-2.5 py-1.5 tabular-nums",
                            r.phone ? "text-neutral-600 dark:text-neutral-300"
                                    : "text-neutral-300 dark:text-neutral-600")}>
                            {r.phone || "—"}
                          </td>
                          {matched.includes("school") && (
                            <td className="px-2.5 py-1.5 text-neutral-600 dark:text-neutral-300">{r.school || "—"}</td>
                          )}
                          {matched.includes("grade") && (
                            <td className="px-2.5 py-1.5 text-neutral-600 dark:text-neutral-300">{r.grade || "—"}</td>
                          )}
                          {scoreCols.map((c) => (
                            <td key={c} className="px-2.5 py-1.5 tabular-nums text-neutral-600 dark:text-neutral-300">
                              {r.scores?.[c] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 6 && (
                  <p className="px-2.5 py-1.5 text-[11px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
                    …va yana {rows.length - 6} ta
                  </p>
                )}
              </div>
            </div>
          )}

          {err && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-px" />
              <p className="text-[12px] text-red-700 dark:text-red-300">{err}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
