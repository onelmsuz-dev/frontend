"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { useMetaStatus } from "@/lib/hooks/useMeta";
import {
  Radio, Loader2, AlertCircle, CheckCircle2, Unlink, ExternalLink,
} from "lucide-react";

/**
 * FACEBOOK/INSTAGRAM LEAD ADS — MARKAZ TOMONI.
 *
 * Ilgari lidlar FAQAT qo'lda yoki Excel import bilan kirardi — Instagram
 * reklamasidan kelgan so'rovlar Facebook'ning o'zida qolib, hech kim
 * ko'rmasdan sovib ketardi. Bu panel markazga o'z Facebook sahifasini
 * bir marta ulashga imkon beradi; shundan keyin har yangi ariza avtomatik
 * taxtaga tushadi.
 *
 * `useSearchParams` Suspense chegarasini talab qiladi — shuning uchun
 * asl komponent shunchaki wrapper, ichki qism Suspense ostida.
 */
export function MetaIntegrationPanel() {
  return (
    <Suspense fallback={null}>
      <MetaIntegrationContent />
    </Suspense>
  );
}

function MetaIntegrationContent() {
  const { data: status, isLoading } = useMetaStatus();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [err, setErr] = useState("");
  const [banner, setBanner] = useState<"cancelled" | "error" | null>(null);

  // Callback'dan qaytgandagi holat — URL'dan bir martalik o'qiladi,
  // keyin darhol tozalanadi (aks holda sahifa yangilansa qayta chiqaverardi).
  const [choosingPage, setChoosingPage] = useState(false);
  const [pages, setPages] = useState<{ id: string; name: string }[] | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    setErr("");
    try {
      const r = await fetch("/api/meta/pages");
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Sahifalar olinmadi");
      setPages(j);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    const meta = searchParams.get("meta");
    if (!meta) return;
    router.replace("/leads", { scroll: false });
    // Bir martalik URL query'dan holat sinxronlashtirish — Meta OAuth
    // callback shu tarzda qaytadi. `loadPages()` tashqi so'rov boshlaydi,
    // bu yerdagi `setState` esa shunga hozirlik.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (meta === "choose-page") { setChoosingPage(true); loadPages(); }
    else if (meta === "cancelled") setBanner("cancelled");
    else if (meta === "error") setBanner("error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function connect() {
    setConnecting(true); setErr("");
    try {
      const r = await fetch("/api/meta/connect");
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Ulanib bo'lmadi");
      // TO'LIQ SAHIFA NAVIGATSIYASI — `fetch` bilan emas. Facebook OAuth
      // dialogiga BROWSER o'zi o'tishi kerak, JS orqali emas.
      window.location.href = j.url;
    } catch (e) {
      setErr((e as Error).message);
      setConnecting(false);
    }
  }

  async function selectPage(pageId: string) {
    setSelecting(pageId); setErr("");
    try {
      const r = await fetch("/api/meta/pages/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Ulab bo'lmadi");
      setChoosingPage(false); setPages(null);
      await mutate("/api/meta/status");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSelecting(null);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/meta/disconnect", { method: "DELETE" });
      await mutate("/api/meta/status");
    } finally {
      setDisconnecting(false);
    }
  }

  if (isLoading) {
    return <div className="h-40 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />;
  }

  return (
    <div className="max-w-xl space-y-4">
      {banner === "cancelled" && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 text-[13px] text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0" /> Ulanish bekor qilindi.
        </div>
      )}
      {banner === "error" && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 text-[13px] text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" /> Ulanishda xatolik yuz berdi. Qaytadan urining.
        </div>
      )}

      {choosingPage && (
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <h3 className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
            Qaysi sahifani ulaymiz?
          </h3>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
            Lid formangiz shu sahifaga bog&apos;langan bo&apos;lishi kerak.
          </p>
          {pages === null ? (
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          ) : pages.length === 0 ? (
            <p className="text-[13px] text-neutral-500">
              Sizga tegishli Facebook sahifasi topilmadi.
            </p>
          ) : (
            <div className="space-y-1.5">
              {pages.map((p) => (
                <button key={p.id} disabled={!!selecting}
                  onClick={() => selectPage(p.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border
                             border-white/60 dark:border-white/10 hover:border-indigo-400
                             text-left text-[13px] font-medium text-neutral-800 dark:text-neutral-200
                             disabled:opacity-50 transition-colors">
                  {p.name}
                  {selecting === p.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!choosingPage && status?.connected && (
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {status.pageName}
              </p>
              {status.isActive ? (
                <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ulangan
                </p>
              ) : (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Token muddati tugagan — qayta ulang
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="text-neutral-400">Ulagan</p>
              <p className="font-medium text-neutral-700 dark:text-neutral-300">
                {status.connectedByName || "—"}
              </p>
            </div>
            <div>
              <p className="text-neutral-400">Oxirgi lid</p>
              <p className="font-medium text-neutral-700 dark:text-neutral-300">
                {status.lastWebhookAt
                  ? new Date(status.lastWebhookAt).toLocaleString("uz-UZ")
                  : "Hali yo'q"}
              </p>
            </div>
          </div>

          {status.lastError && (
            <p className="text-[11px] text-red-500">Oxirgi xato: {status.lastError}</p>
          )}

          <div className="flex gap-2 pt-1">
            {!status.isActive && (
              <Button onClick={connect} disabled={connecting}
                className="h-9 px-4 text-[13px] bg-indigo-600 hover:bg-indigo-700 text-white">
                {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Qayta ulash"}
              </Button>
            )}
            <Button variant="outline" onClick={disconnect} disabled={disconnecting}
              className="h-9 px-4 text-[13px] text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              {disconnecting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><Unlink className="w-3.5 h-3.5 mr-1.5" /> Uzish</>}
            </Button>
          </div>
        </div>
      )}

      {!choosingPage && !status?.connected && (
        <div className="glass-panel rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
              Facebook/Instagram&apos;dan lid oling
            </h3>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              Sahifangizni ulasangiz, Lead Ads formasidan kelgan har bir ariza
              avtomatik shu taxtaga tushadi.
            </p>
          </div>
          <Button onClick={connect} disabled={connecting}
            className="h-10 px-5 text-[13px] bg-blue-600 hover:bg-blue-700 text-white mx-auto">
            {connecting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><ExternalLink className="w-4 h-4 mr-1.5" /> Facebookni ulash</>}
          </Button>
        </div>
      )}

      {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
    </div>
  );
}
