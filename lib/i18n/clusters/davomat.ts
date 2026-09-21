import type { ClusterDoc } from "./types";

export const ru: ClusterDoc = {
  title: "Программа учёта посещаемости для учебного центра | OneRoom",
  description:
    "Программа посещаемости для учебного центра: кто пришёл на занятие, а кто нет — за несколько секунд. Автоматическое уведомление родителей об отсутствии. Попробуйте бесплатно.",
  keywords: [
    "программа посещаемости для учебного центра",
    "учёт посещаемости учеников",
    "система посещаемости учеников",
    "посещаемость в учебном центре",
    "автоматизация учёта посещаемости",
    "контроль посещаемости учеников",
    "онлайн-система посещаемости",
    "электронный журнал посещаемости",
  ],
  serviceType: "Программа контроля посещаемости для учебного центра",
  eyebrow: "Контроль посещаемости",
  h1: "Программа посещаемости для учебного центра",
  subtitle:
    "Вместо бумажного журнала — на каждом занятии за несколько секунд отмечается, кто пришёл, кто не пришёл, кто опоздал. Сообщение родителям отправляется автоматически.",
  heroBullets: [
    "Вся группа отмечается за 1 минуту",
    "Автоматическое сообщение об отсутствии",
    "Готовый отчёт по посещаемости в конце месяца",
  ],
  painHeading: "Чем плох учёт посещаемости на бумаге?",
  painSubheading: "Многие учебные центры до сих пор используют тетрадь или Excel — и именно здесь начинаются проблемы.",
  painPoints: [
    {
      title: "Тетради теряются, данные разрознены",
      body: "У каждого преподавателя свой журнал — общую картину директор видит только в конце месяца, собрав всё вручную.",
    },
    {
      title: "Родители узнают о пропуске слишком поздно",
      body: "О том, что ребёнок пропустил занятие, родители узнают через несколько дней, а иногда не узнают совсем — это снижает доверие к центру.",
    },
    {
      title: "Подсчёты в конце месяца занимают часы",
      body: "Считать процент посещаемости и число пропусков вручную — работа, которая съедает весь день администратора.",
    },
    {
      title: "Опоздания и уважительные причины не фиксируются",
      body: "В тетради есть только «пришёл/не пришёл», поэтому опоздавшие и пропустившие по уважительной причине выглядят так же, как остальные.",
    },
  ],
  featuresHeading: "Как работает посещаемость в OneRoom",
  featuresSubheading: "Одна система — от отметки до сообщения родителям.",
  features: [
    {
      title: "4 статуса — точная картина",
      body: "Пришёл, не пришёл, опоздал или уважительная причина — состояние каждого ученика отмечается одним нажатием. Порог опоздания в минутах настраивается под ваш центр.",
    },
    {
      title: "Автоматическое сообщение родителям",
      body: "Если ученик не пришёл на занятие, родителям сразу уходит сообщение в Telegram-бот или по SMS — звонить вручную не нужно.",
    },
    {
      title: "Быстрая отметка по группе",
      body: "Преподаватель открывает занятие, список группы появляется автоматически, и за несколько секунд отмечаются все ученики.",
    },
    {
      title: "Динамика посещаемости в отчётах",
      body: "Процент посещаемости по каждой группе, ученику и месяцу автоматически виден в разделе отчётов — вы сразу видите, кто часто пропускает.",
    },
  ],
  steps: [
    { title: "Выберите группу и дату", body: "Преподаватель или администратор открывает нужную группу в ежедневном расписании." },
    { title: "Отметьте статус каждого ученика", body: "Пришёл, не пришёл, опоздал или уважительная причина — достаточно одного нажатия." },
    { title: "Сохраните — сообщение уйдёт автоматически", body: "Родителям отсутствующего ученика сразу отправляется сообщение в Telegram или по SMS." },
  ],
  faqHeading: "Частые вопросы о посещаемости",
  faq: [
    {
      question: "Как вести учёт посещаемости в учебном центре?",
      answer:
        "Самый надёжный способ — электронная система вместо бумажного журнала. В начале каждого занятия преподаватель открывает список группы и для каждого ученика отмечает статус: «Пришёл», «Не пришёл», «Опоздал» или «Уважительная причина». Данные сохраняются сразу и не теряются.",
    },
    {
      question: "Кто отмечает посещаемость — администратор или преподаватель?",
      answer:
        "В OneRoom каждый преподаватель из своего кабинета отмечает посещаемость только тех групп, которые за ним закреплены. Администратор может просматривать посещаемость по всем группам и при необходимости исправлять её.",
    },
    {
      question: "Как родителям сообщается о посещаемости?",
      answer:
        "Если ученик не пришёл на занятие или пропустил без причины, родителям автоматически отправляется сообщение через Telegram-бот или по SMS — администратору или преподавателю не нужно звонить вручную.",
    },
    {
      question: "Как учитывается опоздание ученика?",
      answer:
        "Ученик, пришедший в пределах заданного числа минут после начала занятия, автоматически отмечается как «Опоздал». Этот порог настраивается под правила вашего центра.",
    },
    {
      question: "Где смотреть статистику посещаемости?",
      answer:
        "В разделе отчётов процент и динамика посещаемости по каждой группе, ученику и месяцу считаются автоматически — вы сразу видите, какой ученик часто пропускает занятия.",
    },
    {
      question: "Можно ли бесплатно попробовать учёт посещаемости в OneRoom?",
      answer:
        "Да, в течение 7-дневного бесплатного периода модуль посещаемости полностью открыт — данные карты не нужны. Оставьте заявку в форме ниже, и мы сами свяжемся с вами.",
    },
  ],
  leadHeading: "Переведите посещаемость в цифру",
  leadDescription:
    "Оставьте имя и номер телефона — мы покажем модуль посещаемости в течение 7-дневного бесплатного периода.",
  leadCta: "Попробовать бесплатно",
};

export const en: ClusterDoc = {
  title: "Attendance Software for Learning Centers | OneRoom",
  description:
    "Attendance software for learning centers: who came to class and who didn't — in seconds. Automatic notification to parents when a student is absent. Try it for free.",
  keywords: [
    "learning center attendance software",
    "student attendance tracking",
    "student attendance system",
    "attendance in a learning center",
    "attendance automation",
    "student attendance control",
    "online attendance system",
    "electronic attendance register",
  ],
  serviceType: "Attendance tracking software for learning centers",
  eyebrow: "Attendance tracking",
  h1: "Attendance Software for Learning Centers",
  subtitle:
    "Instead of a paper register — who came, who was absent and who was late is marked in seconds at every lesson. Parents are notified automatically.",
  heroBullets: [
    "Mark the whole group in 1 minute",
    "Automatic message when a student is absent",
    "A ready attendance report at the end of the month",
  ],
  painHeading: "Why is paper attendance so hard to keep up?",
  painSubheading: "Many learning centers still use a notebook or Excel — and this is exactly where the problems begin.",
  painPoints: [
    {
      title: "Notebooks get lost, data is scattered",
      body: "Every teacher keeps a separate register — the director sees the overall picture only at the end of the month, after collecting everything by hand.",
    },
    {
      title: "Parents find out about absences too late",
      body: "Parents learn that their child missed a class several days later, sometimes not at all — which erodes trust in the center.",
    },
    {
      title: "Month-end calculations take hours",
      body: "Counting attendance percentages and the number of absences by hand eats up an administrator's entire day.",
    },
    {
      title: "Late arrivals and excused absences are not recorded",
      body: "A notebook only says \"present/absent\", so students who were late or excused look the same as everyone else.",
    },
  ],
  featuresHeading: "How attendance works in OneRoom",
  featuresSubheading: "One system — from marking to messaging parents.",
  features: [
    {
      title: "4 statuses — an accurate picture",
      body: "Present, absent, late or excused — each student's status is marked with one tap. The late threshold in minutes is set to fit your center.",
    },
    {
      title: "Automatic message to parents",
      body: "If a student doesn't come to class, parents immediately get a message through the Telegram bot or SMS — no manual calls.",
    },
    {
      title: "Quick marking by group",
      body: "The teacher opens the lesson, the group list appears automatically, and all students are marked within seconds.",
    },
    {
      title: "Attendance trends in reports",
      body: "Attendance rates by group, student and month appear automatically in the Reports section — you see right away who skips often.",
    },
  ],
  steps: [
    { title: "Choose the group and date", body: "The teacher or administrator opens the right group from the daily schedule." },
    { title: "Mark each student's status", body: "Present, absent, late or excused — one tap is enough." },
    { title: "Save — the message goes out automatically", body: "Parents of an absent student immediately receive a message on Telegram or by SMS." },
  ],
  faqHeading: "Frequently asked questions about attendance",
  faq: [
    {
      question: "How should attendance be tracked in a learning center?",
      answer:
        "The most reliable way is an electronic system instead of a paper register. At the start of each lesson the teacher opens the group list and marks each student as \"Present\", \"Absent\", \"Late\" or \"Excused\". The data is saved immediately and is never lost.",
    },
    {
      question: "Who marks attendance — the administrator or the teacher?",
      answer:
        "In OneRoom each teacher marks attendance from their own account, only for the groups assigned to them. The administrator can view attendance for all groups and correct it when needed.",
    },
    {
      question: "How are parents told about attendance?",
      answer:
        "If a student misses a class without a reason, parents automatically receive a message through the Telegram bot or SMS — the administrator or teacher does not have to call by hand.",
    },
    {
      question: "How is a late student counted?",
      answer:
        "A student who arrives within the set number of minutes after the lesson starts is automatically marked \"Late\". This threshold is adjusted to your center's rules.",
    },
    {
      question: "Where can I see attendance statistics?",
      answer:
        "In the Reports section, attendance rates and trends by group, student and month are calculated automatically — you can immediately see which student skips lessons often.",
    },
    {
      question: "Can I try attendance tracking in OneRoom for free?",
      answer:
        "Yes, during the 7-day free trial the attendance module is fully open — no card details required. Leave a request using the form below and we will contact you.",
    },
  ],
  leadHeading: "Take attendance digital",
  leadDescription:
    "Leave your name and phone number — we will show you the attendance module during the 7-day free trial.",
  leadCta: "Try it for free",
};
