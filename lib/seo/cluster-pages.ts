// Keyword-cluster landing sahifalarining yagona ro'yxati.
//
// Header menyusi, footer "Yechimlar" ustuni va har bir cluster sahifasidagi
// "Boshqa yechimlar" bloki shu ro'yxatdan o'qiydi — yangi sahifa qo'shilganda
// faqat shu yerga qo'shish kifoya, uch joyda alohida yangilash shart emas.

export interface ClusterPageMeta {
  href: string;
  /** Header/footer menyusidagi qisqa nom. */
  navLabel: string;
  /** Sahifa H1'iga yaqin, breadcrumb va related-link kartalarida ishlatiladi. */
  title: string;
  /** Related-link kartasidagi bir qatorlik tavsif. */
  blurb: string;
}

export const CLUSTER_PAGES: ClusterPageMeta[] = [
  {
    href: "/oquv-markaz-crm",
    navLabel: "O'quv markazi uchun CRM",
    title: "O'quv markazi uchun CRM",
    blurb: "Barcha modullar bitta tizimda — CRM'ning to'liq imkoniyatlari.",
  },
  {
    href: "/davomat",
    navLabel: "Davomat nazorati",
    title: "O'quv markazi davomat dasturi",
    blurb: "Har bir darsda kim keldi, kim kelmadi — bir necha soniyada.",
  },
  {
    href: "/tolovlar",
    navLabel: "To'lovlar",
    title: "O'quv markazi to'lov tizimi",
    blurb: "To'lovlarni qabul qilish va nazorat qilish bitta ekranda.",
  },
  {
    href: "/qarzdorlik",
    navLabel: "Qarzdorlik nazorati",
    title: "O'quv markazi qarzdorlik nazorati",
    blurb: "Qarzdor o'quvchilarni avtomatik aniqlab, eslatma yuboring.",
  },
  {
    href: "/hisobot",
    navLabel: "Hisobot va analitika",
    title: "O'quv markazi hisobot dasturi",
    blurb: "Daromad, davomat va lidlar bo'yicha tayyor hisobotlar.",
  },
  {
    href: "/oqituvchi-oyligi",
    navLabel: "O'qituvchi oyligi",
    title: "O'qituvchilar oyligini hisoblash dasturi",
    blurb: "Foiz, oylik, dars haqi — qaysi usulda ham avtomatik hisoblanadi.",
  },
  {
    href: "/guruh-boshqaruvi",
    navLabel: "Guruh boshqaruvi",
    title: "O'quv markazi guruh boshqaruvi",
    blurb: "Guruhlar, xonalar va o'quvchilar sig'imini bir joydan boshqaring.",
  },
  {
    href: "/dars-jadvali",
    navLabel: "Dars jadvali",
    title: "O'quv markazi dars jadvali tizimi",
    blurb: "Xona va o'qituvchi to'qnashuvisiz haftalik jadval.",
  },
  {
    href: "/telegram-bot",
    navLabel: "Telegram bot va SMS",
    title: "O'quv markazi uchun Telegram bot va SMS xabarnoma",
    blurb: "Ota-onalarga davomat va to'lov haqida avtomatik xabar.",
  },
  {
    href: "/oquv-markazini-avtomatlashtirish",
    navLabel: "To'liq avtomatlashtirish",
    title: "O'quv markazini avtomatlashtirish",
    blurb: "Excel va qog'oz jurnaldan butunlay voz kechish yo'li.",
  },
];
