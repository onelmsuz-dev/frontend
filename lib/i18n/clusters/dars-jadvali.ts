import type { ClusterDoc } from "./types";

export const ru: ClusterDoc = {
  title: "Расписание занятий для учебного центра — без конфликтов | OneRoom",
  description:
    "Программа расписания для учебного центра: все группы в одном недельном расписании, конфликты кабинетов и преподавателей предотвращаются автоматически. Попробуйте бесплатно.",
  keywords: [
    "расписание занятий учебного центра",
    "программа составления расписания",
    "система расписания учебного центра",
  ],
  serviceType: "Программа расписания занятий для учебного центра",
  eyebrow: "Расписание занятий",
  h1: "Система расписания занятий для учебного центра",
  subtitle:
    "Все группы в одном недельном расписании. Конфликты кабинетов и преподавателей система предотвращает автоматически.",
  heroBullets: [
    "Недельное расписание на одном экране",
    "Нет конфликтов кабинетов и преподавателей",
    "Отображается по датам группы автоматически",
  ],
  painHeading: "Почему расписание на бумаге или в Excel так часто путается?",
  painPoints: [
    {
      title: "Две группы попадают в один кабинет",
      body: "При ручном планировании трудно следить за занятостью кабинетов — две группы одновременно оказываются в одном кабинете.",
    },
    {
      title: "У преподавателя оказывается два занятия одновременно",
      body: "Закрепить за одним преподавателем две группы в одно время — типичная ошибка, которую легко не заметить в бумажном расписании.",
    },
    {
      title: "Обновить расписание забывают",
      body: "Если время группы меняется, это нужно переписать везде — на стенде, в Excel, в Telegram, — и что-то одно обязательно забудется.",
    },
    {
      title: "Объяснять расписание новому ученику долго",
      body: "Новому ученику каждый раз приходится вручную объяснять, в какой день и в каком кабинете у него занятие.",
    },
  ],
  featuresHeading: "Как работает расписание в OneRoom",
  features: [
    {
      title: "Недельный вид",
      body: "Все группы по дням недели и часам в одном расписании — кто когда на занятии, видно с первого взгляда.",
    },
    {
      title: "Контроль конфликтов кабинетов и времени",
      body: "При добавлении занятия система автоматически проверяет занятость кабинета и преподавателя.",
    },
    {
      title: "Вид, соответствующий датам группы",
      body: "Блоки занятий показываются только между датами начала и окончания группы — ещё не начавшаяся или завершённая группа не путает расписание.",
    },
    {
      title: "Быстрое добавление",
      body: "Нового преподавателя или курс можно добавить прямо из расписания, не переходя на отдельную форму.",
    },
  ],
  faqHeading: "Частые вопросы о расписании занятий",
  faq: [
    {
      question: "Как составить расписание занятий учебного центра?",
      answer:
        "Для каждой группы задаются дни недели, время и кабинет — система сама размещает их в недельном расписании. Вести его на бумаге или в отдельном файле Excel больше не нужно.",
    },
    {
      question: "Как убедиться, что две группы не столкнутся в одном кабинете?",
      answer:
        "При добавлении нового занятия или изменении времени система автоматически проверяет, что выбранный кабинет и преподаватель в это время не заняты.",
    },
    {
      question: "Как проверить занятость преподавателя?",
      answer:
        "В разделе расписания отфильтруйте по преподавателю и увидите все его группы и время занятий на одном экране — запланировать два занятия на одно время невозможно.",
    },
    {
      question: "Как расписание показывается ученикам?",
      answer:
        "Каждый ученик в своём личном кабинете видит время занятий только тех групп, в которых он состоит.",
    },
    {
      question: "Если я изменю время группы, расписание обновится автоматически?",
      answer:
        "Да, если в настройках группы изменить время или кабинет, общее расписание и список посещаемости сразу обновятся новыми данными.",
    },
  ],
  leadHeading: "Соберите расписание в одной системе",
  leadDescription:
    "Оставьте имя и номер телефона — мы покажем модуль расписания в течение 7-дневного бесплатного периода.",
  leadCta: "Попробовать бесплатно",
};

export const en: ClusterDoc = {
  title: "Class Scheduling System for Learning Centers — No Room Conflicts | OneRoom",
  description:
    "Class scheduling software for learning centers: all groups in one weekly schedule, with room and teacher conflicts prevented automatically. Try it for free.",
  keywords: [
    "learning center class schedule",
    "class scheduling software",
    "learning center scheduling system",
  ],
  serviceType: "Class scheduling software for learning centers",
  eyebrow: "Class schedule",
  h1: "Class Scheduling System for Learning Centers",
  subtitle:
    "All groups in one weekly schedule. Room and teacher conflicts are prevented automatically by the system.",
  heroBullets: [
    "Weekly schedule on one screen",
    "No room or teacher conflicts",
    "Shown automatically according to the group's dates",
  ],
  painHeading: "Why does a paper or Excel schedule get mixed up so often?",
  painPoints: [
    {
      title: "Two groups end up in the same room",
      body: "With manual planning it is hard to track room availability — two groups land in one room at the same time.",
    },
    {
      title: "A teacher ends up with two classes at once",
      body: "Assigning two groups to one teacher at the same time is a typical mistake that is easy to miss on a paper schedule.",
    },
    {
      title: "Updating the schedule gets forgotten",
      body: "When a group's time changes, it has to be rewritten everywhere — the wall chart, Excel, Telegram — and one of them is bound to be forgotten.",
    },
    {
      title: "Explaining the schedule to a new student takes time",
      body: "Every time a new student arrives you have to explain by hand which day and which room their class is in.",
    },
  ],
  featuresHeading: "How the schedule works in OneRoom",
  features: [
    {
      title: "Weekly view",
      body: "All groups by weekday and hour in one schedule — who is in class when is visible at a glance.",
    },
    {
      title: "Room and time conflict control",
      body: "When you add a lesson, the system automatically checks the availability of the room and the teacher.",
    },
    {
      title: "View that matches the group's dates",
      body: "Lesson blocks are shown only between the group's start and end dates — a group that hasn't started or has finished doesn't clutter the schedule.",
    },
    {
      title: "Quick adding",
      body: "You can add a new teacher or course right from the schedule, without switching to a separate form.",
    },
  ],
  faqHeading: "Frequently asked questions about class scheduling",
  faq: [
    {
      question: "How should a learning center's class schedule be built?",
      answer:
        "For each group you set the weekdays, time and room — the system places them into the weekly schedule automatically. There is no need to keep it on paper or in a separate Excel file.",
    },
    {
      question: "How can I be sure two groups won't clash in one room?",
      answer:
        "When you add a new lesson or change a time, the system automatically checks that the chosen room and teacher are free at that time.",
    },
    {
      question: "How do I check a teacher's availability?",
      answer:
        "In the schedule section, filter by teacher and you will see all their groups and lesson times on one screen — scheduling two lessons at the same time becomes impossible.",
    },
    {
      question: "How is the schedule shown to students?",
      answer:
        "Each student sees, in their personal account, the lesson times of only the groups they belong to.",
    },
    {
      question: "If I change a group's time, does the schedule update automatically?",
      answer:
        "Yes, if a group's time or room is changed in its settings, the overall schedule and the attendance list are updated with the new data immediately.",
    },
  ],
  leadHeading: "Bring your schedule into one system",
  leadDescription:
    "Leave your name and phone number — we will show you the scheduling module during the 7-day free trial.",
  leadCta: "Try it for free",
};
