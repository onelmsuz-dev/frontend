"use client";

import { useMemo, useState } from "react";
import {
  Rocket, AlertTriangle, Loader2, X, Search, History, FlaskConical,
  Building2, ChevronDown, Check, LayoutList,
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
 * YANGI FUNKSIYALAR — qaysi funksiya qaysi markazda ishlaydi.
 *
 * Ilgari panel bayroq tilida gapirardi ("standart", "majburan yoqilgan",
 * "Demoga qaytarish") va har funksiya kartasida 15 ta markazning ro'yxati
 * ochiq turardi. Egasi so'radi (2026-10-10): "panelni tushunarli, sodda qil".
 *
 * Endi uch oddiy holat: Hech kimga · Tanlangan markazlarga · Hamma
 * markazlarga. Markazning holati bitta tugma bilan ko'rsatiladi — u
 * AMALDAGI natija (bosqich, demo belgisi va istisno birgalikda).
 *
 * "Tanlangan markazlarga" o'tganda aynan belgilangan markazlar yoqiladi
 * (`PUT /:key/selection`): ilgari DEMO bosqichi to'rtta demo markazni o'z-o'zidan
 * yoqib yuborardi.
 *
 * Palitra — /admode uslubi (`bg-white dark:bg-neutral-900`), `glass-*` EMAS.
 */

const HOLAT: Record<Rollout, { nom: string; izoh: string }> = {
  OFF:  { nom: "Hech kimga",            izoh: "Funksiya hamma markazda yashirin" },
  DEMO: { nom: "Tanlangan markazlarga", izoh: "Faqat siz belgilagan markazlarda" },
  ALL:  { nom: "Hamma markazlarga",     izoh: "Barcha markazlarda, siz o'chirganlardan tashqari" },
};

const AMAL: Record<string, string> = {
  rollout: "Holat",
  rollback: "Orqaga qaytarildi",
  selection: "Tanlangan markazlar",
  "override.set": "Markaz",
  "override.remove": "Markaz",
  "preview.add": "Sinov akkaunti qo'shildi",
  "preview.remove": "Sinov akkaunti olindi",
};

/** Tarixdagi "OFF → DEMO" kabi yozuvlar odam tilida. */
function tarixMatni(detail: string): string {
  return detail
    .replace(/\bOFF\b/g, "hech kim")
    .replace(/\bDEMO\b/g, "tanlanganlar")
    .replace(/\bALL\b/g, "hamma")
    .replace(/: standart$/, ": odatiy holat");
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

/** Markazda funksiya AMALDA yoqilganmi (backend `forOrg` bilan bir xil tartib). */
function yoqilgan(f: FeatureRow, o: FeatureOrg): boolean {
  if (f.rollout === "OFF") return false;
  const ov = f.overrides.find((x) => x.organizationId === o.id);
  if (ov) return ov.enabled;
  return f.rollout === "ALL" || o.isDemo;
}

function holatMatni(f: FeatureRow, orgs: FeatureOrg[]): { matn: string; cls: string } {
  if (f.rollout === "OFF") {
    return { matn: "Hech kimga yoqilmagan", cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" };
  }
  const on = orgs.filter((o) => yoqilgan(f, o));
  if (f.rollout === "ALL") {
    const tashqari = orgs.length - on.length;
    return {
      matn: tashqari ? `Hamma markazda, ${tashqari} tasidan tashqari` : "Hamma markazda",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    };
  }
  if (on.length === 0) {
    return { matn: "Hech bir markazda", cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" };
  }
  const nomlar = on.slice(0, 3).map((o) => o.name).join(", ");
  return {
    matn: `${on.length} ta markazda: ${nomlar}${on.length > 3 ? ` va yana ${on.length - 3}` : ""}`,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };
}

export default function AdmodeFeaturesPage() {
  const { data, isLoading, mutate } = useAdmodeFeatures();
  const [korinish, setKorinish] = useState<"funksiya" | "markaz">("funksiya");

  return (
    <div className="p-5 space-y-5 max-w-5xl">
      <div>
        <h1 className="text-[19px] font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Yangi funksiyalar
        </h1>
        <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
          {"Har bir funksiya qaysi markazlarda ishlashini shu yerda yoqasiz yoki o'chirasiz. "
            + "O'zgarish markazlarga 1 daqiqada yetadi, deploy kerak emas."}
        </p>
      </div>

      <div className="inline-flex gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800" role="tablist">
        {([["funksiya", "Funksiyalar bo'yicha", LayoutList], ["markaz", "Markaz bo'yicha", Building2]] as const).map(([k, nom, Icon]) => (
          <button key={k} type="button" role="tab" aria-selected={korinish === k} data-korinish={k}
            onClick={() => setKorinish(k)}
            className={cn("inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors",
              korinish === k ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200")}>
            <Icon className="w-3.5 h-3.5" />{nom}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-[13px] text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
        </div>
      )}

      {data && korinish === "funksiya" && (
        <div className="space-y-3">
          {data.features.map((f) => (
            <FunksiyaKarta key={f.key} f={f} orgs={data.orgs} onChanged={() => mutate()} />
          ))}
        </div>
      )}
      {data && korinish === "markaz" && (
        <MarkazKorinishi features={data.features} orgs={data.orgs} onChanged={() => mutate()} />
      )}
    </div>
  );
}

// ─── Funksiya kartasi ──────────────────────────────────────────────────────

function FunksiyaKarta({ f, orgs, onChanged }: { f: FeatureRow; orgs: FeatureOrg[]; onChanged: () => void }) {
  const [ochiq, setOchiq] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [tanlash, setTanlash] = useState<Set<string> | null>(null);
  const [tasdiq, setTasdiq] = useState<"OFF" | "ALL" | null>(null);
  const [qoshimcha, setQoshimcha] = useState(false);
  const [phone, setPhone] = useState("");

  const holat = holatMatni(f, orgs);
  const yoqilganlar = orgs.filter((o) => yoqilgan(f, o));
  const royxat = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orgs
      .filter((o) => !s || o.name.toLowerCase().includes(s) || o.subdomain.toLowerCase().includes(s))
      .sort((a, b) => Number(yoqilgan(f, b)) - Number(yoqilgan(f, a)) || a.name.localeCompare(b.name));
  }, [orgs, q, f]);

  async function call(path: string, method: "PATCH" | "POST" | "PUT" | "DELETE", body?: unknown) {
    setBusy(true); setErr("");
    const r = await admodeFeatureCall(path, method, body);
    setBusy(false);
    if (!r.ok) setErr(r.error); else onChanged();
    return r.ok;
  }

  function holatniTanla(next: Rollout) {
    if (next === f.rollout && next !== "DEMO") return;
    if (next === "DEMO") { setTanlash(new Set(yoqilganlar.map((o) => o.id))); return; }
    setTasdiq(next);
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl" data-funksiya={f.key}>
      <button type="button" onClick={() => setOchiq((v) => !v)} aria-expanded={ochiq}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">{f.label}</p>
          <p className={cn("text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl", !ochiq && "line-clamp-2")}>
            {f.description}
          </p>
          <span className={cn("inline-block mt-2 text-[11.5px] font-semibold px-2 py-1 rounded-lg", holat.cls)} data-holat>
            {holat.matn}
          </span>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
          {ochiq ? "Yopish" : "Boshqarish"}
          <ChevronDown className={cn("w-4 h-4 transition-transform", ochiq && "rotate-180")} />
        </span>
      </button>

      {ochiq && (
        <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          {err && (
            <p className="text-[12px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {err}
            </p>
          )}

          {/* ── Kimga ko'rinadi ─────────────────────────────────────────── */}
          <div>
            <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Kimga ko&apos;rinadi?</p>
            <div className="grid sm:grid-cols-3 gap-2">
              {(["OFF", "DEMO", "ALL"] as Rollout[]).map((r) => (
                <button key={r} type="button" disabled={busy} onClick={() => holatniTanla(r)} data-rollout={r}
                  aria-pressed={f.rollout === r}
                  className={cn("text-left rounded-xl border px-3 py-2.5 transition-colors disabled:opacity-60",
                    f.rollout === r
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600")}>
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                    {f.rollout === r && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    {HOLAT[r].nom}
                  </span>
                  <span className="block text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5">{HOLAT[r].izoh}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Markazlar ───────────────────────────────────────────────── */}
          {f.rollout !== "OFF" && (
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 flex-1">
                  {`Markazlar · ${yoqilganlar.length} tasida yoqilgan`}
                </p>
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Markaz nomi..."
                    className="h-8 text-[12px] pl-8" />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800">
                {royxat.map((o) => (
                  <MarkazQatori key={o.id} o={o} on={yoqilgan(f, o)} busy={busy}
                    onToggle={(v) => call(`/${f.key}/orgs/${o.id}`, "PUT", { enabled: v })} />
                ))}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">Tugmani bossangiz o&apos;sha markazda darhol yoqiladi yoki o&apos;chadi.</p>
            </div>
          )}

          {/* ── Qo'shimcha: sinov akkauntlari va tarix ─────────────────────── */}
          <div>
            <button type="button" onClick={() => setQoshimcha((v) => !v)}
              className="text-[12px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 inline-flex items-center gap-1">
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", qoshimcha && "rotate-180")} />
              {`Qo'shimcha: sinov akkauntlari va tarix`}
            </button>
            {qoshimcha && (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5" /> Sinov akkauntlari
                  </p>
                  <p className="text-[11.5px] text-neutral-500 mb-2">
                    {"Bu odamlar funksiyani «Hech kimga» holatida ham ko'radi. Boshqa hech kimga ta'sir qilmaydi."}
                  </p>
                  <div className="flex gap-2 max-w-md">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="h-9 text-[13px]" />
                    <Button size="sm" disabled={busy || !phone.trim()} className="h-9 text-[12px] shrink-0"
                      onClick={async () => { if (await call(`/${f.key}/preview`, "POST", { phone })) setPhone(""); }}>
                      Qo&apos;shish
                    </Button>
                  </div>
                  {f.previews.map((p) => (
                    <div key={p.userId} className="mt-1.5 flex items-center gap-2 text-[12px] py-1.5 px-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{p.name}</span>
                      <span className="text-neutral-400 font-mono text-[11px]">{p.phone}</span>
                      {p.orgName && <span className="text-neutral-400">{`· ${p.orgName}`}</span>}
                      <button disabled={busy} onClick={() => call(`/${f.key}/preview/${p.userId}`, "DELETE")}
                        className="ml-auto w-6 h-6 grid place-items-center rounded-md text-neutral-400 hover:text-red-600" aria-label="Olib tashlash">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {f.events.length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> Tarix
                    </p>
                    <div className="space-y-1">
                      {f.events.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 text-[11.5px] text-neutral-500 flex-wrap">
                          <span className="font-mono text-neutral-400 w-24 shrink-0">{fmtDate(e.createdAt)}</span>
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{AMAL[e.action] ?? e.action}</span>
                          <span className="min-w-0 truncate">{tarixMatni(e.detail)}</span>
                          <span className="ml-auto text-neutral-400 shrink-0">{e.actorName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-neutral-400 font-mono">{`${f.key} · yangilangan: ${fmtDate(f.updatedAt)}`}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* "Tanlangan markazlarga": qaysi markazlarda */}
      <Modal open={!!tanlash} onClose={() => setTanlash(null)} title="Qaysi markazlarda yoqilsin?" subtitle={f.label}
        footer={
          <>
            <Button className="flex-1 h-10 text-[13px]" disabled={busy} data-tanlash-saqla
              onClick={async () => {
                if (await call(`/${f.key}/selection`, "PUT", { organizationIds: [...(tanlash ?? [])] })) setTanlash(null);
              }}>
              {busy ? "Saqlanmoqda..." : `Saqlash: ${tanlash?.size ?? 0} ta markaz`}
            </Button>
            <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={() => setTanlash(null)}>Bekor</Button>
          </>
        }>
        <p className="text-[12.5px] text-neutral-600 dark:text-neutral-300">
          {"Faqat belgilangan markazlarda yoqiladi, qolganlarida o'chiq bo'ladi."}
        </p>
        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800">
          {orgs.map((o) => {
            const belgi = tanlash?.has(o.id) ?? false;
            return (
              <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <input type="checkbox" checked={belgi} data-tanlash-markaz={o.subdomain}
                  onChange={() => setTanlash((prev) => {
                    const n = new Set(prev ?? []);
                    if (n.has(o.id)) n.delete(o.id); else n.add(o.id);
                    return n;
                  })} />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{o.name}</span>
                <span className="text-neutral-400 font-mono text-[11px]">{o.subdomain}</span>
                {o.isDemo && <DemoBelgi />}
              </label>
            );
          })}
        </div>
      </Modal>

      {/* "Hech kimga" / "Hamma markazlarga" tasdig'i */}
      <Modal open={!!tasdiq} onClose={() => setTasdiq(null)}
        title={tasdiq === "ALL" ? "Hamma markazlarga yoqilsinmi?" : "Hamma joyda o'chirilsinmi?"} subtitle={f.label}
        footer={
          <>
            <Button className={cn("flex-1 h-10 text-[13px]", tasdiq === "OFF" && "bg-red-600 hover:bg-red-700 text-white")}
              disabled={busy} data-holat-tasdiq
              onClick={async () => { if (await call(`/${f.key}`, "PATCH", { rollout: tasdiq })) setTasdiq(null); }}>
              {busy ? "Saqlanmoqda..." : tasdiq === "ALL" ? "Ha, hamma markazlarga" : "Ha, o'chirish"}
            </Button>
            <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={() => setTasdiq(null)}>Bekor</Button>
          </>
        }>
        <p className="text-[13px] text-neutral-600 dark:text-neutral-300">
          {tasdiq === "ALL"
            ? `«${f.label}» ${orgs.length} ta markazning hammasida yoqiladi. Keyin istalgan markazni alohida o'chirish mumkin.`
            : `«${f.label}» hech bir markazda ko'rinmaydi. Sinov akkauntlari bundan mustasno.`}
        </p>
      </Modal>
    </div>
  );
}

function DemoBelgi() {
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      Demo
    </span>
  );
}

function MarkazQatori({ o, on, busy, onToggle }: {
  o: FeatureOrg; on: boolean; busy: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] py-2 px-3" data-markaz={o.subdomain}>
      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{o.name}</span>
      <span className="text-neutral-400 font-mono text-[11px] hidden sm:inline">{o.subdomain}</span>
      {o.isDemo && <DemoBelgi />}
      {!o.isActive && <span className="text-[10px] text-neutral-400">o&apos;chirilgan markaz</span>}
      <span className={cn("ml-auto text-[11.5px] font-semibold", on ? "text-emerald-600" : "text-neutral-400")}>
        {on ? "Yoqilgan" : "O'chiq"}
      </span>
      <button type="button" disabled={busy} onClick={() => onToggle(!on)} role="switch" aria-checked={on}
        aria-label={on ? `${o.name}: o'chirish` : `${o.name}: yoqish`} data-yoqish={o.subdomain}
        className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60",
          on ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600")}>
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform", on && "translate-x-5")} />
      </button>
    </div>
  );
}

// ─── Markaz bo'yicha ───────────────────────────────────────────────────────

/**
 * Bitta markazni tanlab, unda qaysi funksiyalar ishlashini ko'rish va
 * yoqish. "Mudarris uchun oylik avansini yoqish" kabi ish shu yerda bir bosish.
 */
function MarkazKorinishi({ features, orgs, onChanged }: {
  features: FeatureRow[]; orgs: FeatureOrg[]; onChanged: () => void;
}) {
  const [q, setQ] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const org = orgs.find((o) => o.id === orgId) ?? null;

  const royxat = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orgs.filter((o) => !s || o.name.toLowerCase().includes(s) || o.subdomain.toLowerCase().includes(s));
  }, [orgs, q]);

  async function ozgartir(f: FeatureRow, v: boolean) {
    if (!org) return;
    setBusy(f.key); setErr("");
    // "Hech kimga" holatidagi funksiya: endi FAQAT shu markazda yoqiladi
    // (boshqa demo markazlar o'z-o'zidan yonib ketmaydi).
    const r = f.rollout === "OFF" && v
      ? await admodeFeatureCall(`/${f.key}/selection`, "PUT", { organizationIds: [org.id] })
      : await admodeFeatureCall(`/${f.key}/orgs/${org.id}`, "PUT", { enabled: v });
    setBusy(null);
    if (!r.ok) setErr(r.error); else onChanged();
  }

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 space-y-2 h-fit">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Markazni qidiring..." className="h-9 text-[12.5px] pl-8" />
        </div>
        <div className="max-h-[420px] overflow-y-auto space-y-0.5">
          {royxat.map((o) => (
            <button key={o.id} type="button" onClick={() => setOrgId(o.id)} data-markaz-tanla={o.subdomain}
              className={cn("w-full text-left px-2.5 py-2 rounded-lg text-[12.5px] flex items-center gap-2",
                orgId === o.id ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60")}>
              <span className="truncate">{o.name}</span>
              {o.isDemo && <DemoBelgi />}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5">
        {!org ? (
          <p className="text-[13px] text-neutral-500 py-10 text-center">Chapdan markazni tanlang</p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                {org.name}{org.isDemo && <DemoBelgi />}
              </p>
              <p className="text-[12px] text-neutral-500">
                {`${features.filter((f) => yoqilgan(f, org)).length} ta funksiya yoqilgan`}
              </p>
            </div>
            {err && (
              <p className="text-[12px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {err}
              </p>
            )}
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800">
              {features.map((f) => {
                const on = yoqilgan(f, org);
                return (
                  <div key={f.key} className="flex items-center gap-3 px-3 py-2.5" data-markaz-funksiya={f.key}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{f.label}</p>
                      <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
                        {f.rollout === "OFF"
                          ? "Hozir hech kimda yo'q. Yoqsangiz faqat shu markazda ishlaydi"
                          : f.rollout === "ALL" ? "Hamma markazlarda ochiq" : "Tanlangan markazlarda"}
                      </p>
                    </div>
                    <span className={cn("text-[11.5px] font-semibold", on ? "text-emerald-600" : "text-neutral-400")}>
                      {on ? "Yoqilgan" : "O'chiq"}
                    </span>
                    <button type="button" disabled={busy === f.key} onClick={() => ozgartir(f, !on)}
                      role="switch" aria-checked={on} aria-label={on ? `${f.label}: o'chirish` : `${f.label}: yoqish`}
                      className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60",
                        on ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600")}>
                      <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform", on && "translate-x-5")} />
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-neutral-400">
              {"Yoqilganda markaz egasi funksiyani o'z sozlamasidan ham yoqishi kerak bo'lishi mumkin (masalan, Oylik avansi)."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
