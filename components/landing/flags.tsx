import { useId } from "react";
import type { Locale } from "@/lib/i18n/config";

/**
 * Bayroqlar — SVG. Emoji bayroqlar (🇺🇿 🇷🇺 🇬🇧) Windows'da bayroq emas, "UZ" / "RU" harflari bo'lib
 * ko'rinadi, shuning uchun ular ishlatilmaydi. Ramka: yumaloq burchak + ingichka kontur (oq
 * chiziqli Rossiya bayrog'i oq fonda yo'qolib qolmasin).
 */
export function Flag({ locale, className = "" }: { locale: Locale; className?: string }) {
  const uid = useId();
  return (
    <span
      aria-hidden
      className={`inline-block h-4 w-6 shrink-0 overflow-hidden rounded-[5px] shadow-[0_0_0_1px_rgba(15,23,42,0.14)] ${className}`}
    >
      {locale === "uz" && (
        <svg viewBox="0 0 30 15" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect width="30" height="15" fill="#fff" />
          <rect width="30" height="4.7" fill="#0099B5" />
          <rect y="4.7" width="30" height="0.4" fill="#CE1126" />
          <rect y="9.9" width="30" height="0.4" fill="#CE1126" />
          <rect y="10.3" width="30" height="4.7" fill="#1EB53A" />
          <circle cx="4.6" cy="2.4" r="1.8" fill="#fff" />
          <circle cx="5.3" cy="2.4" r="1.5" fill="#0099B5" />
          {[[8.6, 1.1], [10.2, 1.1], [11.8, 1.1], [9.4, 2.4], [11, 2.4], [8.6, 3.7], [10.2, 3.7], [11.8, 3.7]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.32" fill="#fff" />
          ))}
        </svg>
      )}
      {locale === "ru" && (
        <svg viewBox="0 0 30 15" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect width="30" height="5" fill="#fff" />
          <rect y="5" width="30" height="5" fill="#0039A6" />
          <rect y="10" width="30" height="5" fill="#D52B1E" />
        </svg>
      )}
      {locale === "en" && (
        <svg viewBox="0 0 60 30" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <clipPath id={`${uid}-s`}><path d="M0,0 v30 h60 v-30 z" /></clipPath>
          <clipPath id={`${uid}-t`}><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
          <g clipPath={`url(#${uid}-s)`}>
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${uid}-t)`} stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      )}
    </span>
  );
}
