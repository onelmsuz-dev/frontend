/**
 * GURUH NARXINI ODAM TILIDA KO'RSATISH.
 *
 * NEGA KERAK. Narx bazada bor, lekin o'quvchi va guruh kartochkalarida
 * KO'RINMASDI: "bu guruh qancha turadi?" degan savolga javob berish uchun
 * kursni alohida ochish kerak edi.
 *
 * Narx REJIMGA qarab boshqa maydondan olinadi — kunlikda dars narxi,
 * modulda modul narxi, kursda butun kurs narxi. Hammasini "oylik" deb
 * ko'rsatish yolg'on bo'lardi, shuning uchun yorlig'i ham qaytariladi.
 *
 * Rejimga xos narx to'ldirilmagan bo'lsa (backend uni oylikdan HOSIL
 * qiladi — bu yerda takrorlanmaydi) oylik narx "oylik" yorlig'i bilan
 * qaytadi: ikkalasi ham rost gap, shunchaki boshqa savolga javob.
 */
export interface NarxManbasi {
  price?: number | null;
  lessonPrice?: number | null;
  modulePrice?: number | null;
  coursePrice?: number | null;
}

export interface GuruhNarxi {
  summa:  number;
  /** "oylik" / "dars" / "modul" / "kurs" */
  yorliq: string;
  /** Shu o'quvchi uchun alohida kelishilgan narxmi. */
  kelishilgan: boolean;
}

export function guruhNarxi(
  mode: string | null | undefined,
  course: NarxManbasi | null | undefined,
  /** A'zolikdagi kelishilgan narx (`priceOverride`) — hammasidan ustun. */
  override?: number | null,
): GuruhNarxi | null {
  if (!course) return null;
  const oylik = course.price ?? null;

  if (typeof override === "number" && override > 0) {
    return { summa: override, yorliq: "oylik", kelishilgan: true };
  }

  const xos =
    mode === "KUNLIK"     ? { s: course.lessonPrice, y: "dars"  }
  : mode === "MODUL"      ? { s: course.modulePrice, y: "modul" }
  : mode === "KURS_UCHUN" ? { s: course.coursePrice, y: "kurs"  }
  : null;

  if (xos && typeof xos.s === "number" && xos.s > 0) {
    return { summa: xos.s, yorliq: xos.y, kelishilgan: false };
  }
  if (typeof oylik === "number" && oylik > 0) {
    return { summa: oylik, yorliq: "oylik", kelishilgan: false };
  }
  return null;
}

/** "600 000 so'm / oylik" — kartochkalarda aynan shu satr chiqadi. */
export function narxMatni(n: GuruhNarxi | null): string | null {
  if (!n) return null;
  return `${n.summa.toLocaleString("uz-UZ")} so'm / ${n.yorliq}`;
}
