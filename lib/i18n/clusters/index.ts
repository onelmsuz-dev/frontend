/**
 * YECHIM SAHIFALARI — ruscha va inglizcha matnlar reyestri.
 *
 * O'zbekcha manba: `app/<sahifa>/page.tsx` (o'zgarmagan). Bu yerda har bir sahifaning ikonkalari
 * (tilga bog'liq emas, o'zbekcha sahifadagi bilan bir xil tartibda) va Telegramga boradigan
 * ichki manba yorlig'i (administratorlar uchun, o'zbekcha).
 */
import {
  AlertTriangle, Banknote, BarChart3, Bot, CalendarDays, ClipboardCheck, Clock, FileText, GraduationCap,
  Layers, ListChecks, MapPin, MessageSquare, Percent, PieChart, RefreshCw, ShieldCheck, Target, TrendingUp,
  UserCheck, Users, Wallet, Zap, type LucideIcon,
} from "lucide-react";
import type { Locale } from "../config";
import type { ClusterDoc } from "./types";
import * as crm from "./oquv-markaz-crm";
import * as davomat from "./davomat";
import * as tolovlar from "./tolovlar";
import * as qarzdorlik from "./qarzdorlik";
import * as hisobot from "./hisobot";
import * as oyligi from "./oqituvchi-oyligi";
import * as guruh from "./guruh-boshqaruvi";
import * as jadval from "./dars-jadvali";
import * as telegram from "./telegram-bot";
import * as avtomat from "./oquv-markazini-avtomatlashtirish";

interface Entry {
  leadSource: string;
  icons: LucideIcon[];
  ru: ClusterDoc;
  en: ClusterDoc;
}

const CLUSTERS: Record<string, Entry> = {
  "oquv-markaz-crm": { leadSource: "CRM pillar sahifasi", icons: [Target, GraduationCap, Layers, Wallet, ClipboardCheck, BarChart3], ...crm },
  davomat: { leadSource: "Davomat sahifasi", icons: [ClipboardCheck, MessageSquare, Users, BarChart3], ...davomat },
  tolovlar: { leadSource: "To'lovlar sahifasi", icons: [Wallet, Banknote, TrendingUp, PieChart], ...tolovlar },
  qarzdorlik: { leadSource: "Qarzdorlik sahifasi", icons: [AlertTriangle, ListChecks, MessageSquare, TrendingUp], ...qarzdorlik },
  hisobot: { leadSource: "Hisobot sahifasi", icons: [UserCheck, BarChart3, Target, Layers], ...hisobot },
  "oqituvchi-oyligi": { leadSource: "O'qituvchi oyligi sahifasi", icons: [Percent, Banknote, Clock, Users], ...oyligi },
  "guruh-boshqaruvi": { leadSource: "Guruh boshqaruvi sahifasi", icons: [MapPin, CalendarDays, Users, RefreshCw], ...guruh },
  "dars-jadvali": { leadSource: "Dars jadvali sahifasi", icons: [CalendarDays, MapPin, Clock, Zap], ...jadval },
  "telegram-bot": { leadSource: "Telegram bot sahifasi", icons: [Bot, Zap, FileText, ShieldCheck], ...telegram },
  "oquv-markazini-avtomatlashtirish": {
    leadSource: "Avtomatlashtirish sahifasi",
    icons: [ClipboardCheck, Wallet, CalendarDays, BarChart3, Bot, Banknote],
    ...avtomat,
  },
};

export const CLUSTER_SLUGS = Object.keys(CLUSTERS);

export function getClusterEntry(slug: string, locale: Exclude<Locale, "uz">) {
  const e = CLUSTERS[slug];
  if (!e) return null;
  return { doc: e[locale], icons: e.icons, leadSource: e.leadSource };
}
