/**
 * ARIZA SAHIFASI MAVZULARI — 4 ta tayyor variant.
 *
 * SOF CSS, RASM YO'Q. Markaz fon rasmini yuklasa uni saqlash, o'lchamini
 * cheklash va har ochilishda yuklash kerak bo'lardi — reklamadan kelgan
 * odam esa sahifa sekin ochilsa chiqib ketadi. Gradientning og'irligi
 * nol va u har ekranda bir xil chiqadi.
 *
 * Har mavzu TO'LIQ to'plam beradi (fon, dog'lar, tugma, urg'u), ya'ni
 * sahifada "qaysi rang qayerdan" degan savol tug'ilmaydi va yangi mavzu
 * qo'shish bitta obyekt yozish bilan cheklanadi.
 */

export type TargetTheme =
  | "BINAFSHA" | "OKEAN" | "ILIQ" | "TUN"
  | "YASHIL" | "GULOBI" | "QUMLI" | "TONG";

export interface Mavzu {
  kalit: TargetTheme;
  nom: string;
  /** Sozlamadagi namuna uchun — kichik doiradagi gradient. */
  namuna: string;
  /** Sahifa foni. */
  fon: string;
  /** Ikki yumshoq nur dog'i. */
  dog1: string;
  dog2: string;
  /** Sarlavha va oddiy matn. */
  sarlavha: string;
  tavsif: string;
  /** Forma kartochkasi. */
  karta: string;
  /** Kirish maydonlari. */
  maydon: string;
  maydonYorliq: string;
  /** Asosiy tugma. */
  tugma: string;
  /** Pastdagi mayda yozuv. */
  mayda: string;
}

export const MAVZULAR: Mavzu[] = [
  {
    kalit: "BINAFSHA", nom: "Binafsha",
    namuna: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    fon: "bg-[#fbfbfd]",
    dog1: "bg-indigo-400/20", dog2: "bg-violet-400/15",
    sarlavha: "text-neutral-900", tavsif: "text-neutral-500",
    karta: "bg-white border-neutral-200/80 shadow-xl shadow-neutral-900/5",
    maydon: "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus-within:border-indigo-500 focus-within:ring-indigo-500/20",
    maydonYorliq: "text-neutral-600",
    tugma: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-600/25",
    mayda: "text-neutral-400",
  },
  {
    kalit: "OKEAN", nom: "Okean",
    namuna: "linear-gradient(135deg,#0ea5e9,#14b8a6)",
    fon: "bg-[#f7fbfd]",
    dog1: "bg-sky-400/20", dog2: "bg-teal-400/15",
    sarlavha: "text-slate-900", tavsif: "text-slate-500",
    karta: "bg-white border-slate-200/80 shadow-xl shadow-slate-900/5",
    maydon: "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-within:border-sky-500 focus-within:ring-sky-500/20",
    maydonYorliq: "text-slate-600",
    tugma: "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-sky-600/25",
    mayda: "text-slate-400",
  },
  {
    kalit: "ILIQ", nom: "Iliq",
    namuna: "linear-gradient(135deg,#f59e0b,#f97316)",
    fon: "bg-[#fffaf5]",
    dog1: "bg-amber-400/20", dog2: "bg-orange-400/15",
    sarlavha: "text-stone-900", tavsif: "text-stone-500",
    karta: "bg-white border-stone-200/80 shadow-xl shadow-stone-900/5",
    maydon: "border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus-within:border-amber-500 focus-within:ring-amber-500/20",
    maydonYorliq: "text-stone-600",
    tugma: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/25",
    mayda: "text-stone-400",
  },
  {
    /* QORONG'I MAVZU — `dark:` variantlariga TAYANMAYDI.
       Ariza sahifasini ochgan odamning tizim sozlamasi bizga
       bog'liq emas: markaz "qorong'i" desa, u har qurilmada
       qorong'i chiqishi kerak. */
    kalit: "TUN", nom: "Tun",
    namuna: "linear-gradient(135deg,#1e293b,#4f46e5)",
    fon: "bg-[#0b0b10]",
    dog1: "bg-indigo-500/20", dog2: "bg-fuchsia-500/10",
    sarlavha: "text-white", tavsif: "text-neutral-400",
    karta: "bg-neutral-900 border-white/10 shadow-2xl shadow-black/40",
    maydon: "border-white/15 bg-neutral-950 text-neutral-100 placeholder:text-neutral-500 focus-within:border-indigo-400 focus-within:ring-indigo-400/20",
    maydonYorliq: "text-neutral-300",
    tugma: "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 shadow-indigo-500/25",
    mayda: "text-neutral-600",
  },
  {
    kalit: "YASHIL", nom: "Yashil",
    namuna: "linear-gradient(135deg,#10b981,#84cc16)",
    fon: "bg-[#f7fdf9]",
    dog1: "bg-emerald-400/20", dog2: "bg-lime-400/15",
    sarlavha: "text-neutral-900", tavsif: "text-neutral-500",
    karta: "bg-white border-neutral-200/80 shadow-xl shadow-neutral-900/5",
    maydon: "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus-within:border-emerald-500 focus-within:ring-emerald-500/20",
    maydonYorliq: "text-neutral-600",
    tugma: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/25",
    mayda: "text-neutral-400",
  },
  {
    kalit: "GULOBI", nom: "Gulobi",
    namuna: "linear-gradient(135deg,#ec4899,#f472b6)",
    fon: "bg-[#fff8fb]",
    dog1: "bg-pink-400/20", dog2: "bg-rose-400/15",
    sarlavha: "text-neutral-900", tavsif: "text-neutral-500",
    karta: "bg-white border-pink-200/70 shadow-xl shadow-pink-900/5",
    maydon: "border-pink-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus-within:border-pink-500 focus-within:ring-pink-500/20",
    maydonYorliq: "text-neutral-600",
    tugma: "bg-pink-600 hover:bg-pink-700 active:bg-pink-800 shadow-pink-600/25",
    mayda: "text-neutral-400",
  },
  {
    /* QUMLI — eng sokin variant. Rang e'tiborni tortmaydi, ya'ni
       markazning O'Z logotipi va matni butun e'tiborni oladi. */
    kalit: "QUMLI", nom: "Qumli",
    namuna: "linear-gradient(135deg,#d6d3d1,#a8a29e)",
    fon: "bg-[#faf9f7]",
    dog1: "bg-stone-300/30", dog2: "bg-stone-400/15",
    sarlavha: "text-stone-900", tavsif: "text-stone-500",
    karta: "bg-white border-stone-200 shadow-lg shadow-stone-900/5",
    maydon: "border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus-within:border-stone-700 focus-within:ring-stone-700/15",
    maydonYorliq: "text-stone-600",
    tugma: "bg-stone-800 hover:bg-stone-900 active:bg-black shadow-stone-800/25",
    mayda: "text-stone-400",
  },
  {
    kalit: "TONG", nom: "Tong",
    namuna: "linear-gradient(135deg,#fb7185,#fb923c)",
    fon: "bg-[#fffaf8]",
    dog1: "bg-rose-400/25", dog2: "bg-orange-400/20",
    sarlavha: "text-neutral-900", tavsif: "text-neutral-500",
    karta: "bg-white border-orange-200/70 shadow-xl shadow-orange-900/5",
    maydon: "border-orange-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus-within:border-orange-500 focus-within:ring-orange-500/20",
    maydonYorliq: "text-neutral-600",
    tugma: "bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-orange-500/25",
    mayda: "text-neutral-400",
  },
];

export const mavzuOl = (k: string | null | undefined): Mavzu =>
  MAVZULAR.find((m) => m.kalit === k) ?? MAVZULAR[0];
