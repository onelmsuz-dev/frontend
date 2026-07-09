"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import {
  Bell, Search, Plus, DollarSign, UserPlus, Users,
  Check, BookOpen, X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useNotifications, type Notification } from "@/lib/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { BranchHeaderControls } from "@/components/layout/branch-header-controls";

interface TopHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: { label: string; onClick?: () => void };
}

// ── Notifications ────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, { icon: typeof DollarSign; cls: string }> = {
  payment: { icon: DollarSign, cls: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
  lead:    { icon: UserPlus,   cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  student: { icon: Users,      cls: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
};

function NotifIcon({ type }: { type: string }) {
  const cfg = TYPE_ICON[type] ?? TYPE_ICON["student"];
  const Icon = cfg.icon;
  return (
    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", cfg.cls)}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Hozirgina";
  if (mins < 60) return `${mins} daq. oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} soat oldin`;
  return `${Math.floor(hrs / 24)} kun oldin`;
}

// ── Search ───────────────────────────────────────────────────────────────────

type SearchResult = {
  students: { id: string; name: string; phone: string; isActive: boolean }[];
  groups:   { id: string; name: string; status: string; course: { name: string } | null }[];
  leads:    { id: string; name: string; phone: string; status: string }[];
};

const STATUS_BADGE: Record<string, string> = {
  YANGI: "bg-blue-100 text-blue-700",
  ALOQA_QILINGAN: "bg-yellow-100 text-yellow-700",
  SINOV_DARSI: "bg-amber-100 text-amber-700",
  TO_LANDI: "bg-green-100 text-green-700",
  BEKOR: "bg-neutral-100 text-neutral-500",
  ACTIVE: "bg-green-100 text-green-700",
  UPCOMING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-neutral-100 text-neutral-500",
};
const STATUS_LABEL: Record<string, string> = {
  YANGI: "Yangi", ALOQA_QILINGAN: "Aloqa", SINOV_DARSI: "Sinov", TO_LANDI: "To'ladi", BEKOR: "Bekor",
  ACTIVE: "Faol", UPCOMING: "Kutilmoqda", COMPLETED: "Tugagan",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function GlobalSearch() {
  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState<SearchResult | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [open,       setOpen]       = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const debouncedQ   = useDebounce(query, 300);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (debouncedQ.length < 2) { setResults(null); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQ)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setResults(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQ]);

  const hasResults = results && (
    results.students.length + results.groups.length + results.leads.length > 0
  );
  const showPanel = open && (query.length >= 2);

  function clear() { setQuery(""); setResults(null); setOpen(false); setExpanded(false); }

  return (
    <div className="relative" ref={containerRef}>
      {/* Mobile: icon button to expand */}
      {!expanded && (
        <button
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {/* Desktop always visible, mobile only when expanded */}
      <div className={cn(!expanded && "hidden lg:block")}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Qidirish..."
          className="pl-9 pr-8 h-9 w-44 sm:w-56 text-[13px] bg-neutral-100 dark:bg-neutral-800 border-0 rounded-xl
            text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none
            focus:bg-neutral-50 dark:focus:bg-neutral-700 transition-colors"
        />
        {query && (
          <button onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {!query && expanded && (
          <button onClick={() => setExpanded(false)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors lg:hidden">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white dark:bg-neutral-900
          border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden">

          {loading && (
            <div className="px-4 py-6 text-center text-[12px] text-neutral-400">Qidirilmoqda...</div>
          )}

          {!loading && !hasResults && results && (
            <div className="px-4 py-6 text-center text-[12px] text-neutral-400">
              &quot;{query}&quot; bo'yicha natija topilmadi
            </div>
          )}

          {!loading && hasResults && (
            <>
              {results!.students.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                    O'quvchilar
                  </p>
                  {results!.students.map(s => (
                    <Link key={s.id} href={`/students/${s.id}`} onClick={clear}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0",
                        s.isActive ? "bg-gradient-to-br from-blue-400 to-indigo-500" : "bg-gradient-to-br from-amber-400 to-orange-400")}>
                        {s.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{s.name}</p>
                        <p className="text-[11px] text-neutral-400">{s.phone}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results!.groups.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                    Guruhlar
                  </p>
                  {results!.groups.map(g => (
                    <Link key={g.id} href={`/groups/${g.id}`} onClick={clear}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <div className="w-7 h-7 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{g.name}</p>
                        <p className="text-[11px] text-neutral-400">{g.course?.name}</p>
                      </div>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0",
                        STATUS_BADGE[g.status] ?? "bg-neutral-100 text-neutral-500")}>
                        {STATUS_LABEL[g.status] ?? g.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {results!.leads.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                    Arizalar (CRM)
                  </p>
                  {results!.leads.map(l => (
                    <Link key={l.id} href="/leads" onClick={clear}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{l.name}</p>
                        <p className="text-[11px] text-neutral-400">{l.phone}</p>
                      </div>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0",
                        STATUS_BADGE[l.status] ?? "bg-neutral-100 text-neutral-500")}>
                        {STATUS_LABEL[l.status] ?? l.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TopHeader({ title, subtitle, action }: TopHeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { items, unread, markAllRead } = useNotifications();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    if (showNotif) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotif]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-[56px] lg:h-[60px]
      bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md
      border-b border-neutral-200/60 dark:border-neutral-800/60">
      <div className="min-w-0 flex-1 mr-3">
        <h1 className="font-bold text-[16px] lg:text-[18px] text-neutral-900 dark:text-neutral-100 tracking-tight leading-none truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] lg:text-[12px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
        <BranchHeaderControls />
        <GlobalSearch />

        {/* Bell */}
        <div className="relative" ref={panelRef}>
          <button onClick={() => setShowNotif(v => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors
              text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100
              hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full
                text-[9px] text-white font-bold flex items-center justify-center px-0.5">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white dark:bg-neutral-900
              border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Bildirishnomalar</h3>
                  {unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unread}
                    </span>
                  )}
                </div>
                {unread > 0 && (
                  <button onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    <Check className="w-3 h-3" /> Barchasini o'qildi
                  </button>
                )}
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-neutral-400">
                    <Bell className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[12px]">Bildirishnomalar yo'q</p>
                  </div>
                ) : (
                  items.map((n: Notification) => (
                    <div key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                        !n.isRead && "bg-blue-50/50 dark:bg-blue-900/10",
                      )}>
                      <NotifIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{n.body}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {action && (
          <>
            {/* Mobile: icon only */}
            <button
              onClick={action.onClick}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            {/* Desktop: label + icon */}
            <Button size="sm" onClick={action.onClick}
              className="hidden lg:flex gap-1.5 h-9 px-4 text-[13px] bg-neutral-900 hover:bg-neutral-800
                dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-white rounded-xl">
              <Plus className="w-3.5 h-3.5" />
              {action.label}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
