/**
 * LID QO'NG'IROG'INING VAQT HOLATI — kartochka rangini shu hal qiladi.
 *
 * Uch holat, uchtasi ham bir qarashda farqlanishi kerak:
 *   • `kutilmoqda` — vaqti hali kelmagan, tegmaslik mumkin;
 *   • `keldi`      — AYNAN HOZIR shu bilan shug'ullanish kerak (sariq);
 *   • `kechikkan`  — vaqti o'tib ketgan (qizil).
 *
 * "Kechikkan" chegarasi BUGUN BOSHI, ya'ni soat emas, KUN bo'yicha.
 * Soat bo'yicha hisoblasak, ertalab 9:00 ga qo'yilgan qo'ng'iroq 9:01
 * da qizil bo'lib qolardi — operator hali telefonni ko'targancha
 * kartochka "kechikkan" ko'rinardi. Bugun ichida qolgani — sariq,
 * ya'ni "navbatda", kechagi va undan oldingisi — qizil.
 */
export type DueHolat = "yoq" | "kutilmoqda" | "keldi" | "kechikkan";

export function dueHolat(nextContactAt?: string | null, now = new Date()): DueHolat {
  if (!nextContactAt) return "yoq";
  const t = new Date(nextContactAt);
  if (Number.isNaN(t.getTime())) return "yoq";

  const bugun = new Date(now);
  bugun.setHours(0, 0, 0, 0);

  if (t < bugun) return "kechikkan";
  return t <= now ? "keldi" : "kutilmoqda";
}

/** Kartochkadagi matn: "Bugun 15:00", "Ertaga 10:30", "17-sen 15:00". */
export function dueMatn(nextContactAt: string, now = new Date()): string {
  const t = new Date(nextContactAt);
  const bugun = new Date(now); bugun.setHours(0, 0, 0, 0);
  const kun = new Date(t);     kun.setHours(0, 0, 0, 0);
  const farq = Math.round((kun.getTime() - bugun.getTime()) / 86_400_000);

  const soat = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  if (farq === 0)  return `Bugun ${soat}`;
  if (farq === 1)  return `Ertaga ${soat}`;
  if (farq === -1) return `Kecha ${soat}`;
  return `${t.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })} ${soat}`;
}
