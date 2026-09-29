/**
 * KURS YO'NALISHLARI — bitta guruhlash qoidasi, hamma tanlagich shundan.
 *
 * Markaz kurslarni yo'nalishga bo'ladi ("Tillar", "IT", "Maktab fanlari").
 * Yo'nalishsiz kurslar "Boshqa" bo'lib OXIRIDA turadi. Yo'nalish ikkitadan
 * kam bo'lsa guruhlash ko'rsatilmaydi — kichik markazga ortiqcha qatlam
 * kerak emas (egasining qarori, 2026-09-29).
 */
export interface CourseCategoryLite {
  id: string;
  name: string;
  sortOrder?: number;
}

export interface CourseLike {
  id: string;
  name: string;
  category?: CourseCategoryLite | null;
  categoryId?: string | null;
}

export interface CourseGroup<T extends CourseLike> {
  /** "" — yo'nalishsiz ("Boshqa"). */
  id: string;
  name: string;
  courses: T[];
}

export const BOSHQA = "Boshqa";

export function groupCourses<T extends CourseLike>(courses: T[]): CourseGroup<T>[] {
  const map = new Map<string, CourseGroup<T> & { sort: number }>();
  for (const c of courses) {
    const cat = c.category ?? null;
    const id = cat?.id ?? "";
    if (!map.has(id)) {
      map.set(id, { id, name: cat?.name ?? BOSHQA, courses: [], sort: cat ? (cat.sortOrder ?? 0) : Number.MAX_SAFE_INTEGER });
    }
    map.get(id)!.courses.push(c);
  }
  return [...map.values()]
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
    .map((g) => ({ id: g.id, name: g.name, courses: g.courses }));
}

/** Guruhlash ko'rsatiladimi — kamida ikki xil bo'lim bo'lsa. */
export function guruhlashKerak<T extends CourseLike>(groups: CourseGroup<T>[]): boolean {
  return groups.length >= 2;
}
