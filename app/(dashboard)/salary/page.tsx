"use client";

import { TopHeader } from "@/components/layout/top-header";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTeacherSummary } from "@/lib/hooks/usePanel";
import { salaryDisplay, salaryTypeLabel } from "@/lib/salary";
import { Wallet, Users, BookOpen, TrendingUp, CheckCircle2, Clock } from "lucide-react";

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";
}

const UZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
function monthLabel(m: string) {
  const [y, mm] = m.split("-").map(Number);
  return `${UZ_MONTHS[(mm ?? 1) - 1] ?? m} ${y ?? ""}`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg", className)} />;
}

export default function SalaryPage() {
  const { data, isLoading } = useTeacherSummary();
  const salaries: any[] = data?.salaries ?? [];

  return (
    <div>
      <TopHeader title="Mening oyligim" subtitle="Oylik hisob-kitob va statistika" />

      <div className="p-6 max-w-4xl space-y-5">
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
              <StatCard icon={TrendingUp} label="Oxirgi oylik"
                value={salaries[0] ? fmtMoney(salaries[0].calculatedSalary) : "—"} />
            </>
          )}
        </div>

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
              ) : salaries.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Hali oylik hisoblanmagan</p>
                </div>
              ) : (
                salaries.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3.5 border-b border-white/50 dark:border-white/10 last:border-0">
                    <div>
                      <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{monthLabel(s.month)}</p>
                      <p className="text-[11px] text-neutral-400">
                        Yig'ilgan: {fmtMoney(s.totalCollected)}
                        {s.baseSalary ? ` · Baza: ${fmtMoney(s.baseSalary)}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-black text-neutral-900 dark:text-neutral-100">{fmtMoney(s.calculatedSalary)}</p>
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold",
                        s.status === "PAID" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")}>
                        {s.status === "PAID"
                          ? <><CheckCircle2 className="w-3 h-3" /> To'langan</>
                          : <><Clock className="w-3 h-3" /> Kutilmoqda</>}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
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
