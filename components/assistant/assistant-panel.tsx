"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUp, Check, Copy, FileText, MessageCircleQuestion, RotateCcw,
  Sparkles, Square, ThumbsDown, ThumbsUp, TriangleAlert, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { fetcher } from "@/lib/fetcher";
import { ChatMarkdown } from "./markdown";
import { takliflar } from "./suggestions";

/**
 * AI YORDAMCHI OYNASI (2026-10-02).
 *
 * Javob SSE oqimi bilan keladi (`/api/assistant/chat`): `delta` — matn
 * bo'lagi, `done` — jurnal id va manbalar, `error` — tushunarli xabar.
 * Suhbat `sessionStorage` da: sahifa almashganda ham, yangilanganda ham
 * yo'qolmaydi, brauzer yopilsa tozalanadi (boshqa xodim ko'rmasin).
 */

interface Manba { id: string; sarlavha: string; bolim: string; havola: string | null }
interface Xabar {
  id: string;
  role: "user" | "assistant";
  text: string;
  serverId?: string | null;
  sources?: Manba[];
  rating?: 1 | -1 | null;
  status?: "streaming" | "done" | "error" | "stopped";
  error?: string;
  truncated?: boolean;
}

const SAQLASH = "oneroom:assistant:v1";
const TARIX = 6;
const yangiId = () => Math.random().toString(36).slice(2, 10);

function yukla(): Xabar[] {
  try {
    const raw = sessionStorage.getItem(SAQLASH);
    const arr = raw ? (JSON.parse(raw) as Xabar[]) : [];
    return arr.map((m) => (m.status === "streaming" ? { ...m, status: "stopped" as const } : m));
  } catch {
    return [];
  }
}

/** SSE javobini o'qiydi: `event:` + `data:` juftlari, `:` bilan boshlangan izohlar (ping) tashlanadi. */
interface SseData {
  t?: string;
  id?: string | null;
  sources?: Manba[];
  truncated?: boolean;
  message?: string;
}

async function* sseHodisalar(res: Response): AsyncGenerator<{ event: string; data: SseData }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let i: number;
    while ((i = buf.indexOf("\n\n")) !== -1) {
      const blok = buf.slice(0, i);
      buf = buf.slice(i + 2);
      let event = "message";
      const data: string[] = [];
      for (const l of blok.split("\n")) {
        if (l.startsWith("event:")) event = l.slice(6).trim();
        else if (l.startsWith("data:")) data.push(l.slice(5).trim());
      }
      if (!data.length) continue;
      let parsed: SseData;
      try { parsed = JSON.parse(data.join("\n")) as SseData; } catch { continue; /* buzuq bo'lak */ }
      yield { event, data: parsed };
    }
  }
}

function Avatar({ katta }: { katta?: boolean }) {
  return (
    <div className={cn(
      "shrink-0 grid place-items-center text-white bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-md shadow-indigo-500/25",
      katta ? "w-14 h-14 rounded-3xl" : "w-7 h-7 rounded-xl",
    )}>
      <Sparkles className={katta ? "w-7 h-7" : "w-3.5 h-3.5"} />
    </div>
  );
}

function Yozmoqda() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Yozmoqda">
      {[0, 150, 300].map((d) => (
        <span key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { me } = useMe();
  const [xabarlar, setXabarlar] = useState<Xabar[]>(() => (typeof window === "undefined" ? [] : yukla()));
  const [matn, setMatn] = useState("");
  const [oqim, setOqim] = useState(false);
  // Kunlik qoldiq — oyna ochiq bo'lganda so'raladi, har javobdan keyin yangilanadi.
  const { data: limit, mutate: limitniYangila } = useSWR<{ usedToday: number; perDay: number }>(
    open ? "/api/assistant/status" : null, fetcher, { revalidateOnFocus: false });
  const [nusxa, setNusxa] = useState<string | null>(null);
  const ac = useRef<AbortController | null>(null);
  const pastki = useRef<HTMLDivElement>(null);
  const ichki = useRef<HTMLDivElement>(null);
  const kiritma = useRef<HTMLTextAreaElement>(null);
  const yopishgan = useRef(true);

  const ism = me?.name?.trim().split(/\s+/)[0];
  const savollar = useMemo(
    () => takliflar(pathname, (k) => hasPerm(me?.permissions, k)),
    [pathname, me?.permissions],
  );

  // Saqlash — oqim bo'laklarida ham, lekin yengil (bir necha KB).
  useEffect(() => {
    try { sessionStorage.setItem(SAQLASH, JSON.stringify(xabarlar.slice(-30))); } catch { /* to'lgan yoki yopiq */ }
  }, [xabarlar]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => kiritma.current?.focus(), 120);
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => { clearTimeout(t); window.removeEventListener("keydown", esc); };
  }, [open, onClose]);

  // Pastga yopishib turish — foydalanuvchi o'zi yuqoriga aylantirmagan bo'lsa.
  useEffect(() => {
    if (yopishgan.current) pastki.current?.scrollIntoView({ block: "end" });
  }, [xabarlar]);

  const onScroll = () => {
    const el = ichki.current;
    if (el) yopishgan.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const yangila = (id: string, f: (m: Xabar) => Xabar) =>
    setXabarlar((arr) => arr.map((m) => (m.id === id ? f(m) : m)));

  const yubor = useCallback(async (savolRaw: string) => {
    const savol = savolRaw.trim();
    if (!savol || oqim) return;
    const tarix = xabarlar
      .filter((m) => m.status !== "error" && m.text.trim())
      .slice(-TARIX)
      .map((m) => ({ role: m.role, text: m.text }));
    const javobId = yangiId();
    setXabarlar((arr) => [
      ...arr,
      { id: yangiId(), role: "user", text: savol, status: "done" },
      { id: javobId, role: "assistant", text: "", status: "streaming" },
    ]);
    setMatn("");
    setOqim(true);
    yopishgan.current = true;
    const ctrl = new AbortController();
    ac.current = ctrl;

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: savol, history: tarix, pathname }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        const xabar = res.status === 404
          ? "Yordamchi hozircha markazingiz uchun yoqilmagan."
          : d?.error ?? "Yordamchi javob bera olmadi. Birozdan keyin qayta urinib ko'ring.";
        yangila(javobId, (m) => ({ ...m, status: "error", error: xabar }));
        return;
      }
      for await (const { event, data } of sseHodisalar(res)) {
        if (event === "delta" && typeof data?.t === "string") {
          yangila(javobId, (m) => ({ ...m, text: m.text + data.t }));
        } else if (event === "done") {
          yangila(javobId, (m) => ({
            ...m, status: "done", serverId: data?.id ?? null,
            sources: Array.isArray(data?.sources) ? data.sources : [], truncated: !!data?.truncated,
          }));
        } else if (event === "error") {
          yangila(javobId, (m) => ({ ...m, status: "error", error: data?.message ?? "Xatolik yuz berdi" }));
        }
      }
      // Oqim "done"siz yopilsa (ulanish uzildi) — bor matn qoladi.
      yangila(javobId, (m) => (m.status === "streaming" ? { ...m, status: m.text ? "stopped" : "error", error: m.text ? undefined : "Ulanish uzildi. Qayta urinib ko'ring." } : m));
    } catch (e) {
      const toxtatildi = (e as Error)?.name === "AbortError";
      yangila(javobId, (m) => ({
        ...m,
        status: toxtatildi ? "stopped" : "error",
        error: toxtatildi ? undefined : "Serverga ulanib bo'lmadi. Internetni tekshiring.",
      }));
    } finally {
      setOqim(false);
      ac.current = null;
      void limitniYangila();
    }
  }, [oqim, xabarlar, pathname, limitniYangila]);

  const toxtat = () => ac.current?.abort();

  const yangiSuhbat = () => {
    ac.current?.abort();
    setXabarlar([]);
    setMatn("");
    kiritma.current?.focus();
  };

  const qaytaUrin = (javobId: string) => {
    const i = xabarlar.findIndex((m) => m.id === javobId);
    const savol = i > 0 ? xabarlar[i - 1] : null;
    if (!savol || savol.role !== "user") return;
    setXabarlar((arr) => arr.filter((_, j) => j !== i && j !== i - 1));
    void yubor(savol.text);
  };

  const baho = async (m: Xabar, r: 1 | -1) => {
    if (!m.serverId) return;
    const yangi = m.rating === r ? null : r;
    yangila(m.id, (x) => ({ ...x, rating: yangi }));
    try {
      await fetch("/api/assistant/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: m.serverId, rating: yangi ?? 0 }),
      });
    } catch { /* baho ixtiyoriy */ }
  };

  const nusxala = async (m: Xabar) => {
    try {
      await navigator.clipboard.writeText(m.text);
      setNusxa(m.id);
      setTimeout(() => setNusxa(null), 1500);
    } catch { /* ruxsat yo'q */ }
  };

  const manbagaOt = (s: Manba) => {
    if (!s.havola) return;
    router.push(s.havola);
    if (window.matchMedia("(max-width: 1023px)").matches) onClose();
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void yubor(matn);
    }
  };

  // Matn maydoni balandligi — 1 dan 5 qatorgacha o'sadi.
  useEffect(() => {
    const el = kiritma.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [matn]);

  const qolgan = typeof limit?.perDay === "number" ? Math.max(0, limit.perDay - (limit.usedToday ?? 0)) : null;

  return (
    <div
      role="dialog"
      aria-label="OneRoom yordamchi"
      aria-hidden={!open}
      className={cn(
        // Deyarli to'liq qoplama: `glass-strong` (85%) da orqadagi sahifa matni
        // javob ostidan o'qilib turardi, ayniqsa telefonda.
        "fixed z-[80] flex flex-col overflow-hidden bg-white/[0.97] dark:bg-[rgba(20,18,26,0.97)] backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl shadow-indigo-950/10",
        "inset-x-0 bottom-0 top-10 rounded-t-3xl",
        "lg:inset-auto lg:bottom-24 lg:right-6 lg:w-[420px] lg:h-[min(660px,calc(100dvh-8rem))] lg:rounded-3xl",
        open ? "animate-in fade-in slide-in-from-bottom-4 duration-200" : "hidden",
      )}
    >
      {/* Sarlavha */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/50 dark:border-white/10">
        <Avatar />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">OneRoom yordamchi</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Tizim bo&apos;yicha savollarga javob beradi
          </p>
        </div>
        {xabarlar.length > 0 && (
          <button type="button" onClick={yangiSuhbat} title="Yangi suhbat"
            className="w-8 h-8 grid place-items-center rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <button type="button" onClick={onClose} title="Yopish"
          className="w-8 h-8 grid place-items-center rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suhbat */}
      <div ref={ichki} onScroll={onScroll} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {xabarlar.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-6">
            <Avatar katta />
            <h3 className="mt-4 text-[17px] font-semibold text-neutral-900 dark:text-neutral-100">
              Salom{ism ? `, ${ism}` : ""}!
            </h3>
            <p className="mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              OneRoom&apos;dan foydalanish bo&apos;yicha so&apos;rang: qaysi tugma qayerda, tizim nima qiladi, xato xabari nimani anglatadi.
            </p>
            {savollar.length > 0 && (
              <div className="mt-6 w-full space-y-2">
                {savollar.map((q) => (
                  <button key={q} type="button" data-taklif onClick={() => void yubor(q)}
                    className="group w-full flex items-center gap-2.5 rounded-2xl glass-soft border border-white/60 dark:border-white/10 px-3.5 py-2.5 text-left text-[13px] text-neutral-700 dark:text-neutral-200 hover:border-indigo-300 dark:hover:border-indigo-400/40 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    <MessageCircleQuestion className="w-4 h-4 shrink-0 text-indigo-500" />
                    <span className="flex-1">{q}</span>
                    <ArrowUp className="w-3.5 h-3.5 rotate-45 text-neutral-300 group-hover:text-indigo-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {xabarlar.map((m) => m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div data-savol className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 py-2 text-[13.5px] leading-relaxed text-white shadow-sm">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-2.5">
                <Avatar />
                <div className="flex-1 min-w-0">
                  {m.status === "error" ? (
                    <div className="rounded-2xl rounded-tl-md border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-500/10 px-3.5 py-2.5 text-[13px] text-amber-800 dark:text-amber-200">
                      <div className="flex gap-2">
                        <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{m.error}</span>
                      </div>
                      <button type="button" onClick={() => qaytaUrin(m.id)}
                        className="mt-2 ml-6 text-[12px] font-semibold text-amber-900 dark:text-amber-100 underline-offset-2 hover:underline">
                        Qayta urinish
                      </button>
                    </div>
                  ) : (
                    <div data-javob className="rounded-2xl rounded-tl-md border border-white/70 dark:border-white/10 bg-white/85 dark:bg-white/5 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-neutral-700 dark:text-neutral-200 shadow-sm break-words">
                      {m.text ? <ChatMarkdown text={m.text} /> : <Yozmoqda />}
                      {m.status === "streaming" && m.text && (
                        <span className="mt-1 block"><Yozmoqda /></span>
                      )}
                      {m.status === "stopped" && (
                        <p className="mt-2 text-[11px] text-neutral-400">To&apos;xtatildi</p>
                      )}
                      {m.truncated && (
                        <p className="mt-2 text-[11px] text-neutral-400">Javob qisqartirildi — savolni aniqroq bering.</p>
                      )}
                    </div>
                  )}

                  {m.status === "done" && (m.sources?.length ?? 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.sources!.map((s) => (
                        <button key={s.id} type="button" data-manba onClick={() => manbagaOt(s)} title={s.bolim}
                          disabled={!s.havola}
                          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:cursor-default transition-colors">
                          <FileText className="w-3 h-3" />
                          <span className="max-w-[200px] truncate">{s.sarlavha}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {m.status === "done" && m.text && (
                    <div className="mt-1.5 flex items-center gap-0.5">
                      <button type="button" onClick={() => void nusxala(m)} title="Nusxa olish"
                        className="w-7 h-7 grid place-items-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-white/60 dark:hover:bg-white/10 dark:hover:text-neutral-200 transition-colors">
                        {nusxa === m.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {m.serverId && (
                        <>
                          <button type="button" onClick={() => void baho(m, 1)} title="Foydali"
                            className={cn("w-7 h-7 grid place-items-center rounded-lg transition-colors hover:bg-white/60 dark:hover:bg-white/10",
                              m.rating === 1 ? "text-emerald-600" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200")}>
                            <ThumbsUp className={cn("w-3.5 h-3.5", m.rating === 1 && "fill-current")} />
                          </button>
                          <button type="button" onClick={() => void baho(m, -1)} title="Foydasiz"
                            className={cn("w-7 h-7 grid place-items-center rounded-lg transition-colors hover:bg-white/60 dark:hover:bg-white/10",
                              m.rating === -1 ? "text-rose-600" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200")}>
                            <ThumbsDown className={cn("w-3.5 h-3.5", m.rating === -1 && "fill-current")} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={pastki} />
      </div>

      {/* Yozish */}
      <div className="border-t border-white/50 dark:border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2 rounded-2xl border border-white/70 dark:border-white/10 bg-white/85 dark:bg-white/5 px-3 py-2 shadow-sm focus-within:border-indigo-300 dark:focus-within:border-indigo-400/40 transition-colors">
          <textarea
            ref={kiritma}
            rows={1}
            value={matn}
            onChange={(e) => setMatn(e.target.value)}
            onKeyDown={onKey}
            maxLength={2000}
            placeholder="Savolingizni yozing…"
            className="flex-1 resize-none bg-transparent py-1 text-[13.5px] leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none"
          />
          {oqim ? (
            <button type="button" onClick={toxtat} title="To'xtatish"
              className="w-8 h-8 shrink-0 grid place-items-center rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 transition-transform active:scale-95">
              <Square className="w-3 h-3 fill-current" />
            </button>
          ) : (
            <button type="button" onClick={() => void yubor(matn)} disabled={!matn.trim()} title="Yuborish"
              className="w-8 h-8 shrink-0 grid place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-35 disabled:shadow-none">
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3 px-1 text-[10.5px] text-neutral-400">
          <span>Javoblar OneRoom qo&apos;llanmasidan. Shaxsiy ma&apos;lumot yozmang.</span>
          {qolgan !== null && <span className="shrink-0">Bugun {qolgan} ta qoldi</span>}
        </div>
      </div>
    </div>
  );
}
