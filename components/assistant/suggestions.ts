/**
 * Bo'sh suhbatdagi tayyor savollar — ochiq sahifaga qarab.
 * `perm` bo'lsa faqat shu ruxsati borga ko'rsatiladi: aks holda yordamchi
 * "bu bo'lim haqida ma'lumotim yo'q" deb javob berardi.
 */
export interface Taklif { q: string; perm?: string }

const SAHIFA: Record<string, Taklif[]> = {
  groups: [
    { q: "Guruhni qanday yakunlayman?", perm: "groups.view" },
    { q: "Tugagan guruhni qayta ochsam bo'ladimi?", perm: "groups.view" },
    { q: "\"Bu xona band\" deyapti, nima qilay?", perm: "groups.view" },
  ],
  students: [
    { q: "O'quvchini qanday faollashtiraman?", perm: "students.view" },
    { q: "O'quvchini boshqa guruhga qanday o'tkazaman?", perm: "students.update" },
    { q: "O'quvchi kasal, pul olinmasligi uchun nima qilaman?", perm: "students.update" },
  ],
  settings: [
    { q: "Chegirma qanday qo'shiladi?", perm: "discounts.view" },
    { q: "To'lov oldindan va oxirida farqi nima?", perm: "billing.manage" },
    { q: "Xodimga qanday ruxsat beraman?", perm: "staff.view" },
  ],
  attendance: [
    { q: "Davomat nega belgilanmayapti?", perm: "attendance.view" },
    { q: "Bayram kuniga davomat qo'yiladimi?", perm: "attendance.view" },
  ],
  leads: [
    { q: "Lidni o'quvchiga qanday aylantiraman?", perm: "leads.view" },
    { q: "Sotuvchi nega yangi lidni ko'rmayapti?", perm: "leads.view" },
  ],
  finance: [
    { q: "O'qituvchi oyligi qanday hisoblanadi?", perm: "salaries.view" },
  ],
  sms: [
    { q: "Kelmagan o'quvchining ota-onasiga avtomatik SMS qanday yoqiladi?", perm: "sms.view" },
  ],
  xodimlar: [
    { q: "Xodim nega hamma o'quvchini ko'rmayapti?", perm: "branches.view" },
  ],
};

const UMUMIY: Taklif[] = [
  { q: "Xodim nega hamma o'quvchini ko'rmayapti?", perm: "branches.view" },
  { q: "O'quvchi ketsa qarzi nima bo'ladi?", perm: "students.update" },
  { q: "Qarz qachon yoziladi?", perm: "billing.manage" },
  { q: "O'chirilgan o'quvchini qanday tiklayman?", perm: "trash.view" },
  { q: "Davomat qachon belgilanadi?", perm: "attendance.view" },
];

export function takliflar(pathname: string | null, ruxsat: (k: string) => boolean): string[] {
  const bosh = (pathname ?? "").split("/").filter(Boolean)[0] ?? "";
  const ok = (t: Taklif) => !t.perm || ruxsat(t.perm);
  const out: string[] = [];
  for (const t of [...(SAHIFA[bosh] ?? []), ...UMUMIY]) {
    if (ok(t) && !out.includes(t.q)) out.push(t.q);
    if (out.length === 4) break;
  }
  return out;
}
