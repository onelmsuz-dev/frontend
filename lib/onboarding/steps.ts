import {
  DoorOpen, Layers, ClipboardList, Users, GraduationCap, UserPlus,
  Wallet, UserCheck, type LucideIcon,
} from "lucide-react";

/**
 * "YO'L KO'RSATUVCHI" — qadamlar va tur ssenariysi.
 *
 * Matnlar ATAYLAB faqat shu yerda (backendda emas): matnni tuzatish uchun
 * server deploy qilish kerak bo'lmasin. Backend faqat qadam KALITINI va uning
 * bajarilgan-bajarilmaganini biladi.
 */

/**
 * Turning nishonlari — `data-tour` atributining yagona manbai.
 *
 * Nega doimiy: atributlar 13 ta faylga tarqalgan. Qiymat qo'lda yozilsa,
 * kimdir tugmani ko'chirganda tur jimgina o'lardi. Shu obyekt orqali
 * berilgani uchun grep bitta joydan hammasini topadi.
 */
export const TOUR_TARGETS = {
  headerAction: "header-action",
  settingsTabXonalar: "settings-tab-xonalar",
  roomAddBtn: "room-add-btn",
  roomNameInput: "room-name-input",
  roomSaveBtn: "room-save-btn",
  courseNameInput: "course-name-input",
  courseSubmit: "course-submit",
  teacherNameInput: "teacher-name-input",
  teacherSubmit: "teacher-submit",
  groupCourseSelect: "group-course-select",
  groupTeacherSelect: "group-teacher-select",
  groupRoomSelect: "group-room-select",
  groupSubmit: "group-submit",
  studentNameInput: "student-name-input",
  studentSubmit: "student-submit",
  studentRowFirst: "student-row-first",
  studentEnrollBtn: "student-enroll-btn",
  studentEnrollSelect: "student-enroll-select",
  studentEnrollSubmit: "student-enroll-submit",
} as const;

export interface TourStop {
  /** `data-tour` qiymati. */
  target: string;
  /** Pufakcha sarlavhasi. */
  title: string;
  /** Pufakcha matni. */
  body: string;
}

export interface OnboardingStep {
  key: string;
  /** Ro'yxatdagi sarlavha. */
  title: string;
  /** Bajarilgach ko'rinadigan o'tgan zamon shakli. */
  doneTitle: string;
  /** Bir qatorli izoh — NEGA bu qadam kerakligi. */
  hint: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  /** Qadamni ko'rish uchun kerakli permission. */
  perm: string;
  /** Avval bajarilishi shart bo'lgan qadamlar. */
  dependsOn?: string[];
  /** Progress maxrajiga kiradimi (2-faza kirmaydi). */
  required: boolean;
  /** Tur ssenariysi — nishondan nishonga. */
  stops: TourStop[];
  /** Nishon topilmasa ko'rsatiladigan qo'lda bajarish yo'li. */
  manualHint: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: "xona",
    title: "Xona qo'shing",
    doneTitle: "Xona qo'shildi",
    hint: "Guruh ochish uchun xona majburiy — bir xonada ikkita dars bo'lib qolmasligi uchun.",
    href: "/settings?tab=xonalar",
    cta: "Xona qo'shish",
    icon: DoorOpen,
    perm: "rooms.create",
    required: true,
    manualHint: "Sozlamalar → Xonalar → «Xona qo'shish»",
    stops: [
      // "Xonalar" bo'limini turning O'ZI ochadi (href dagi ?tab=xonalar),
      // shuning uchun "bo'limni oching" to'xtashi YO'Q — u foydalanuvchini
      // allaqachon ochiq bo'limni bosishga majburlardi.
      {
        target: TOUR_TARGETS.roomAddBtn,
        title: "1-qadam · Xona",
        body: "«Xona qo'shish» tugmasini bosing — forma ochiladi.",
      },
      {
        target: TOUR_TARGETS.roomNameInput,
        title: "Nom bering",
        body: "Masalan «1-xona» yoki «Katta zal». Sig'imni ham yozib qo'ying — guruh xonaga sig'masa tizim ogohlantiradi.",
      },
      {
        target: TOUR_TARGETS.roomSaveBtn,
        title: "Saqlang",
        body: "«Saqlash» ni bosing — birinchi qadam tayyor.",
      },
    ],
  },
  {
    key: "kurs",
    title: "Kurs yarating",
    doneTitle: "Kurs yaratildi",
    hint: "Narx va davomiylik shu yerda belgilanadi — guruh kursdan meros oladi.",
    href: "/courses",
    cta: "Yangi kurs",
    icon: Layers,
    perm: "courses.create",
    required: true,
    manualHint: "Kurslar → «Yangi kurs»",
    stops: [
      {
        target: TOUR_TARGETS.headerAction,
        title: "2-qadam · Kurs",
        body: "«Yangi kurs» tugmasini bosing.",
      },
      {
        target: TOUR_TARGETS.courseNameInput,
        title: "Kurs nomi",
        body: "Masalan «Ingliz tili — boshlang'ich». Narxni oylik to'lov sifatida yozing.",
      },
      {
        target: TOUR_TARGETS.courseSubmit,
        title: "Qo'shing",
        body: "«Qo'shish» ni bosing.",
      },
    ],
  },
  {
    key: "oqituvchi",
    title: "O'qituvchi qo'shing",
    doneTitle: "O'qituvchi qo'shildi",
    hint: "O'qituvchiga login yaratiladi — u o'z panelidan davomat belgilaydi.",
    href: "/teachers",
    cta: "O'qituvchi qo'shish",
    icon: ClipboardList,
    perm: "teachers.create",
    required: true,
    manualHint: "O'qituvchilar → «O'qituvchi qo'shish»",
    stops: [
      {
        target: TOUR_TARGETS.headerAction,
        title: "3-qadam · O'qituvchi",
        body: "«O'qituvchi qo'shish» tugmasini bosing.",
      },
      {
        target: TOUR_TARGETS.teacherNameInput,
        title: "Ma'lumotlarini kiriting",
        body: "Telefon raqami uning LOGINI bo'ladi — to'g'ri yozing.",
      },
      {
        target: TOUR_TARGETS.teacherSubmit,
        title: "Qo'shing",
        body: "«Qo'shish» ni bosing.",
      },
    ],
  },
  {
    key: "guruh",
    title: "Guruh oching",
    doneTitle: "Guruh ochildi",
    hint: "Kurs, o'qituvchi, xona va dars kunlari — to'rttasi ham kerak.",
    href: "/groups",
    cta: "Yangi guruh",
    icon: Users,
    perm: "groups.create",
    dependsOn: ["xona", "kurs", "oqituvchi"],
    required: true,
    manualHint: "Guruhlar → «Yangi guruh»",
    stops: [
      {
        target: TOUR_TARGETS.headerAction,
        title: "4-qadam · Guruh",
        body: "«Yangi guruh» tugmasini bosing.",
      },
      {
        target: TOUR_TARGETS.groupCourseSelect,
        title: "Kursni tanlang",
        body: "Guruh narxi shu kursdan olinadi.",
      },
      {
        target: TOUR_TARGETS.groupTeacherSelect,
        title: "O'qituvchini tanlang",
        body: "Oylik hisobi shu biriktiruvga tayanadi.",
      },
      {
        target: TOUR_TARGETS.groupRoomSelect,
        title: "Xonani tanlang",
        body: "Bir xonada ikkita dars bo'lib qolmasligi uchun majburiy. Xona ko'rinmasa — sig'imi guruh hajmidan kichik.",
      },
      {
        target: TOUR_TARGETS.groupSubmit,
        title: "Yarating",
        body: "Dars kunlari va vaqtini belgilab, «Yaratish» ni bosing.",
      },
    ],
  },
  {
    key: "oquvchi",
    title: "O'quvchi qo'shing",
    doneTitle: "O'quvchi qo'shildi",
    hint: "Bittalab qo'shing yoki Excel'dan ommaviy yuklang.",
    href: "/students",
    cta: "Yangi o'quvchi",
    icon: GraduationCap,
    perm: "students.create",
    required: true,
    manualHint: "O'quvchilar → «Yangi o'quvchi»",
    stops: [
      {
        target: TOUR_TARGETS.headerAction,
        title: "5-qadam · O'quvchi",
        body: "«Yangi o'quvchi» tugmasini bosing.",
      },
      {
        target: TOUR_TARGETS.studentNameInput,
        title: "Ism va telefon",
        body: "Shu ikkisi yetarli — qolganini keyin to'ldirasiz.",
      },
      {
        target: TOUR_TARGETS.studentSubmit,
        title: "Saqlang",
        body: "«Saqlash» ni bosing.",
      },
    ],
  },
  {
    key: "biriktirish",
    title: "O'quvchini guruhga biriktiring",
    doneTitle: "O'quvchi guruhga biriktirildi",
    hint: "Biriktirilmagan o'quvchiga davomat ham, hisob-kitob ham ishlamaydi.",
    href: "/students",
    cta: "Guruhga qo'shish",
    icon: UserPlus,
    perm: "students.update",
    dependsOn: ["guruh", "oquvchi"],
    required: true,
    manualHint: "O'quvchilar → o'quvchini oching → «Guruhga qo'shish»",
    stops: [
      {
        target: TOUR_TARGETS.studentRowFirst,
        title: "6-qadam · Biriktirish",
        body: "O'quvchining kartochkasini oching.",
      },
      {
        target: TOUR_TARGETS.studentEnrollBtn,
        title: "Guruhga qo'shish",
        body: "Shu tugmani bosing.",
      },
      {
        target: TOUR_TARGETS.studentEnrollSelect,
        title: "Guruhni tanlang",
        body: "O'quvchi avval sinov darsiga tushadi — keyin faollashtirasiz.",
      },
      {
        target: TOUR_TARGETS.studentEnrollSubmit,
        title: "Biriktiring",
        body: "«Qo'shish» ni bosing — asosiy sozlash tugadi.",
      },
    ],
  },

  // ── 2-faza: majburiy qadamlar tugagach ochiladi ────────────────────────
  {
    key: "tolov",
    title: "Birinchi to'lovni qabul qiling",
    doneTitle: "To'lov qabul qilindi",
    hint: "To'lov kiritilgach qarzdorlar ro'yxati va oylik daromad hisobi ishlaydi.",
    href: "/finance",
    cta: "Moliyani ochish",
    icon: Wallet,
    perm: "payments.create",
    dependsOn: ["biriktirish"],
    required: false,
    manualHint: "Moliya → «To'lov qabul qilish»",
    stops: [],
  },
  {
    key: "davomat",
    title: "Davomat belgilang",
    doneTitle: "Davomat belgilandi",
    hint: "Birinchi darsni belgilang — statistika va avto-SMS shundan boshlanadi.",
    href: "/attendance",
    cta: "Davomatni ochish",
    icon: UserCheck,
    perm: "attendance.mark",
    dependsOn: ["guruh", "biriktirish"],
    required: false,
    manualHint: "Davomat → guruhni tanlang → belgilang",
    stops: [],
  },
];

export const STEP_BY_KEY: Record<string, OnboardingStep> = Object.fromEntries(
  ONBOARDING_STEPS.map((s) => [s.key, s]),
);
