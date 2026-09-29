"use client";

import { type ReactNode, type SelectHTMLAttributes } from "react";
import { groupCourses, guruhlashKerak, type CourseLike } from "@/lib/course-groups";

/**
 * KURS TANLAGICHLARI — YO'NALISH BO'YICHA GURUHLANGAN.
 *
 * Bitta markazda 36 kurs bo'lganda oddiy ro'yxat topib bo'lmas holga
 * keladi (Oxford, 2026-09-29). Yo'nalish ikkitadan kam bo'lsa hech
 * qanday guruhlash chiqmaydi — kichik markazda avvalgidek tekis ro'yxat.
 *
 *  • `CourseSelect` — oddiy `<select>`, `<optgroup>` bilan. Guruh va
 *    o'quvchi formalarida.
 *  • `CourseChipGroups` — chip ro'yxatlari (lidlar) uchun: har yo'nalish
 *    o'z kichik sarlavhasi bilan, chipni chaqiruvchi o'zi chizadi.
 */

export function CourseSelect<T extends CourseLike>({
  courses, value, onChange, placeholder = "Tanlang...", className, ...rest
}: {
  courses: T[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "className">) {
  const groups = groupCourses(courses);
  const grouped = guruhlashKerak(groups);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className} {...rest}>
      <option value="">{placeholder}</option>
      {grouped
        ? groups.map((g) => (
            <optgroup key={g.id || "__boshqa__"} label={g.name}>
              {g.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          ))
        : courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
}

export function CourseChipGroups<T extends CourseLike>({
  courses, renderChip, className = "flex flex-wrap gap-1.5",
}: {
  courses: T[];
  renderChip: (course: T) => ReactNode;
  className?: string;
}) {
  const groups = groupCourses(courses);
  if (!guruhlashKerak(groups)) {
    return <div className={className}>{courses.map(renderChip)}</div>;
  }
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g.id || "__boshqa__"}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
            {g.name}
          </p>
          <div className={className}>{g.courses.map(renderChip)}</div>
        </div>
      ))}
    </div>
  );
}
