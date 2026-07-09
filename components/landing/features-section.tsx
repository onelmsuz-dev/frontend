import {
  Users,
  CreditCard,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  UserPlus,
  Building2,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: UserPlus,
    title: "CRM va Lidlar",
    description:
      "Yangi mijozlarni kuzatib boring: qo'ng'iroq, demo, shartnoma — har bir bosqichni nazorat qiling.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: Users,
    title: "O'quvchilar bazasi",
    description:
      "Har bir o'quvchi haqida to'liq ma'lumot: guruh, kurs, to'lov tarixi va davomot — bir joyda.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: CreditCard,
    title: "Moliya va To'lovlar",
    description:
      "Oylik to'lovlarni kuzating, qarzdorlarni avtomatik aniqlang. Kassa hisoboti bir zumda tayyor.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: CalendarDays,
    title: "Dars Jadvali",
    description:
      "Xona va o'qituvchilar bo'yicha jadval tuzing. Ziddiyatlarni oldini olish uchun aqlli tekshiruv.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    icon: ClipboardCheck,
    title: "Davomot nazorati",
    description:
      "Har darsda davomatni belgilang. Ota-onalarga real vaqtda xabar yuboring. QR kod orqali belgilash.",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    icon: BarChart3,
    title: "Hisobotlar va Tahlil",
    description:
      "Daromad, o'quvchilar soni, davomot foizi — grafik shaklda. PDF va Excel eksport.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
  },
  {
    icon: Building2,
    title: "Ko'p filial boshqaruvi",
    description:
      "Bir akkountdan barcha filiallarni boshqaring. Har bir filial uchun alohida hisobot.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    icon: Bell,
    title: "Avtomatik bildirishnomalar",
    description:
      "To'lov eslatmalari, dars bekor qilish xabarlari — barchasi Telegram bot orqali avtomatik.",
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-100",
  },
];

function SectionHeader() {
  return (
    <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-12 lg:mb-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3">
        Imkoniyatlar
      </p>
      <h2
        id="features-heading"
        className="text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl"
      >
        O'quv markazingizni boshqarish uchun{" "}
        <span className="text-blue-600">hamma narsa</span>
      </h2>
      <p className="mt-4 text-base text-slate-600 sm:text-lg">
        OneRoom — o'nlab alohida dasturlarni almashtiruvchi yagona platforma.
        O'rnatish shart emas, brauzerdan ishlaydi.
      </p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-16 sm:py-20 lg:py-28 bg-white"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`group rounded-2xl border bg-white p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${feature.border}`}
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}
                  aria-hidden="true"
                >
                  <Icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="text-[0.9375rem] font-semibold text-slate-900 leading-snug">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
