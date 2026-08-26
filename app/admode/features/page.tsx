"use client";

import { useMemo, useState } from "react";
import {
  Rocket, Check, AlertTriangle, Loader2, X, Search, Undo2, Ban,
  History, FlaskConical, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdmodeFeatures, admodeFeatureCall,
  type FeatureRow, type Rollout, type FeatureOrg,
} from "@/lib/hooks/useAdmodeFeatures";

/**
 * YANGILANISHLARNI BOSQICHMA-BOSQICH CHIQARISH.
 *
 * Palitra — /admode uslubi (`bg-white dark:bg-neutral-900`), `glass-*` EMAS:
 * bu markaz paneli emas, platforma paneli.
 */

const ROLLOUTS: { value: Rollout; label: string }[] = [
  { value: "OFF",  label: "O'chiq" },
  { value: "DEMO", label: "Faqat tanlanganlar" },
  { value: "ALL",  label: "Hamma markaz" },
];

const BADGE: Record<Rollout, string> = {
  OFF:  "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  DEMO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ALL:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdmodeFeaturesPage() {
  const { data, isLoading, mutate } = useAdmodeFeatures();

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="text-[19px] font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Yangilanishlar
        </h1>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
          Yangi funksiya avval faqat sizning sinov akkauntingizda, keyin demo
          markazlarda, oxirida hammada yoqiladi. Har bir bosqichni bir bosishda
          orqaga qaytarish mumkin — deploy talab qilinmaydi.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-[13px] text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
        </div>
      )}

      {data?.features.map((f) => (
        <FeatureCard key={f.key} f={f} orgs={data.orgs} onChanged={() => mutate()} />
      ))}

      {data && data.features.length === 0 && (
        <p className="text-[13px] text-neutral-500">
          Hozircha bosqichma-bosqich chiqariladigan funksiya yo&apos;q.
        </p>
      )}
    </div>
  );
}

function FeatureCard({
  f, orgs, onChanged,
}: {
  f: FeatureRow;
  orgs: FeatureOrg[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirmAll, setConfirmAll] = useState(false);
  const [q, setQ] = useState("");
  const [phone, setPhone] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const overrideBy = useMemo(
    () => new Map(f.overrides.map((o) => [o.organizationId, o])),
    [f.overrides],
  );

  const filteredOrgs = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orgs;
    return orgs.filter(
      (o) => o.name.toLowerCase().includes(s) || o.subdomain.toLowerCase().includes(s),
    );
  }, [orgs, q]);

  async function call(path: string, method: "PATCH" | "POST" | "PUT" | "DELETE", body?: unknown) {
    setBusy(true);
    setErr("");
    const r = await admodeFeatureCall(path, method, body);
    setBusy(false);
    if (!r.ok) setErr(r.error);
    else onChanged();
    return r.ok;
  }

  function setRollout(next: Rollout) {
    if (next === "ALL") { setConfirmAll(true); return; }
    void call(`/${f.key}`, "PATCH", { rollout: next });
  }

  /**
   * Markaz uch holatda bo'lishi mumkin: standart (istisnosiz), majburan
   * yoqilgan, majburan o'chirilgan. Switch amaldagi natijani ko'rsatadi.
   */
  function orgEffective(o: FeatureOrg): boolean {
    const ov = overrideBy.get(o.id);
    if (f.rollout === "OFF") return false;
    if (ov) return ov.enabled;
    return f.rollout === "ALL" || o.isDemo;
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
              {f.label}
            </h2>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md uppercase", BADGE[f.rollout])}>
              {ROLLOUTS.find((r) => r.value === f.rollout)?.label}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">
            {f.key} · yangilangan: {fmtDate(f.updatedAt)}
          </p>
          <p className="text-[12px] text-neutral-600 dark:text-neutral-300 mt-2 max-w-2xl">
            {f.description}
          </p>
        </div>
      </div>

      {err && (
        <p className="mt-3 text-[12px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> {err}
        </p>
      )}

      {/* ── Bosqich ──────────────────────────────────────────────────────── */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Chiqarish bosqichi
        </p>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 max-w-lg">
          {ROLLOUTS.map((r) => (
            <button
              key={r.value}
              disabled={busy}
              onClick={() => setRollout(r.value)}
              className={cn(
                "px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-60",
                f.rollout === r.value
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
          Hozir: <b>{f.enabledCount}</b> ta markazda yoqilgan ({f.orgTotal} tadan)
          {f.rollout === "DEMO" && ` · demo markazlar: ${f.demoCount}`}
        </p>
        {f.rollout === "OFF" && (
          <p className="text-[11px] text-neutral-400 mt-1">
            O&apos;chirilganda markazlar ro&apos;yxati e&apos;tiborga olinmaydi — sinov
            akkauntlaridan tashqari hech kimda ko&apos;rinmaydi.
          </p>
        )}

        {f.rollout !== "OFF" && (
          <div className="flex flex-wrap gap-2 mt-3">
            {f.rollout === "ALL" && (
              <Button
                variant="outline" size="sm" disabled={busy}
                className="h-8 text-[12px] gap-1.5"
                onClick={() => call(`/${f.key}/rollback`, "POST", { to: "DEMO" })}
              >
                <Undo2 className="w-3.5 h-3.5" /> Demoga qaytarish
              </Button>
            )}
            <Button
              size="sm" disabled={busy}
              className="h-8 text-[12px] gap-1.5 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => call(`/${f.key}/rollback`, "POST", { to: "OFF" })}
            >
              <Ban className="w-3.5 h-3.5" /> Butunlay o&apos;chirish
            </Button>
          </div>
        )}
      </div>

      {/* ── Sinov akkauntlari ────────────────────────────────────────────── */}
      <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-2 flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5" /> Sinov akkauntlari
        </p>
        <div className="flex gap-2 max-w-md">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="h-9 text-[13px]"
          />
          <Button
            size="sm" disabled={busy || !phone.trim()}
            className="h-9 text-[12px] shrink-0"
            onClick={async () => {
              if (await call(`/${f.key}/preview`, "POST", { phone })) setPhone("");
            }}
          >
            Qo&apos;shish
          </Button>
        </div>
        {f.previews.length > 0 && (
          <div className="mt-2 space-y-1">
            {f.previews.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-2 text-[12px] py-1.5 px-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60"
              >
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{p.name}</span>
                <span className="text-neutral-400 font-mono text-[11px]">{p.phone}</span>
                {p.orgName && <span className="text-neutral-400">· {p.orgName}</span>}
                <button
                  disabled={busy}
                  onClick={() => call(`/${f.key}/preview/${p.userId}`, "DELETE")}
                  className="ml-auto w-6 h-6 grid place-items-center rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label="Olib tashlash"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-neutral-400 mt-2">
          Bu foydalanuvchilar funksiyani bosqich «O&apos;chiq» bo&apos;lsa ham ko&apos;radi.
          Boshqa hech kimga ta&apos;sir qilmaydi.
        </p>
      </div>

      {/* ── Markazlar ────────────────────────────────────────────────────── */}
      <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 flex-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Markazlar
          </p>
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Markaz nomi..."
              className="h-8 text-[12px] pl-8"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {filteredOrgs.map((o) => {
            const ov = overrideBy.get(o.id);
            const on = orgEffective(o);
            const standart = !ov;
            return (
              <div
                key={o.id}
                className="flex items-center gap-2 text-[12px] py-1.5 px-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              >
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]">
                  {o.name}
                </span>
                <span className="text-neutral-400 font-mono text-[11px]">{o.subdomain}</span>
                {o.isDemo && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Demo
                  </span>
                )}
                <span className="ml-auto text-[11px] text-neutral-400">
                  {standart ? "standart" : ov!.enabled ? "majburan yoqilgan" : "majburan o'chirilgan"}
                </span>
                {!standart && (
                  <button
                    disabled={busy}
                    onClick={() => call(`/${f.key}/orgs/${o.id}`, "DELETE")}
                    title="Istisnoni olib tashlash"
                    className="w-6 h-6 grid place-items-center rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  // Bosqich "O'chiq" bo'lganda istisno hech qanday ta'sir
                  // qilmaydi (OFF mutlaq) — bosilsa ko'rinmas yozuv qolib,
                  // keyin DEMO ga o'tilganda kutilmaganda yonib ketardi.
                  disabled={busy || f.rollout === "OFF"}
                  title={f.rollout === "OFF" ? "Avval bosqichni o'zgartiring" : undefined}
                  onClick={() => call(`/${f.key}/orgs/${o.id}`, "PUT", { enabled: !on })}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60",
                    on ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600",
                  )}
                  aria-label={on ? "O'chirish" : "Yoqish"}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                      on && "translate-x-5",
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tarix ────────────────────────────────────────────────────────── */}
      {f.events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 flex items-center gap-1.5 hover:text-neutral-600"
          >
            <History className="w-3.5 h-3.5" /> Tarix ({f.events.length})
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1">
              {f.events.map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <span className="font-mono text-neutral-400 w-24 shrink-0">{fmtDate(e.createdAt)}</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">{e.action}</span>
                  <span className="truncate">{e.detail}</span>
                  <span className="ml-auto text-neutral-400 shrink-0">{e.actorName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        title="Hammaga chiqarish"
        subtitle={f.label}
        footer={
          <>
            <Button
              className="flex-1 h-9 text-[13px]"
              disabled={busy}
              onClick={async () => {
                if (await call(`/${f.key}`, "PATCH", { rollout: "ALL" })) setConfirmAll(false);
              }}
            >
              {busy ? "Chiqarilmoqda..." : "Hammaga chiqarish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setConfirmAll(false)}>
              Bekor
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-neutral-600 dark:text-neutral-300">
          «{f.label}» <b>{f.orgTotal} ta markazda</b> darhol yoqiladi.
        </p>
        <p className="text-[12px] text-neutral-500 mt-2 flex items-start gap-1.5">
          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
          Xato bo&apos;lsa bir bosishda demoga qaytarish mumkin — deploy kerak emas.
        </p>
        <p className="text-[11px] text-neutral-400 mt-2">
          O&apos;zgarish ochiq turgan panellarga 1 daqiqagacha yetib boradi.
        </p>
      </Modal>
    </div>
  );
}
