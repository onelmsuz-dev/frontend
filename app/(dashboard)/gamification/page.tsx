"use client";

import { useState, useMemo } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Trophy, Search, Sparkles, Flame, Coins, Settings2, Lock,
  TrendingUp, Plus, Users, Store, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mutate } from "swr";
import { useGroups } from "@/lib/hooks/useGroups";
import {
  useGamificationSettings, useGamificationStudents, useGamificationLeaderboard,
  useStudentPointHistory, useRedemptions, REASON_LABELS, REASON_COLORS,
  type GamificationStudent,
} from "@/lib/hooks/useGamification";
import { useMe } from "@/lib/hooks/useMe";
import { ShopTab } from "@/components/gamification/shop-tab";
import { RedemptionsTab } from "@/components/gamification/redemptions-tab";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const TABS = [
  { id: "reyting",   label: "Reyting" },
  { id: "oquvchi",   label: "O'quvchilar" },
  { id: "dokon",     label: "Do'kon" },
  { id: "sorovlar",  label: "So'rovlar" },
  { id: "sozlama",   label: "Sozlamalar" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthOptions() {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      value: monthKey(d),
      label: d.toLocaleDateString("uz-UZ", { month: "long", year: "numeric" }),
    });
  }
  return out;
}

export default function GamificationPage() {
  const [tab, setTab] = useState("reyting");
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useGamificationSettings();
  const { me } = useMe();
  // Do'kon va so'rovlarni faqat shu ruxsatga egalar boshqara oladi
  const perms: string[] = me?.permissions ?? [];
  const canManage = perms.includes("*") || perms.includes("gamification.rewards");
  // Tab yorlig'idagi kutilayotgan so'rovlar soni
  const { data: pending } = useRedemptions("PENDING");
  const pendingCount = pending?.pendingCount ?? 0;

  return (
    <div>
      <TopHeader
        title="Gamifikatsiya"
        subtitle={
          settingsLoading ? "Yuklanmoqda..."
          : settings?.active ? "Yoqilgan — ball avtomatik beriladi"
          : "O'chirilgan"
        }
      />

      <div className="p-5 space-y-5">
        {settingsError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{String(settingsError.message ?? settingsError)}</p>
          </div>
        )}

        {/* Holat banneri */}
        {settings && !settings.active && (
          <div className={cn(
            "flex items-start gap-3 px-4 py-3 rounded-xl border",
            settings.blockedBy
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
          )}>
            <Lock className={cn("w-4 h-4 shrink-0 mt-0.5",
              settings.blockedBy ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")} />
            <div className="text-sm">
              {settings.blockedBy === "platform" && (
                <p className="text-red-700 dark:text-red-300">
                  Gamifikatsiya <span className="font-bold">platforma darajasida</span> o&apos;chirilgan.
                  Yoqish uchun OneRoom administratoriga murojaat qiling.
                </p>
              )}
              {settings.blockedBy === "organization" && (
                <p className="text-red-700 dark:text-red-300">
                  Gamifikatsiya <span className="font-bold">sizning markazingiz uchun</span> yoqilmagan.
                  OneRoom administratoriga murojaat qiling.
                </p>
              )}
              {!settings.blockedBy && (
                <p className="text-amber-700 dark:text-amber-300">
                  Gamifikatsiya o&apos;chiq — ball berilmayapti.
                  <button onClick={() => setTab("sozlama")} className="ml-1 font-semibold underline">
                    Sozlamalardan yoqing
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                tab === t.id
                  ? "bg-indigo-600 text-white dark:bg-indigo-500 border-neutral-900"
                  : "glass-panel text-neutral-600 dark:text-neutral-400 border-white/60 dark:border-white/10 hover:border-neutral-400")}>
              {t.label}
              {t.id === "sorovlar" && pendingCount > 0 && (
                <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-black",
                  tab === "sorovlar" ? "bg-white/25" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300")}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "reyting" && <LeaderboardTab />}
        {tab === "oquvchi" && <StudentsTab settingsActive={!!settings?.active} coinIcon={settings?.coinIcon ?? "🪙"} />}
        {tab === "dokon" && <ShopTab canManage={canManage} />}
        {tab === "sorovlar" && <RedemptionsTab canManage={canManage} />}
        {tab === "sozlama" && <SettingsTab />}
      </div>
    </div>
  );
}

// ─── Reyting ──────────────────────────────────────────────────────────────────

function LeaderboardTab() {
  const { data: groupsRaw } = useGroups({ status: "ACTIVE" });
  const groups: any[] = Array.isArray(groupsRaw) ? groupsRaw : [];
  const [groupId, setGroupId] = useState("");
  const [month, setMonth] = useState(monthKey());

  const activeGroup = groupId || groups[0]?.id || "";
  const { data, isLoading } = useGamificationLeaderboard(activeGroup, month);
  const rows = data?.rows ?? [];
  const maxXp = rows[0]?.xp ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={activeGroup} onChange={e => setGroupId(e.target.value)}
          className="text-xs h-9 px-2.5 rounded-lg border border-white/60 dark:border-white/10 glass-soft text-neutral-700 dark:text-neutral-300 outline-none">
          {groups.length === 0 && <option value="">Faol guruh yo&apos;q</option>}
          {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="text-xs h-9 px-2.5 rounded-lg border border-white/60 dark:border-white/10 glass-soft text-neutral-700 dark:text-neutral-300 outline-none">
          {monthOptions().map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <span className="ml-auto text-[11px] text-neutral-400">
          Reyting har oy yangilanadi — guruh ichida
        </span>
      </div>

      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-neutral-400">
            <Trophy className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Bu oyda hali ball yig&apos;ilmagan</p>
          </div>
        ) : rows.map((r, i) => (
          <div key={r.id}
            className="flex items-center gap-3 px-5 py-3 border-b border-white/50 dark:border-white/10 last:border-0 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
            <div className="w-8 text-center shrink-0">
              {i < 3
                ? <span className="text-lg">{MEDALS[i]}</span>
                : <span className="text-[13px] font-black text-neutral-400">{i + 1}</span>}
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
              {r.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{r.name}</p>
              <div className="mt-1 h-1 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${maxXp > 0 ? Math.round((r.xp / maxXp) * 100) : 0}%` }} />
              </div>
            </div>
            {r.streak > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-500 shrink-0">
                <Flame className="w-3.5 h-3.5" />{r.streak}
              </span>
            )}
            <span className="text-[13px] font-black text-neutral-900 dark:text-neutral-100 shrink-0 w-16 text-right">
              {r.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── O'quvchilar + qo'lda ball ────────────────────────────────────────────────

function StudentsTab({ settingsActive, coinIcon }: { settingsActive: boolean; coinIcon: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [awardOpen, setAwardOpen] = useState(false);
  const [historyOf, setHistoryOf] = useState<GamificationStudent | null>(null);

  const { data, isLoading } = useGamificationStudents(search);
  const students = useMemo(() => data ?? [], [data]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <AwardModal
        open={awardOpen}
        onClose={() => setAwardOpen(false)}
        studentIds={[...selected]}
        onDone={() => { setSelected(new Set()); mutate((k: string) => typeof k === "string" && k.startsWith("/api/gamification")); }}
      />
      <HistoryModal student={historyOf} onClose={() => setHistoryOf(null)} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input placeholder="Ism, telefon..." className="pl-9 h-9 text-sm w-56"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {selected.size > 0 && (
          <button onClick={() => setAwardOpen(true)} disabled={!settingsActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            {selected.size} ta o&apos;quvchiga ball berish
          </button>
        )}
        <span className="ml-auto text-xs text-neutral-400">{students.length} ta</span>
      </div>

      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                {["", "O'QUVCHI", "DARAJA", "XP", coinIcon.toUpperCase(), "STREAK", ""].map((h, i) => (
                  <TableHead key={i} className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : students.map(s => (
                    <TableRow key={s.id}
                      onClick={() => setHistoryOf(s)}
                      className="cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                      <TableCell onClick={e => e.stopPropagation()} className="w-8">
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)}
                          className="w-4 h-4 rounded accent-indigo-600 cursor-pointer" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                            {s.name[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{s.name}</p>
                            <p className="text-[11px] text-neutral-400">{s.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-lg font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shrink-0">
                            {s.level.level}
                          </span>
                          <span className="text-[12px] text-neutral-600 dark:text-neutral-400">{s.level.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-[13px] font-black text-neutral-900 dark:text-neutral-100">{s.xpTotal}</span></TableCell>
                      <TableCell><span className="text-[13px] font-black text-amber-600 dark:text-amber-400">{s.coinBalance}</span></TableCell>
                      <TableCell>
                        {s.streak > 0
                          ? <span className="flex items-center gap-1 text-[12px] font-semibold text-orange-500"><Flame className="w-3.5 h-3.5" />{s.streak}</span>
                          : <span className="text-[12px] text-neutral-400">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <TrendingUp className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 inline" />
                      </TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </div>
        {!isLoading && students.length === 0 && (
          <div className="flex flex-col items-center py-16 text-neutral-400">
            <Users className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">O&apos;quvchi topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AwardModal({ open, onClose, studentIds, onDone }: {
  open: boolean; onClose: () => void; studentIds: string[]; onDone: () => void;
}) {
  const [xp, setXp] = useState("10");
  const [coin, setCoin] = useState("10");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/gamification/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds, xp: Number(xp) || 0, coin: Number(coin) || 0, note: note || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "Xatolik"); return; }
      onDone();
      onClose();
      setNote("");
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title="Qo'lda ball berish"
      subtitle={`${studentIds.length} ta o'quvchiga`}
      footer={
        <>
          <Button onClick={submit} disabled={saving}
            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
            {saving ? "Berilmoqda..." : "Ball berish"}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={onClose}>Bekor</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField label="XP" hint="Daraja va reytingga">
          <Input type="number" value={xp} onChange={e => setXp(e.target.value)} className="h-10" />
        </FormField>
        <FormField label="Coin" hint="Sarflanadigan">
          <Input type="number" value={coin} onChange={e => setCoin(e.target.value)} className="h-10" />
        </FormField>
      </div>
      <FormField label="Izoh" hint="O'quvchi tarixida ko'rinadi">
        <Input placeholder="Darsdagi faollik uchun" value={note}
          onChange={e => setNote(e.target.value)} className="h-10" />
      </FormField>
      {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
    </Modal>
  );
}

function HistoryModal({ student, onClose }: { student: GamificationStudent | null; onClose: () => void }) {
  const { data, isLoading } = useStudentPointHistory(student?.id);
  return (
    <Modal
      open={!!student} onClose={onClose}
      title={student?.name ?? ""}
      subtitle={student ? `${student.xpTotal} XP · ${student.coinBalance} coin · ${student.level.name}` : ""}
      size="lg"
      footer={<Button variant="outline" className="h-10 px-4 text-[13px] w-full" onClick={onClose}>Yopish</Button>}
    >
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (data ?? []).length === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-400">Hali ball yozuvi yo&apos;q</div>
      ) : (
        <div className="space-y-1">
          {(data ?? []).map(t => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-white/50 dark:border-white/10 last:border-0">
              <span className={cn("text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0",
                REASON_COLORS[t.reason] ?? "bg-neutral-100 text-neutral-600")}>
                {REASON_LABELS[t.reason] ?? t.reason}
              </span>
              <div className="flex-1 min-w-0">
                {t.note && <p className="text-[12px] text-neutral-600 dark:text-neutral-400 truncate">{t.note}</p>}
                <p className="text-[10px] text-neutral-400">{new Date(t.createdAt).toLocaleString("uz-UZ")}</p>
              </div>
              <div className="text-right shrink-0">
                {t.xp !== 0 && <p className={cn("text-[12px] font-black", t.xp > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500")}>{t.xp > 0 ? "+" : ""}{t.xp} XP</p>}
                {t.coin !== 0 && <p className={cn("text-[11px] font-bold", t.coin > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-500")}>{t.coin > 0 ? "+" : ""}{t.coin} 🪙</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ─── Sozlamalar ───────────────────────────────────────────────────────────────

function SettingsTab() {
  const { data: s, mutate: refresh } = useGamificationSettings();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save(patch: Record<string, unknown>) {
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/gamification/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "Saqlab bo'lmadi"); return; }
      refresh();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  if (!s) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>;

  const locked = !!s.blockedBy;

  return (
    <div className="space-y-4">
      {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}

      {/* Asosiy kalit */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-500" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Asosiy</p>
        </div>

        <Row
          title="Gamifikatsiyani yoqish"
          desc={locked
            ? "Platforma administratori tomonidan cheklangan"
            : "O'chirilsa ball berilmaydi, lekin yig'ilgan ballar saqlanib qoladi"}
          checked={s.enabled} disabled={saving || locked}
          onToggle={v => save({ enabled: v })}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Valyuta nomi" hint="O'quvchiga shunday ko'rinadi">
            <Input defaultValue={s.coinName} className="h-10"
              onBlur={e => e.target.value !== s.coinName && save({ coinName: e.target.value })} />
          </FormField>
          <FormField label="Belgisi" hint="Emoji">
            <Input defaultValue={s.coinIcon} className="h-10"
              onBlur={e => e.target.value !== s.coinIcon && save({ coinIcon: e.target.value })} />
          </FormField>
        </div>
      </div>

      {/* Davomat */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-green-500" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Davomat uchun ball</p>
        </div>
        <Row title="Yoqilgan" desc="Davomat belgilanganda avtomatik ball beriladi"
          checked={s.attendanceEnabled} disabled={saving} onToggle={v => save({ attendanceEnabled: v })} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <NumField label="Keldi — XP" value={s.attendanceXp} onSave={v => save({ attendanceXp: v })} />
          <NumField label="Keldi — Coin" value={s.attendanceCoin} onSave={v => save({ attendanceCoin: v })} />
          <NumField label="Kech keldi — XP" value={s.lateXp} onSave={v => save({ lateXp: v })} />
          <NumField label="Kech keldi — Coin" value={s.lateCoin} onSave={v => save({ lateCoin: v })} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <NumField label="Ketma-ketlik (har N dars)" value={s.streakEvery} onSave={v => save({ streakEvery: v })} />
          <NumField label="Bonus — XP" value={s.streakXp} onSave={v => save({ streakXp: v })} />
          <NumField label="Bonus — Coin" value={s.streakCoin} onSave={v => save({ streakCoin: v })} />
        </div>
      </div>

      {/* To'lov */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">To&apos;lov uchun ball</p>
        </div>
        <Row title="Yoqilgan" desc="O'z vaqtida yoki oldindan to'laganda avtomatik ball"
          checked={s.paymentEnabled} disabled={saving} onToggle={v => save({ paymentEnabled: v })} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <NumField label="O'z vaqtida — oyning kuni" value={s.onTimeDay} onSave={v => save({ onTimeDay: v })} />
          <NumField label="O'z vaqtida — XP" value={s.onTimeXp} onSave={v => save({ onTimeXp: v })} />
          <NumField label="O'z vaqtida — Coin" value={s.onTimeCoin} onSave={v => save({ onTimeCoin: v })} />
          <NumField label="Oldindan — XP" value={s.earlyXp} onSave={v => save({ earlyXp: v })} />
          <NumField label="Oldindan — Coin" value={s.earlyCoin} onSave={v => save({ earlyCoin: v })} />
        </div>
        <p className="text-[11px] text-neutral-400">
          &quot;Oldindan&quot; — o&apos;quvchining qarzi yo&apos;q holda to&apos;laganda. Ikkalasi mos kelsa, oldindan ustun.
        </p>
      </div>

      {/* Referal */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-purple-500" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Do&apos;st taklif qilish</p>
        </div>
        <Row title="Yoqilgan"
          desc="O'quvchi do'stini taklif qilsa ball oladi — do'st birinchi to'lovni qilgach"
          checked={s.referralEnabled} disabled={saving} onToggle={v => save({ referralEnabled: v })} />
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Har do'st uchun — XP" value={s.referralXp} onSave={v => save({ referralXp: v })} />
          <NumField label="Har do'st uchun — Coin" value={s.referralCoin} onSave={v => save({ referralCoin: v })} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <NumField label="Bonus (necha do'stda)" value={s.referralMilestone} onSave={v => save({ referralMilestone: v })} />
          <NumField label="Bonus — XP" value={s.referralMilestoneXp} onSave={v => save({ referralMilestoneXp: v })} />
          <NumField label="Bonus — Coin" value={s.referralMilestoneCoin} onSave={v => save({ referralMilestoneCoin: v })} />
        </div>
        <p className="text-[11px] text-neutral-400">
          Mukofot <strong>ro&apos;yxatdan o&apos;tishda emas, birinchi to&apos;lovdan keyin</strong> beriladi —
          soxta o&apos;quvchi qo&apos;shib ball yig&apos;ishning oldini oladi.
          {s.referralMilestone > 0
            ? ` ${s.referralMilestone} ta do'st taklif qilganda qo'shimcha ${s.referralMilestoneCoin} coin bonus beriladi (0 = o'chiq).`
            : " Bosqichli bonus o'chiq."}
          {" "}Har o&apos;quvchi o&apos;z panelidan 6 belgili kodini oladi va do&apos;stiga beradi;
          qabulxona o&apos;quvchi qo&apos;shayotganda shu kodni kiritadi.
        </p>
      </div>

      {/* Do'kon */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-pink-500" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Do&apos;kon</p>
        </div>
        <Row title="Yoqilgan" desc="O'quvchilar coinni sovg'aga almashtira oladi"
          checked={s.shopEnabled} disabled={saving} onToggle={v => save({ shopEnabled: v })} />
        <div className="grid grid-cols-2 gap-3">
          <NumField label="1 coin = necha so'm" value={s.discountRate} onSave={v => save({ discountRate: v })} />
        </div>
        <p className="text-[11px] text-neutral-400">
          Faqat &quot;To&apos;lovga chegirma&quot; turidagi sovg&apos;a narxini avtomatik hisoblashda ishlatiladi.
          Masalan {s.discountRate} bo&apos;lsa, 1000 coin = {(1000 * s.discountRate).toLocaleString("uz-UZ")} so&apos;m.
        </p>
      </div>

      {/* Qo'lda */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-violet-500" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Qo&apos;lda ball berish</p>
        </div>
        <Row title="Yoqilgan" desc="O'qituvchi darsdagi faollik uchun ball bera oladi"
          checked={s.manualEnabled} disabled={saving} onToggle={v => save({ manualEnabled: v })} />
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Kunlik limit (bitta xodim)" value={s.manualMaxPerDay} onSave={v => save({ manualMaxPerDay: v })} />
        </div>
      </div>
    </div>
  );
}

function Row({ title, desc, checked, disabled, onToggle }: {
  title: string; desc: string; checked: boolean; disabled?: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/50 dark:border-white/10 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">{title}</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onToggle(!checked)} disabled={disabled}
        className={cn("relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50",
          checked ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-600")}>
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
          checked && "translate-x-4")} />
      </button>
    </div>
  );
}

function NumField({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  return (
    <FormField label={label}>
      <Input type="number" defaultValue={value} className="h-10"
        onBlur={e => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v) && v !== value) onSave(v);
        }} />
    </FormField>
  );
}
