import type { ClusterDoc } from "./types";

export const ru: ClusterDoc = {
  title: "Программа управления группами учебного центра | OneRoom",
  description:
    "Программа управления группами в учебном центре: вместимость кабинета проверяется автоматически, активные и ожидающие группы — в одном месте. Попробуйте бесплатно.",
  keywords: [
    "программа управления группами",
    "управление группами учебного центра",
    "база учеников учебного центра",
    "как управлять учениками в учебном центре",
  ],
  serviceType: "Программа управления группами учебного центра",
  eyebrow: "Управление группами",
  h1: "Управление группами в учебном центре",
  subtitle:
    "Управляйте группами, кабинетами и вместимостью из одного места — конфликты кабинетов и лишние записи система предотвращает автоматически.",
  heroBullets: [
    "Вместимость кабинета проверяется автоматически",
    "Активные и ожидающие группы — в одном месте",
    "Преподаватели и ученики закреплены за группами",
  ],
  painHeading: "Почему ведение групп на бумаге или в нескольких файлах приводит к ошибкам?",
  painPoints: [
    {
      title: "Вы создаёте группу, которая не помещается в кабинет",
      body: "При ручном подсчёте вместимости частая ошибка — записать больше учеников, чем реально влезает в кабинет.",
    },
    {
      title: "Трудно помнить, какая группа когда начинается",
      body: "Когда несколько групп стартуют в разные даты, следить за этим вручную — дополнительная нагрузка на администратора.",
    },
    {
      title: "Данные о преподавателях и учениках разрознены",
      body: "Если каждая группа ведётся в отдельном файле, быстро найти, кто в какой группе, становится сложно.",
    },
    {
      title: "Статус группы вручную обновлять забывают",
      body: "Если завершившаяся группа остаётся «активной», в отчётах и расписании продолжают появляться неверные данные.",
    },
  ],
  featuresHeading: "Как работает управление группами в OneRoom",
  features: [
    {
      title: "Контроль вместимости кабинета",
      body: "При создании группы предлагаются только подходящие по вместимости кабинеты активного филиала — записать лишних учеников невозможно.",
    },
    {
      title: "Активные и ожидающие группы в одном месте",
      body: "Группы, дата начала которых ещё не наступила, тоже видны в списке — ни одна группа не остаётся без внимания.",
    },
    {
      title: "Закрепление учеников и преподавателя",
      body: "Преподавателя и учеников группы закрепляют из одного места — изменения сразу отражаются в расписании и посещаемости.",
    },
    {
      title: "Статус обновляется автоматически",
      body: "Состояние группы (ожидает / активна / завершена) отслеживается системой по датам начала и окончания.",
    },
  ],
  faqHeading: "Частые вопросы об управлении группами",
  faq: [
    {
      question: "Как правильно управлять группами в учебном центре?",
      answer:
        "Каждую группу вы создаёте в одной системе вместе с курсом, преподавателем, кабинетом и расписанием. OneRoom автоматически проверяет вместимость группы, занятость кабинета и даты, предотвращая ошибки.",
    },
    {
      question: "Сколько групп помещается в один кабинет одновременно?",
      answer:
        "При создании группы предлагаются только кабинеты, подходящие по вместимости и не занятые в это время, — записать лишнего ученика или столкнуть две группы в одном кабинете невозможно.",
    },
    {
      question: "Как автоматически обновляется статус группы?",
      answer:
        "Состояние группы (ожидает, активна, завершена) отслеживается системой по дате начала и окончания — риск забыть вручную сменить статус исчезает.",
    },
    {
      question: "Как закрепить преподавателя за группой?",
      answer:
        "В форме создания или редактирования группы вы выбираете преподавателя — этот выбор сразу отражается в расписании, посещаемости и расчёте зарплаты.",
    },
    {
      question: "Название группы присваивается автоматически?",
      answer:
        "Да, при выборе курса и преподавателя система предлагает название в формате «Название курса — Преподаватель», при желании его можно изменить.",
    },
  ],
  leadHeading: "Соберите группы в одной системе",
  leadDescription:
    "Оставьте имя и номер телефона — мы покажем модуль управления группами в течение 7-дневного бесплатного периода.",
  leadCta: "Попробовать бесплатно",
};

export const en: ClusterDoc = {
  title: "Group Management Software for Learning Centers | OneRoom",
  description:
    "Group management software for learning centers: room capacity is checked automatically, and active and upcoming groups are in one place. Try it for free.",
  keywords: [
    "group management software",
    "learning center group management",
    "learning center student database",
    "how to manage students in a learning center",
  ],
  serviceType: "Group management software for learning centers",
  eyebrow: "Group management",
  h1: "Group Management for Learning Centers",
  subtitle:
    "Manage groups, rooms and capacity from one place — room conflicts and over-enrollment are prevented automatically by the system.",
  heroBullets: [
    "Room capacity is checked automatically",
    "Active and upcoming groups in one place",
    "Teachers and students are assigned",
  ],
  painHeading: "Why does keeping groups on paper or in several files cause mistakes?",
  painPoints: [
    {
      title: "You create a group that doesn't fit in the room",
      body: "When capacity is calculated by hand, enrolling more students than the room can hold is a common mistake.",
    },
    {
      title: "It's hard to remember when each group starts",
      body: "When several groups start on different dates, tracking this by hand is an extra burden on the administrator.",
    },
    {
      title: "Teacher and student data is scattered",
      body: "If each group is kept in a separate file, quickly finding who is in which group gets difficult.",
    },
    {
      title: "Updating a group's status by hand gets forgotten",
      body: "If a finished group stays \"active\", wrong data keeps appearing in reports and the schedule.",
    },
  ],
  featuresHeading: "How group management works in OneRoom",
  features: [
    {
      title: "Room capacity control",
      body: "When you create a group, only rooms of the active branch that fit the capacity are offered — enrolling extra students is impossible.",
    },
    {
      title: "Active and upcoming groups in one place",
      body: "Groups whose start date hasn't arrived yet also appear in the list — no group is left unattended.",
    },
    {
      title: "Assigning students and teachers",
      body: "A group's teacher and students are assigned from one place — changes are immediately reflected in the schedule and attendance.",
    },
    {
      title: "Status updates automatically",
      body: "A group's state (pending / active / finished) is tracked by the system according to its start and end dates.",
    },
  ],
  faqHeading: "Frequently asked questions about group management",
  faq: [
    {
      question: "How should groups be managed in a learning center?",
      answer:
        "You create each group in one system together with its course, teacher, room and schedule. OneRoom automatically checks group capacity, room availability and dates to prevent mistakes.",
    },
    {
      question: "How many groups fit in one room at the same time?",
      answer:
        "When a group is created, only rooms that fit its capacity and are free at that time are offered — enrolling an extra student or clashing two groups in one room is impossible.",
    },
    {
      question: "How is a group's status updated automatically?",
      answer:
        "A group's state (pending, active, finished) is tracked by the system from its start and end dates — the risk of forgetting to change the status by hand disappears.",
    },
    {
      question: "How do I assign a teacher to a group?",
      answer:
        "In the group creation or editing form you choose the teacher — this choice is immediately reflected in the schedule, attendance and salary calculation.",
    },
    {
      question: "Is the group name assigned automatically?",
      answer:
        "Yes, once a course and teacher are selected the system suggests a name in the format \"Course name — Teacher\"; you can change it if you wish.",
    },
  ],
  leadHeading: "Bring your groups into one system",
  leadDescription:
    "Leave your name and phone number — we will show you the group management module during the 7-day free trial.",
  leadCta: "Try it for free",
};
