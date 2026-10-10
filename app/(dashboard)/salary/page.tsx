"use client";

import { TopHeader } from "@/components/layout/top-header";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTeacherSummary } from "@/lib/hooks/usePanel";
import { salaryDisplay, salaryTypeLabel } from "@/lib/salary";
import { Wallet, Users, BookOpen, TrendingUp, CheckCircle2, Clock, HandCoins } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import { OyNomi, sanaKun, sanaQisqa, type AvansBandi } from "@/lib/salary-advance";

function fmtMoney(v: number) {
  return formatCurrency(v);
}

const UZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
function monthLabel(m: string) {
  const [y, mm] = m.split("-").map(Number);
  return `${UZ_MONTHS[(mm ?? 1) - 1] ?? m} ${y ?? ""}`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg", className)} />;
}

type MeningAvansim = {
  id: string; month: string; advanceSum: number; givenOn: string;
  status: string; carriedFromMonth: string | null;
};

export default function SalaryPage() {
  const { data, isLoading } = useTeacherSummary();
  const salaries: any[] = data?.salaries ?? [];
  const avanslar: MeningAvansim[] = data?.advances ?? [];
  const nextAdvanceDay: string | null = data?.nextAdvanceDay ?? null;

  // Joriy oy avanslari (naqd, ko'chganlarsiz) — tepadagi karta uchun.
  const bugun = new Date();
  const joriyOy = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, "0")}`;
  const shuOy = avanslar.filter((a) => a.month === joriyOy && !a.carriedFromMonth);
  // Oyligi hali hisoblanmagan, lekin avans berilgan oylar.
  const hisoblanmagan = [...new Set(avanslar
    .filter((a) => a.status === "BERILDI" && !salaries.some((s) => s.month === a.month))
    .map((a) => a.month))];

  return (
    <div>
      <TopHeader title="Mening oyligim" subtitle="Oylik hisob-kitob va statistika" />

      <div className="p-5 space-y-5">
        {/* Stat kartalar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : (
            <>
              <StatCard icon={BookOpen} label="Guruhlar" value={String(data?.groupCount ?? 0)} />
              <StatCard icon={Users} label="O'quvchilar" value={String(data?.totalStudents ?? 0)} />
              <StatCard icon={Wallet} label={salaryTypeLabel(data?.salaryType)}
                value={salaryDisplay(data?.salaryType, data?.baseSalary ?? 0)} />
              <StatCard icon={TrendingUp} label="Oxirgi oylik (hisoblangan)"
                value={salaries[0] ? fmtMoney(salaries[0].calculatedSalary) : "—"} />
            </>
          )}
        </div>

        {/* Oylik avansi — berilgan bo'lsa yoki keyingi avans kuni ma'lum bo'lsa */}
        {!isLoading && (shuOy.length > 0 || nextAdvanceDay) && (
          <Card className="border border-indigo-200/70 dark:border-indigo-900/40 shadow-none" data-mening-avansim>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                <HandCoins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                {shuOy.length === 1 && (
                  <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
                    {`${OyNomi(joriyOy)} avansi: ${fmtMoney(shuOy[0].advanceSum)} · ${sanaQisqa(shuOy[0].givenOn)} da berildi`}
                  </p>
                )}
                {shuOy.length > 1 && (
                  <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
                    {`${OyNomi(joriyOy)} avanslari: ${shuOy.length} marta, jami ${fmtMoney(shuOy.reduce((x, a) => x + a.advanceSum, 0))}`}
                  </p>
                )}
                {nextAdvanceDay && (
                  <p className="text-[13px] text-neutral-700 dark:text-neutral-300">{`Avans kuni: ${sanaKun(nextAdvanceDay)}`}</p>
                )}
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">Avans oy oxirida oylikdan ayiriladi.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Oyliklar tarixi */}
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Oyliklar tarixi</p>
          <Card className="border border-white/60 dark:border-white/10 shadow-none">
            <CardContent className="p-0">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 border-b border-white/50 dark:border-white/10 last:border-0">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : salaries.length === 0 && hisoblanmagan.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Hali oylik hisoblanmagan</p>
                </div>
              ) : (
                <>
                {hisoblanmagan.map((m) => (
                  <div key={`h-${m}`} className="px-4 py-3.5 border-b border-white/50 dark:border-white/10 last:border-0">
                    <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{monthLabel(m)}</p>
                    <p className="text-[11.5px] text-neutral-500">
                      {`${OyNomi(m)} hali hisoblanmagan · avans ${fmtMoney(avanslar.filter((a) => a.month === m && a.status === "BERILDI").reduce((x, a) => x + a.advanceSum, 0))} berildi`}
                    </p>
                  </div>
                ))}
                {salaries.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3.5 border-b border-white/50 dark:border-white/10 last:border-0">
                    <div>
                      <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{monthLabel(s.month)}</p>
                      <p className="text-[11px] text-neutral-400">
                        Yig'ilgan: {fmtMoney(s.totalCollected)}
                        {/* `baseSalary` — usuliga qarab yoki so'm, yoki foiz (masalan 50% ish haqi
                            uchun 50). Har doim `fmtMoney` bilan ko'rsatilsa, "Baza: 50 so'm" deb
                            chiqib, birinchi ko'rgan odam buni haqiqiy pul deb o'ylab qolardi. */}
                        {s.baseSalary ? ` · Baza: ${salaryDisplay(data?.salaryType, s.baseSalary)}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-black text-neutral-900 dark:text-neutral-100">
                        {fmtMoney(s.status === "PAID" && s.settledSalary > 0 ? s.settledSalary : s.calculatedSalary)}
                      </p>
                      {(s.advanceTotal ?? 0) > 0 && (
                        <p className="text-[11px] text-neutral-500 tabular-nums" data-oylik-avans>
                          {`Avans: -${fmtMoney(s.advanceTotal)} · Qo'lga: ${fmtMoney(s.salaryRemainder ?? s.calculatedSalary)}`}
                        </p>
                      )}
                      {(s.overAdvance ?? 0) > 0 && s.status === "PAID" && s.overAdvanceAction === "KEYINGI_OY" && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                          {`Ortiqcha avans ${fmtMoney(s.overAdvance)}: keyingi oy oyligidan ushlanadi`}
                        </p>
                      )}
                      {kochganMatn(s.advanceItems) && (
                        <p className="text-[11px] text-neutral-500">{kochganMatn(s.advanceItems)}</p>
                      )}
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold",
                        s.status === "PAID" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")}>
                        {s.status === "PAID"
                          ? <><CheckCircle2 className="w-3 h-3" /> To'langan</>
                          : <><Clock className="w-3 h-3" /> Kutilmoqda</>}
                      </span>
                    </div>
                  </div>
                ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** "Oktabrdan o'tgan avans: 300 000 so'm" — ortiqcha avans shu oyga ko'chgan bo'lsa. */
function kochganMatn(items: AvansBandi[] | undefined): string | null {
  const kochgan = (items ?? []).filter((a) => a.carriedFromMonth);
  if (kochgan.length === 0) return null;
  return `${OyNomi(kochgan[0].carriedFromMonth!)}dan o'tgan avans: `
    + fmtMoney(kochgan.reduce((x, a) => x + a.advanceSum, 0));
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="border border-white/60 dark:border-white/10 shadow-none">
      <CardContent className="p-4">
        <div className="w-9 h-9 rounded-lg glass-soft flex items-center justify-center mb-2">
          <Icon className="w-4 h-4 text-neutral-500" />
        </div>
        <p className="text-lg font-black text-neutral-900 dark:text-neutral-100 leading-tight">{value}</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
