// O'qituvchi maosh hisoblash usullari — backend SalaryType enum bilan mos.

export type SalaryType = "PERCENT" | "FIXED" | "PER_LESSON" | "PER_STUDENT";

export interface SalaryTypeCfg {
  value: SalaryType;
  /** Segment tugmasidagi qisqa nom (rasmga mos) */
  tab: string;
  /** Summa maydoni uchun label */
  fieldLabel: string;
  /** Summa maydoni placeholder */
  placeholder: string;
  /** Birlik: "%" yoki "so'm" */
  unit: "%" | "so'm";
  /** Usul qanday hisoblanishini tushuntiruvchi hint */
  hint: string;
}

export const SALARY_TYPES: SalaryTypeCfg[] = [
  {
    value: "PERCENT",
    tab: "Foiz",
    fieldLabel: "Tushumdan foiz (%)",
    placeholder: "30",
    unit: "%",
    hint: "O'qituvchi o'z guruhlariga oyda tushgan to'lovlarning shu foizini oladi.",
  },
  {
    value: "FIXED",
    tab: "Oylik",
    fieldLabel: "Oylik ish haqi (so'm)",
    placeholder: "3 000 000",
    unit: "so'm",
    hint: "Har oy belgilangan summa to'lanadi (o'quvchi soniga bog'liq emas).",
  },
  {
    value: "PER_LESSON",
    tab: "Dars haqi",
    fieldLabel: "Bir dars haqi (so'm)",
    placeholder: "150 000",
    unit: "so'm",
    hint: "Har o'tilgan (davomat belgilangan) dars uchun shu summa hisoblanadi.",
  },
  {
    value: "PER_STUDENT",
    tab: "Talaba ulushi",
    fieldLabel: "Bir talaba uchun (so'm)",
    placeholder: "200 000",
    unit: "so'm",
    hint: "Guruhlaridagi har bir faol o'quvchi uchun shu summa hisoblanadi.",
  },
];

export const SALARY_CFG: Record<SalaryType, SalaryTypeCfg> = Object.fromEntries(
  SALARY_TYPES.map((s) => [s.value, s]),
) as Record<SalaryType, SalaryTypeCfg>;

function fmtSom(v: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    maximumFractionDigits: 0,
  }).format(v);
}

/** O'qituvchi maoshini usuliga qarab chiroyli ko'rsatadi: "30%", "3 000 000 so'm", "150 000 so'm/dars". */
export function salaryDisplay(salaryType: string | undefined, salary: number): string {
  const cfg = SALARY_CFG[(salaryType as SalaryType) ?? "FIXED"];
  if (!cfg || cfg.value === "PERCENT") return `${salary}%`;
  if (cfg.value === "PER_LESSON") return `${fmtSom(salary)}/dars`;
  if (cfg.value === "PER_STUDENT") return `${fmtSom(salary)}/talaba`;
  return fmtSom(salary);
}

/** Maosh usulining qisqa nomi ("Foiz", "Oylik", ...). */
export function salaryTypeLabel(salaryType: string | undefined): string {
  return SALARY_CFG[(salaryType as SalaryType) ?? "FIXED"]?.tab ?? "Oylik";
}
