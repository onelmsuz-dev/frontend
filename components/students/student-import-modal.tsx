"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { parseDelimited, mapRows, toCsv, downloadFile, type MappedRow } from "@/lib/csv";
import { readTable } from "@/lib/xlsx";
import { Upload, FileDown, AlertCircle, CheckCircle2, CircleAlert, Copy } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  groups: { id: string; name: string; course?: { name?: string } }[];
}

interface RowResult {
  row: number; name: string; phone: string;
  outcome: "created" | "duplicate" | "error";
  message?: string;
}

const selectCls =
  "w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10 " +
  "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none " +
  "focus:border-indigo-500 transition-colors";

const TEMPLATE_HEADERS = ["Ism", "Telefon", "Ota-ona telefoni", "Ota-ona ismi", "Maktab", "Jinsi", "Guruh"];
const TEMPLATE_SAMPLE = [
  ["Alisher Soipov", "998951236575", "998182735687", "Sobir aka", "12-maktab", "Erkak", "Rus tili guruhi"],
  ["Dilnoza Karimova", "998901234567", "", "", "", "Ayol", ""],
];

/**
 * O'QUVCHILARNI OMMAVIY QO'SHISH.
 *
 * Ikki yo'l bilan: fayl tanlash (.xlsx yoki .csv) yoki Google
 * Sheets/Excel'dan to'g'ridan-to'g'ri Ctrl+V. Ikkinchisi amalda ko'proq
 * kerak bo'ladi — markazda ma'lumot odatda Sheets'da turadi va uni
 * faylga eksport qilib o'tirish qo'shimcha qadam.
 *
 * Yuborishdan OLDIN nima o'qilgani ko'rsatiladi: 300 qatorlik jadvalni
 * ko'r-ko'rona yuborib, keyin "nega ismlar telefon ustuniga tushib qolgan"
 * deb tuzatib o'tirmaslik uchun.
 */
export function StudentImportModal({ open, onClose, onDone, groups }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [raw,      setRaw]      = useState("");
  const [rows,     setRows]     = useState<MappedRow[]>([]);
  const [matched,  setMatched]  = useState<string[]>([]);
  const [headerless, setHeaderless] = useState(false);
  const [groupId,  setGroupId]  = useState("");
  const [activate, setActivate] = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");
  const [results,  setResults]  = useState<RowResult[] | null>(null);
  const [summary,  setSummary]  = useState<{ created: number; duplicates: number; errors: number } | null>(null);

  function reset() {
    setRaw(""); setRows([]); setMatched([]); setHeaderless(false);
    setErr(""); setResults(null); setSummary(null);
  }
  function closeAll() { reset(); onClose(); }

  /** Tayyor jadvalni qabul qiladi — manbasi fayl ham, Ctrl+V ham bo'lishi mumkin. */
  function ingestTable(table: string[][]) {
    setErr(""); setResults(null); setSummary(null);
    const parsed = mapRows(table);
    setRows(parsed.rows);
    setMatched(parsed.matched);
    setHeaderless(parsed.headerless);
  }

  function ingest(text: string) {
    setRaw(text);
    ingestTable(parseDelimited(text));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    // Bir xil faylni qayta tanlash ham hodisa chiqarsin.
    e.target.value = "";
    if (!f) return;
    try {
      // `.xlsx` — ZIP arxiv. Ilgari u `f.text()` bilan o'qilardi va
      // natija jimgina bo'sh chiqardi: foydalanuvchi "Excel" deb
      // yozilganini o'qib, faylni tanlab, hech narsa bo'lmasligini
      // ko'rardi. Endi kengaytmaga qarab to'g'ri o'qigich tanlanadi.
      const table = await readTable(f, parseDelimited);
      // Ctrl+V maydonida ham ko'rinsin — odam nima o'qilganini
      // tekshira olishi va tuzata olishi uchun.
      setRaw(toCsv(table[0] ?? [], table.slice(1)));
      ingestTable(table);
    } catch (e) {
      setErr((e as Error).message || "Faylni o'qib bo'lmadi");
    }
  }

  function downloadTemplate() {
    downloadFile("oquvchilar-namuna.csv", toCsv(TEMPLATE_HEADERS, TEMPLATE_SAMPLE));
  }

  const valid = rows.filter(r => r.name.trim().length >= 2 && r.phone.replace(/\D/g, "").length >= 9);
  const invalid = rows.length - valid.length;

  async function submit() {
    if (valid.length === 0) { setErr("Yuborish uchun to'g'ri qator yo'q"); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/students/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: valid.slice(0, 1000),
          ...(groupId ? { groupId } : {}),
          activate,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Xatolik"); return; }
      setSummary(data.summary);
      setResults(data.results ?? []);
      onDone();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  const done = summary !== null;

  return (
    <Modal
      open={open}
      onClose={closeAll}
      size="lg"
      title="O'quvchilarni import qilish"
      subtitle={done ? "Natija" : "Excel yoki Google Sheets'dan"}
      footer={
        done ? (
          <Button onClick={closeAll} className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px]">
            Yopish
          </Button>
        ) : (
          <>
            <Button onClick={submit} disabled={busy || valid.length === 0}
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
              {busy ? "Yuklanmoqda..." : valid.length > 0 ? `${valid.length} ta o'quvchini qo'shish` : "Qo'shish"}
            </Button>
            <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={closeAll}>Bekor</Button>
          </>
        )
      }
    >
      {done ? (
        <ImportResult summary={summary!} results={results ?? []} />
      ) : (
        <>
          {/* Manba */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-semibold
                         bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400
                         hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Excel yoki CSV tanlash
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.csv,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onFile} className="hidden" />
            <button type="button" onClick={downloadTemplate}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-semibold
                         glass-soft text-neutral-600 dark:text-neutral-300
                         hover:bg-white/70 dark:hover:bg-white/10 transition-colors">
              <FileDown className="w-3.5 h-3.5" /> Namuna faylni yuklab olish
            </button>
          </div>

          <FormField
            label="Yoki jadvaldan nusxalab qo'ying"
            hint="Google Sheets / Excel'dan kerakli kataklarni belgilab Ctrl+C, keyin bu yerga Ctrl+V"
          >
            <Textarea rows={5} value={raw} onChange={e => ingest(e.target.value)}
              className="font-mono text-[12px]"
              placeholder={"Ism\tTelefon\tOta-ona telefoni\nAlisher Soipov\t998951236575\t998182735687"} />
          </FormField>

          {/* Nima o'qildi */}
          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">
                  {valid.length}{" "}ta qator o&apos;qildi
                </span>
                {invalid > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold">
                    {invalid}{" "}ta qator to&apos;liq emas — o&apos;tkazib yuboriladi
                  </span>
                )}
                {matched.length > 0 && (
                  <span className="text-neutral-400">
                    Tanilgan ustunlar: {matched.map(m => FIELD_LABELS[m] ?? m).join(", ")}
                  </span>
                )}
              </div>

              {headerless && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-2.5">
                  <CircleAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-700 dark:text-amber-400">
                    Sarlavha qatori topilmadi — <strong>1-ustun ism</strong>, <strong>2-ustun telefon</strong>,
                    3-ustun ota-ona telefoni deb o&apos;qildi. Quyidagi jadvalni tekshiring.
                  </p>
                </div>
              )}

              <PreviewTable rows={rows.slice(0, 6)} total={rows.length} />
            </>
          )}

          {/* Sozlamalar */}
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Hammasini shu guruhga" hint="Ixtiyoriy — jadvaldagi «Guruh» ustuni ustun turadi">
              <select value={groupId} onChange={e => setGroupId(e.target.value)} className={selectCls}>
                <option value="">— Guruhsiz</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}{g.course?.name ? ` — ${g.course.name}` : ""}</option>
                ))}
              </select>
            </FormField>
            <FormField label="A'zolik holati">
              <div className="flex gap-1.5">
                {[
                  { v: false, l: "Sinov", note: "pul yozilmaydi" },
                  { v: true,  l: "Faol",  note: "kurs to'lovi yoziladi" },
                ].map(o => (
                  <button key={String(o.v)} type="button" onClick={() => setActivate(o.v)}
                    className={cn("flex-1 h-10 rounded-xl border text-[12px] font-semibold transition-all",
                      activate === o.v
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "glass-panel text-neutral-600 dark:text-neutral-300 border-white/60 dark:border-white/10 hover:border-neutral-400")}>
                    {o.l}
                    <span className="block text-[10px] font-normal opacity-70">{o.note}</span>
                  </button>
                ))}
              </div>
            </FormField>
          </div>

          <div className="flex items-start gap-2 glass-soft rounded-xl px-3 py-2.5">
            <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
              Ro&apos;yxatda allaqachon bor telefon raqamlar <strong>o&apos;tkazib yuboriladi</strong> —
              bir xil faylni ikki marta yuklash xavfsiz.
            </p>
          </div>

          {err && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{err}</p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

const FIELD_LABELS: Record<string, string> = {
  name: "Ism", phone: "Telefon", parentPhone: "Ota-ona tel", parentName: "Ota-ona ismi",
  school: "Maktab", source: "Manba", gender: "Jinsi", groupName: "Guruh",
};

function PreviewTable({ rows, total }: { rows: MappedRow[]; total: number }) {
  return (
    <div className="rounded-xl border border-white/60 dark:border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="glass-soft text-left">
              {["Ism", "Telefon", "Ota-ona", "Guruh"].map(h => (
                <th key={h} className="px-3 py-2 font-bold text-[10px] uppercase tracking-wider text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {rows.map((r, i) => {
              const bad = r.name.trim().length < 2 || r.phone.replace(/\D/g, "").length < 9;
              return (
                <tr key={i} className={cn(bad && "bg-amber-50/60 dark:bg-amber-900/10")}>
                  <td className="px-3 py-1.5 text-neutral-800 dark:text-neutral-200">{r.name || "—"}</td>
                  <td className="px-3 py-1.5 text-neutral-600 dark:text-neutral-400">{r.phone || "—"}</td>
                  <td className="px-3 py-1.5 text-neutral-500">{r.parentPhone || "—"}</td>
                  <td className="px-3 py-1.5 text-neutral-500">{r.groupName || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {total > rows.length && (
        <p className="px-3 py-1.5 text-[11px] text-neutral-400 glass-soft">
          …va yana {total - rows.length} ta qator
        </p>
      )}
    </div>
  );
}

function ImportResult({ summary, results }: {
  summary: { created: number; duplicates: number; errors: number };
  results: RowResult[];
}) {
  const problems = results.filter(r => r.outcome !== "created");
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Qo'shildi",  v: summary.created,    cls: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
          { l: "Dublikat",   v: summary.duplicates, cls: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
          { l: "Xato",       v: summary.errors,     cls: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
        ].map(s => (
          <div key={s.l} className={cn("rounded-xl px-3 py-3 text-center", s.cls)}>
            <p className="text-[22px] font-black leading-none">{s.v}</p>
            <p className="text-[11px] mt-1 opacity-80">{s.l}</p>
          </div>
        ))}
      </div>

      {summary.created > 0 && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <p className="text-[12px] font-medium text-green-700 dark:text-green-400">
            {summary.created}{" "}ta o&apos;quvchi ro&apos;yxatga qo&apos;shildi
          </p>
        </div>
      )}

      {problems.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
            O&apos;tkazib yuborilganlar
          </p>
          <div className="rounded-xl border border-white/60 dark:border-white/10 divide-y divide-neutral-100 dark:divide-neutral-800 max-h-56 overflow-y-auto">
            {problems.map(r => (
              <div key={r.row} className="flex items-start justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-neutral-700 dark:text-neutral-200 truncate">
                    {r.row}. {r.name || "(ismsiz)"}
                  </p>
                  <p className="text-[11px] text-neutral-400">{r.phone}</p>
                </div>
                <span className={cn("text-[11px] shrink-0 text-right",
                  r.outcome === "duplicate" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                  {r.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
