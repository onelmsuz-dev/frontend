"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { ReceiptUpload } from "@/components/ui/receipt-upload";
import { cn } from "@/lib/utils";
import {
  useSubscription, usePlans, useSubmitSubscriptionRequest, type PlanLimits,
} from "@/lib/hooks/useSubscription";
import { CheckCircle2, AlertTriangle, Clock, Users, Building, UserCog, Receipt } from "lucide-react";

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Kutilmoqda", APPROVED: "Tasdiqlangan", REJECTED: "Rad etilgan",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function UsageBar({ icon: Icon, label, used, max }: { icon: any; label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;
  const danger = pct >= 90;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-300">
          <Icon className="w-3.5 h-3.5 text-neutral-400" /> {label}
        </div>
        <span className={cn("text-[12px] font-semibold", danger ? "text-red-600 dark:text-red-400" : "text-neutral-500")}>
          {used} / {max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", danger ? "bg-red-500" : "bg-neutral-900 dark:bg-neutral-100")}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TarifSection() {
  const { data: sub, isLoading } = useSubscription();
  const { data: plans } = usePlans();
  const { trigger, isMutating } = useSubmitSubscriptionRequest();

  const [showPay, setShowPay] = useState(false);
  const [selPlan, setSelPlan] = useState<PlanLimits | null>(null);
  const [months, setMonths] = useState("1");
  const [note, setNote] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [err, setErr] = useState("");

  function openPay(plan: PlanLimits) {
    setSelPlan(plan); setMonths("1"); setNote(""); setReceiptUrl(""); setErr(""); setShowPay(true);
  }

  async function submit() {
    if (!selPlan) return;
    setErr("");
    try {
      const m = Math.max(1, Math.min(12, Number(months) || 1));
      await trigger({
        plan: selPlan.key, amount: selPlan.price * m, months: m,
        note: note || undefined, receiptUrl: receiptUrl || undefined,
      } as any);
      mutate("/api/subscription");
      setShowPay(false);
    } catch (e: any) {
      setErr(e?.error ?? "Xatolik yuz berdi");
    }
  }

  const daysLeft = sub?.subscription?.daysLeft ?? 0;
  const warning = sub?.subscription?.warning;
  const active = sub?.subscription?.active;
  const hasPending = sub?.requests?.some(r => r.status === "PENDING");

  return (
    <div className="space-y-4">
      {/* Joriy tarif holati */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
        <CardContent className="p-5">
          {isLoading ? (
            <div className="h-16 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
          ) : (
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Joriy tarif</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                    {sub?.limits?.label ?? sub?.plan}
                  </h3>
                  {active ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Faol
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> Muddati tugagan
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-neutral-500 mt-1">{fmtMoney(sub?.limits?.price ?? 0)}/oy</p>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl",
                warning ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              )}>
                <Clock className="w-4 h-4" />
                <span className="text-[13px] font-semibold">{daysLeft} kun qoldi</span>
              </div>
            </div>
          )}

          {warning && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[12px] font-medium text-amber-700 dark:text-amber-400">
                Tarif muddati tugayapti. To'lovni amalga oshiring — aks holda tizim to'xtatilishi mumkin.
              </p>
            </div>
          )}

          {/* Foydalanish */}
          {sub && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UsageBar icon={Users}    label="O'quvchilar" used={sub.usage.students.used} max={sub.usage.students.max} />
              <UsageBar icon={Building} label="Filiallar"   used={sub.usage.branches.used} max={sub.usage.branches.max} />
              <UsageBar icon={UserCog}  label="Xodimlar"    used={sub.usage.staff.used}    max={sub.usage.staff.max} />
            </div>
          )}
        </CardContent>
      </Card>

      {hasPending && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl px-3 py-2.5">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-[12px] font-medium text-blue-700 dark:text-blue-400">
            Sizda tasdiqlanmagan to'lov so'rovi bor. Admin javobini kuting.
          </p>
        </div>
      )}

      {/* Tarif rejalari */}
      <div>
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Tarif rejalari</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(plans ?? []).map(plan => {
            const current = sub?.limits?.key === plan.key;
            return (
              <Card key={plan.key} className={cn(
                "border shadow-none transition-all",
                current ? "border-neutral-900 dark:border-neutral-100 ring-1 ring-neutral-900 dark:ring-neutral-100"
                        : "border-neutral-200 dark:border-neutral-800"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100">{plan.label}</h4>
                    {current && <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold">Joriy</span>}
                  </div>
                  <p className="text-xl font-black text-neutral-900 dark:text-neutral-100">{fmtMoney(plan.price)}<span className="text-[12px] font-medium text-neutral-400">/oy</span></p>
                  <ul className="mt-3 space-y-1.5 text-[12px] text-neutral-600 dark:text-neutral-300">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {plan.maxStudents} o'quvchigacha</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {plan.maxBranches} ta filial</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {plan.maxStaff} ta xodim</li>
                  </ul>
                  <Button size="sm" onClick={() => openPay(plan)} disabled={hasPending}
                    className="w-full mt-4 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
                    <Receipt className="w-3.5 h-3.5 mr-1.5" /> To'lov so'rovi
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* So'rovlar tarixi */}
      {sub && sub.requests.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">To'lov so'rovlari</p>
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
            <CardContent className="p-0">
              {sub.requests.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <div>
                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{r.plan} · {fmtMoney(r.amount)}</p>
                    <p className="text-[11px] text-neutral-400">{new Date(r.createdAt).toLocaleDateString("uz-UZ")} · {r.months} oy</p>
                  </div>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", STATUS_COLOR[r.status])}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* To'lov so'rovi modal */}
      <Modal
        open={showPay}
        onClose={() => setShowPay(false)}
        title="To'lov so'rovi yuborish"
        subtitle={selPlan ? `${selPlan.label} tarifi` : ""}
        size="md"
        footer={
          <>
            <Button onClick={submit} disabled={isMutating}
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
              {isMutating ? "Yuborilmoqda..." : "So'rov yuborish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowPay(false)}>Bekor</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 text-[13px]">
            <div className="flex justify-between"><span className="text-neutral-500">Tarif</span><span className="font-semibold">{selPlan?.label}</span></div>
            <div className="flex justify-between mt-1"><span className="text-neutral-500">Oylik narx</span><span className="font-semibold">{fmtMoney(selPlan?.price ?? 0)}</span></div>
            <div className="flex justify-between mt-1 pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-500">Jami ({months} oy)</span>
              <span className="font-bold">{fmtMoney((selPlan?.price ?? 0) * (Number(months) || 1))}</span>
            </div>
          </div>
          <FormField label="Necha oy">
            <Input type="number" min={1} max={12} value={months} onChange={e => setMonths(e.target.value)} className="h-10" />
          </FormField>
          <FormField label="Chek rasmi" hint="To'lov chekini rasm ko'rinishida yuklang">
            <ReceiptUpload value={receiptUrl} onChange={setReceiptUrl} />
          </FormField>
          <FormField label="Izoh" hint="Ixtiyoriy">
            <Textarea placeholder="To'lov haqida qo'shimcha ma'lumot" value={note} onChange={e => setNote(e.target.value)} rows={2} />
          </FormField>
          {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
