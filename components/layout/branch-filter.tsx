"use client";

import { useBranch } from "@/lib/contexts/branch-context";
import { cn } from "@/lib/utils";

/**
 * Filtr qatoridagi FILIAL tanlagichi.
 *
 * Tepadagi almashtirgich bilan BIR XIL holatni boshqaradi — alohida
 * "sahifa filtri" emas. Ikkitasi alohida bo'lsa, foydalanuvchi tepada
 * "Chilonzor" turganda ro'yxatda "Yunusobod"ni tanlab, qaysi biri
 * ishlayotganini bilmay qolardi.
 *
 * Bitta filialli markazda umuman chizilmaydi: tanlash uchun narsa yo'q.
 */
export function BranchFilter({ className }: { className?: string }) {
  const { branches, activeBranchId, setActiveBranchId, kopFilial } = useBranch();
  if (!kopFilial) return null;

  return (
    <select
      value={activeBranchId ?? ""}
      onChange={(e) => setActiveBranchId(e.target.value || null)}
      aria-label="Filial"
      className={cn(
        "text-xs h-9 px-2.5 rounded-lg border border-white/60 dark:border-white/10 glass-soft",
        "text-neutral-700 dark:text-neutral-300 outline-none focus:border-indigo-500 transition-colors",
        className,
      )}
    >
      <option value="">Barcha filiallar</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
}

/**
 * Forma ichidagi FILIAL tanlagichi — yangi yozuv qaysi filialga tushadi.
 *
 * Filtrdan farqi: bu yerda tanlov YOZUVGA tegishli, ekranga emas, va u
 * global holatni o'zgartirmaydi. Bitta filialli markazda ham chizilmaydi —
 * u yerda javob bitta va backend uni o'zi qo'yadi.
 */
export function BranchPicker({
  value,
  onChange,
  className,
  hammasiLabel = "Barcha filiallar uchun umumiy",
  hammasiOchiq = true,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  /** "Filialsiz" variantining matni. */
  hammasiLabel?: string;
  /** Filialsiz qoldirish mumkinmi (kurs — ha, guruh — yo'q). */
  hammasiOchiq?: boolean;
}) {
  const { branches, kopFilial } = useBranch();
  if (!kopFilial) return null;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10",
        "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100",
        "outline-none focus:border-indigo-500 transition-colors",
        className,
      )}
    >
      <option value="">{hammasiOchiq ? hammasiLabel : "Filialni tanlang"}</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
}
