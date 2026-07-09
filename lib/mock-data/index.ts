import type {
  Lead, Student, Teacher, Course, Group, ScheduleEntry,
  AttendanceRecord, Payment, Expense, DashboardStats, MonthlyRevenue,
  Branch, Room, TeacherSalary,
} from "@/types";

export const MOCK_STATS: DashboardStats = {
  totalStudents: 247,
  activeGroups: 18,
  totalTeachers: 12,
  monthlyRevenue: 42500000,
  newLeads: 34,
  attendance: 87,
};

export const MOCK_REVENUE: MonthlyRevenue[] = [
  { month: "Yan", kirim: 28000000, chiqim: 8000000 },
  { month: "Fev", kirim: 32000000, chiqim: 9500000 },
  { month: "Mar", kirim: 35000000, chiqim: 10000000 },
  { month: "Apr", kirim: 30000000, chiqim: 8500000 },
  { month: "May", kirim: 38000000, chiqim: 11000000 },
  { month: "Iyn", kirim: 42500000, chiqim: 12000000 },
];

export const MOCK_BRANCHES: Branch[] = [
  { id: "b1", name: "Asosiy filial", address: "Toshkent, Chilonzor tumani, 10-uy", phone: "+998 71 200 0000", managerName: "Sarvar Abdullayev", studentCount: 145, roomCount: 5, status: "active", createdAt: "2022-01-15" },
  { id: "b2", name: "Yunusobod filiali", address: "Toshkent, Yunusobod, 18-kvartal, 12-uy", phone: "+998 71 300 0000", managerName: "Dilnoza Ergasheva", studentCount: 102, roomCount: 4, status: "active", createdAt: "2023-06-01" },
];

export const MOCK_ROOMS: Room[] = [
  { id: "r1", branchId: "b1", branchName: "Asosiy filial", name: "1-xona", capacity: 15, type: "dars_xonasi", status: "active" },
  { id: "r2", branchId: "b1", branchName: "Asosiy filial", name: "2-xona", capacity: 15, type: "dars_xonasi", status: "active" },
  { id: "r3", branchId: "b1", branchName: "Asosiy filial", name: "3-xona", capacity: 12, type: "dars_xonasi", status: "active" },
  { id: "r4", branchId: "b1", branchName: "Asosiy filial", name: "Kompyuter lab", capacity: 20, type: "kompyuter_lab", status: "active" },
  { id: "r5", branchId: "b1", branchName: "Asosiy filial", name: "Akt zal", capacity: 60, type: "akt_zal", status: "active" },
  { id: "r6", branchId: "b2", branchName: "Yunusobod filiali", name: "A-xona", capacity: 12, type: "dars_xonasi", status: "active" },
  { id: "r7", branchId: "b2", branchName: "Yunusobod filiali", name: "B-xona", capacity: 12, type: "dars_xonasi", status: "active" },
  { id: "r8", branchId: "b2", branchName: "Yunusobod filiali", name: "C-xona", capacity: 15, type: "dars_xonasi", status: "active" },
  { id: "r9", branchId: "b2", branchName: "Yunusobod filiali", name: "IT lab", capacity: 18, type: "kompyuter_lab", status: "active" },
];

export const MOCK_LEADS: Lead[] = [
  { id: "l1", name: "Aziza Karimova", phone: "+998 90 123 4567", source: "Instagram", status: "yangi", course: "Ingliz tili", createdAt: "2024-06-20" },
  { id: "l2", name: "Bobur Toshmatov", phone: "+998 91 234 5678", source: "Telegram", status: "aloqa_qilingan", course: "Matematika", assignedTo: "Sarvar A.", createdAt: "2024-06-19" },
  { id: "l3", name: "Dilnoza Yusupova", phone: "+998 93 345 6789", source: "Do'st orqali", status: "sinov_darsi", course: "Ingliz tili", assignedTo: "Sarvar A.", note: "Ertaga soat 10:00", createdAt: "2024-06-18" },
  { id: "l4", name: "Eldor Nazarov", phone: "+998 94 456 7890", source: "Website", status: "to_landi", course: "IT Dasturlash", assignedTo: "Nilufar B.", createdAt: "2024-06-17" },
  { id: "l5", name: "Feruza Holmatova", phone: "+998 95 567 8901", source: "Instagram", status: "bekor", course: "Matematika", note: "Narx mos kelmadi", createdAt: "2024-06-16" },
  { id: "l6", name: "G'ayrat Sultonov", phone: "+998 90 678 9012", source: "Telegram", status: "yangi", course: "Rus tili", createdAt: "2024-06-21" },
  { id: "l7", name: "Hulkar Abdullayeva", phone: "+998 91 789 0123", source: "Instagram", status: "aloqa_qilingan", course: "Ingliz tili", assignedTo: "Sarvar A.", createdAt: "2024-06-20" },
  { id: "l8", name: "Ismoil Rakhimov", phone: "+998 93 890 1234", source: "Do'st orqali", status: "sinov_darsi", course: "IT Dasturlash", assignedTo: "Nilufar B.", createdAt: "2024-06-19" },
];

export const MOCK_STUDENTS: Student[] = [
  { id: "s1", name: "Abdulloh Mirzayev", phone: "+998 90 111 2233", parentPhone: "+998 91 111 2233", groupId: "g1", groupName: "Ingliz A1 - 1", teacherName: "Mohira Xasanova", balance: -250000, paymentStatus: "qarzdor", enrolledAt: "2024-03-01" },
  { id: "s2", name: "Barno Qodirov", phone: "+998 93 222 3344", parentPhone: "+998 94 222 3344", groupId: "g1", groupName: "Ingliz A1 - 1", teacherName: "Mohira Xasanova", balance: 0, paymentStatus: "tolandi", enrolledAt: "2024-03-05" },
  { id: "s3", name: "Davron Ergashev", phone: "+998 95 333 4455", groupId: "g2", groupName: "Matematika 9-sinf", teacherName: "Jamshid Tursunov", balance: 150000, paymentStatus: "qisman", enrolledAt: "2024-02-15" },
  { id: "s4", name: "Ezgulik Norova", phone: "+998 90 444 5566", parentPhone: "+998 91 444 5566", groupId: "g3", groupName: "IT Dasturlash - Boshlang'ich", teacherName: "Sardor Hasanov", balance: 0, paymentStatus: "tolandi", enrolledAt: "2024-04-01" },
  { id: "s5", name: "Farhodjon Usmonov", phone: "+998 93 555 6677", groupId: "g2", groupName: "Matematika 9-sinf", teacherName: "Jamshid Tursunov", balance: -450000, paymentStatus: "qarzdor", enrolledAt: "2024-01-20" },
  { id: "s6", name: "Gulbahor Raximova", phone: "+998 94 666 7788", parentPhone: "+998 95 666 7788", groupId: "g1", groupName: "Ingliz A1 - 1", teacherName: "Mohira Xasanova", balance: 0, paymentStatus: "tolandi", enrolledAt: "2024-03-10" },
  { id: "s7", name: "Hamidjon Tojiboyev", phone: "+998 90 777 8899", groupId: "g3", groupName: "IT Dasturlash - Boshlang'ich", teacherName: "Sardor Hasanov", balance: -200000, paymentStatus: "qarzdor", enrolledAt: "2024-04-05" },
  { id: "s8", name: "Iroda Xoliqova", phone: "+998 91 888 9900", parentPhone: "+998 93 888 9900", groupId: "g4", groupName: "Ingliz B1 - 1", teacherName: "Mohira Xasanova", balance: 0, paymentStatus: "tolandi", enrolledAt: "2024-02-01" },
  { id: "s9", name: "Jasur Qosimov", phone: "+998 94 999 0011", groupId: "g2", groupName: "Matematika 9-sinf", teacherName: "Jamshid Tursunov", balance: 0, paymentStatus: "tolandi", enrolledAt: "2024-03-15" },
  { id: "s10", name: "Kamola Nazarova", phone: "+998 95 000 1122", parentPhone: "+998 90 000 1122", groupId: "g4", groupName: "Ingliz B1 - 1", teacherName: "Mohira Xasanova", balance: 100000, paymentStatus: "qisman", enrolledAt: "2024-02-20" },
];

export const MOCK_TEACHERS: Teacher[] = [
  { id: "t1", name: "Mohira Xasanova", phone: "+998 90 100 2000", email: "mohira@example.com", subjects: ["Ingliz tili"], groupCount: 4, studentCount: 56, salary: 3000000, salaryType: "fixed", joinedAt: "2023-01-15", status: "active" },
  { id: "t2", name: "Jamshid Tursunov", phone: "+998 91 200 3000", email: "jamshid@example.com", subjects: ["Matematika", "Fizika"], groupCount: 3, studentCount: 42, salary: 25, salaryType: "percent", joinedAt: "2023-03-01", status: "active" },
  { id: "t3", name: "Sardor Hasanov", phone: "+998 93 300 4000", subjects: ["IT Dasturlash", "Python"], groupCount: 3, studentCount: 38, salary: 3500000, salaryType: "fixed", joinedAt: "2023-06-10", status: "active" },
  { id: "t4", name: "Nilufar Ergasheva", phone: "+998 94 400 5000", email: "nilufar@example.com", subjects: ["Rus tili"], groupCount: 2, studentCount: 24, salary: 2500000, salaryType: "fixed", joinedAt: "2023-09-01", status: "active" },
  { id: "t5", name: "Otabek Kamolov", phone: "+998 95 500 6000", subjects: ["Matematika"], groupCount: 2, studentCount: 28, salary: 20, salaryType: "percent", joinedAt: "2024-01-10", status: "active" },
  { id: "t6", name: "Parizod Yusupova", phone: "+998 90 600 7000", subjects: ["Ingliz tili", "Nemis tili"], groupCount: 2, studentCount: 26, salary: 2800000, salaryType: "fixed", joinedAt: "2024-02-15", status: "inactive" },
];

export const MOCK_COURSES: Course[] = [
  { id: "c1", name: "Ingliz tili", description: "A1 dan C1 gacha barcha darajalar", duration: "3 oy", price: 400000, groupCount: 6, studentCount: 84, color: "bg-blue-500" },
  { id: "c2", name: "Matematika", description: "5-11 sinf o'quvchilar uchun", duration: "1 oy", price: 300000, groupCount: 4, studentCount: 56, color: "bg-green-500" },
  { id: "c3", name: "IT Dasturlash", description: "Python, Web, Mobile dasturlash", duration: "6 oy", price: 600000, groupCount: 3, studentCount: 42, color: "bg-purple-500" },
  { id: "c4", name: "Rus tili", description: "Boshlang'ich va o'rta daraja", duration: "3 oy", price: 350000, groupCount: 2, studentCount: 28, color: "bg-orange-500" },
  { id: "c5", name: "Nemis tili", description: "A1 dan B2 gacha", duration: "4 oy", price: 450000, groupCount: 2, studentCount: 22, color: "bg-pink-500" },
  { id: "c6", name: "Tayyorlov kursi", description: "Attestatsiya va DTM tayyorgarlik", duration: "2 oy", price: 500000, groupCount: 1, studentCount: 15, color: "bg-yellow-500" },
];

export const MOCK_GROUPS: Group[] = [
  { id: "g1", name: "Ingliz A1 - 1", courseId: "c1", courseName: "Ingliz tili", teacherId: "t1", teacherName: "Mohira Xasanova", studentCount: 14, maxStudents: 15, schedule: "Du, Chor, Jum", time: "09:00 - 10:30", room: "1-xona", startDate: "2024-03-01", status: "active" },
  { id: "g2", name: "Matematika 9-sinf", courseId: "c2", courseName: "Matematika", teacherId: "t2", teacherName: "Jamshid Tursunov", studentCount: 12, maxStudents: 15, schedule: "Ses, Pay, Shan", time: "11:00 - 12:30", room: "2-xona", startDate: "2024-02-15", status: "active" },
  { id: "g3", name: "IT Dasturlash - Boshlang'ich", courseId: "c3", courseName: "IT Dasturlash", teacherId: "t3", teacherName: "Sardor Hasanov", studentCount: 13, maxStudents: 12, schedule: "Du, Chor, Jum", time: "14:00 - 16:00", room: "Kompyuter lab", startDate: "2024-04-01", status: "active" },
  { id: "g4", name: "Ingliz B1 - 1", courseId: "c1", courseName: "Ingliz tili", teacherId: "t1", teacherName: "Mohira Xasanova", studentCount: 11, maxStudents: 15, schedule: "Ses, Pay, Shan", time: "09:00 - 10:30", room: "1-xona", startDate: "2024-02-01", status: "active" },
  { id: "g5", name: "Rus tili - Boshlang'ich", courseId: "c4", courseName: "Rus tili", teacherId: "t4", teacherName: "Nilufar Ergasheva", studentCount: 10, maxStudents: 15, schedule: "Du, Chor, Jum", time: "16:00 - 17:30", room: "2-xona", startDate: "2024-03-15", status: "active" },
  { id: "g6", name: "Python Dasturlash", courseId: "c3", courseName: "IT Dasturlash", teacherId: "t3", teacherName: "Sardor Hasanov", studentCount: 8, maxStudents: 12, schedule: "Ses, Pay", time: "17:00 - 19:00", room: "Kompyuter lab", startDate: "2024-05-01", status: "upcoming" },
];

export const MOCK_SCHEDULE: ScheduleEntry[] = [
  // Dushanba
  { id: "sch1",  groupName: "Ingliz A1 - 1",              teacherName: "Mohira Xasanova",   courseName: "Ingliz tili",    day: "Dushanba",   time: "09:00", endTime: "10:30", room: "1-xona",        color: "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "sch2",  groupName: "Matematika 9-sinf",           teacherName: "Jamshid Tursunov",  courseName: "Matematika",     day: "Dushanba",   time: "11:00", endTime: "12:30", room: "2-xona",        color: "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  { id: "sch3",  groupName: "IT Dasturlash",               teacherName: "Sardor Hasanov",    courseName: "IT Dasturlash",  day: "Dushanba",   time: "14:00", endTime: "16:00", room: "Kompyuter lab", color: "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  { id: "sch4",  groupName: "Rus tili - Boshlang'ich",     teacherName: "Nilufar Ergasheva", courseName: "Rus tili",       day: "Dushanba",   time: "16:00", endTime: "17:30", room: "3-xona",        color: "bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  // Seshanba
  { id: "sch5",  groupName: "Ingliz B1 - 1",              teacherName: "Mohira Xasanova",   courseName: "Ingliz tili",    day: "Seshanba",   time: "09:00", endTime: "10:30", room: "1-xona",        color: "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "sch6",  groupName: "Matematika 9-sinf",           teacherName: "Jamshid Tursunov",  courseName: "Matematika",     day: "Seshanba",   time: "11:00", endTime: "12:30", room: "2-xona",        color: "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  { id: "sch7",  groupName: "Python Dasturlash",           teacherName: "Sardor Hasanov",    courseName: "IT Dasturlash",  day: "Seshanba",   time: "17:00", endTime: "19:00", room: "Kompyuter lab", color: "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  // Chorshanba
  { id: "sch8",  groupName: "Ingliz A1 - 1",              teacherName: "Mohira Xasanova",   courseName: "Ingliz tili",    day: "Chorshanba", time: "09:00", endTime: "10:30", room: "1-xona",        color: "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "sch9",  groupName: "Tayyorlov kursi",             teacherName: "Otabek Kamolov",    courseName: "Tayyorlov",      day: "Chorshanba", time: "11:00", endTime: "12:30", room: "2-xona",        color: "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { id: "sch10", groupName: "IT Dasturlash",               teacherName: "Sardor Hasanov",    courseName: "IT Dasturlash",  day: "Chorshanba", time: "14:00", endTime: "16:00", room: "Kompyuter lab", color: "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  { id: "sch11", groupName: "Rus tili - Boshlang'ich",     teacherName: "Nilufar Ergasheva", courseName: "Rus tili",       day: "Chorshanba", time: "16:00", endTime: "17:30", room: "3-xona",        color: "bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  // Payshanba
  { id: "sch12", groupName: "Ingliz B1 - 1",              teacherName: "Mohira Xasanova",   courseName: "Ingliz tili",    day: "Payshanba",  time: "09:00", endTime: "10:30", room: "1-xona",        color: "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "sch13", groupName: "Matematika 9-sinf",           teacherName: "Jamshid Tursunov",  courseName: "Matematika",     day: "Payshanba",  time: "11:00", endTime: "12:30", room: "2-xona",        color: "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  { id: "sch14", groupName: "Nemis tili",                  teacherName: "Parizod Yusupova",  courseName: "Nemis tili",     day: "Payshanba",  time: "14:00", endTime: "15:30", room: "3-xona",        color: "bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300" },
  { id: "sch15", groupName: "Python Dasturlash",           teacherName: "Sardor Hasanov",    courseName: "IT Dasturlash",  day: "Payshanba",  time: "17:00", endTime: "19:00", room: "Kompyuter lab", color: "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  // Juma
  { id: "sch16", groupName: "Ingliz A1 - 1",              teacherName: "Mohira Xasanova",   courseName: "Ingliz tili",    day: "Juma",       time: "09:00", endTime: "10:30", room: "1-xona",        color: "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "sch17", groupName: "Tayyorlov kursi",             teacherName: "Otabek Kamolov",    courseName: "Tayyorlov",      day: "Juma",       time: "11:00", endTime: "12:30", room: "2-xona",        color: "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { id: "sch18", groupName: "IT Dasturlash",               teacherName: "Sardor Hasanov",    courseName: "IT Dasturlash",  day: "Juma",       time: "14:00", endTime: "16:00", room: "Kompyuter lab", color: "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  { id: "sch19", groupName: "Rus tili - Boshlang'ich",     teacherName: "Nilufar Ergasheva", courseName: "Rus tili",       day: "Juma",       time: "16:00", endTime: "17:30", room: "3-xona",        color: "bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  // Shanba
  { id: "sch20", groupName: "Ingliz B1 - 1",              teacherName: "Mohira Xasanova",   courseName: "Ingliz tili",    day: "Shanba",     time: "09:00", endTime: "10:30", room: "1-xona",        color: "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "sch21", groupName: "Matematika 9-sinf",           teacherName: "Jamshid Tursunov",  courseName: "Matematika",     day: "Shanba",     time: "11:00", endTime: "12:30", room: "2-xona",        color: "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  { id: "sch22", groupName: "Nemis tili",                  teacherName: "Parizod Yusupova",  courseName: "Nemis tili",     day: "Shanba",     time: "14:00", endTime: "15:30", room: "3-xona",        color: "bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300" },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: "a1", studentId: "s1", studentName: "Abdulloh Mirzayev", groupId: "g1", date: "2024-06-24", status: "keldi" },
  { id: "a2", studentId: "s2", studentName: "Barno Qodirov", groupId: "g1", date: "2024-06-24", status: "keldi" },
  { id: "a3", studentId: "s3", studentName: "Davron Ergashev", groupId: "g2", date: "2024-06-24", status: "kelmadi" },
  { id: "a4", studentId: "s4", studentName: "Ezgulik Norova", groupId: "g3", date: "2024-06-24", status: "keldi" },
  { id: "a5", studentId: "s5", studentName: "Farhodjon Usmonov", groupId: "g2", date: "2024-06-24", status: "kech_keldi" },
  { id: "a6", studentId: "s6", studentName: "Gulbahor Raximova", groupId: "g1", date: "2024-06-24", status: "keldi" },
  { id: "a7", studentId: "s7", studentName: "Hamidjon Tojiboyev", groupId: "g3", date: "2024-06-24", status: "sababli" },
  { id: "a8", studentId: "s8", studentName: "Iroda Xoliqova", groupId: "g4", date: "2024-06-24", status: "keldi" },
  { id: "a9", studentId: "s9", studentName: "Jasur Qosimov", groupId: "g2", date: "2024-06-24", status: "keldi" },
  { id: "a10", studentId: "s10", studentName: "Kamola Nazarova", groupId: "g4", date: "2024-06-24", status: "kelmadi" },
];

export const MOCK_PAYMENTS: Payment[] = [
  { id: "p1", studentId: "s2", studentName: "Barno Qodirov", groupName: "Ingliz A1 - 1", amount: 400000, date: "2024-06-20", method: "karta" },
  { id: "p2", studentId: "s4", studentName: "Ezgulik Norova", groupName: "IT Dasturlash", amount: 600000, date: "2024-06-19", method: "click" },
  { id: "p3", studentId: "s8", studentName: "Iroda Xoliqova", groupName: "Ingliz B1 - 1", amount: 400000, date: "2024-06-18", method: "naqd" },
  { id: "p4", studentId: "s9", studentName: "Jasur Qosimov", groupName: "Matematika 9-sinf", amount: 300000, date: "2024-06-17", method: "payme" },
  { id: "p5", studentId: "s6", studentName: "Gulbahor Raximova", groupName: "Ingliz A1 - 1", amount: 400000, date: "2024-06-15", method: "naqd" },
  { id: "p6", studentId: "s3", studentName: "Davron Ergashev", groupName: "Matematika 9-sinf", amount: 150000, date: "2024-06-14", method: "karta", note: "Qisman to'lov" },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: "e1", category: "Ijara", description: "Iyun oyi ijarasi", amount: 5000000, date: "2024-06-01" },
  { id: "e2", category: "Maosh", description: "O'qituvchilar maoshi - Iyun", amount: 15000000, date: "2024-06-05" },
  { id: "e3", category: "Kommunal", description: "Elektr va suv", amount: 800000, date: "2024-06-10" },
  { id: "e4", category: "Marketing", description: "Instagram reklama", amount: 1200000, date: "2024-06-12" },
  { id: "e5", category: "Jihoz", description: "Marker va doskalar", amount: 350000, date: "2024-06-15" },
];

export const MOCK_TEACHER_SALARIES: TeacherSalary[] = [
  { teacherId: "t1", teacherName: "Mohira Xasanova",  salaryType: "fixed",   baseSalary: 3000000, groupCount: 4, studentCount: 56, totalCollected: 22400000, calculatedSalary: 3000000, month: "2024-06", status: "pending" },
  { teacherId: "t2", teacherName: "Jamshid Tursunov", salaryType: "percent", baseSalary: 25,      groupCount: 3, studentCount: 42, totalCollected: 12600000, calculatedSalary: 3150000, month: "2024-06", status: "pending" },
  { teacherId: "t3", teacherName: "Sardor Hasanov",   salaryType: "fixed",   baseSalary: 3500000, groupCount: 3, studentCount: 38, totalCollected: 22800000, calculatedSalary: 3500000, month: "2024-06", status: "paid" },
  { teacherId: "t4", teacherName: "Nilufar Ergasheva",salaryType: "fixed",   baseSalary: 2500000, groupCount: 2, studentCount: 24, totalCollected: 8400000,  calculatedSalary: 2500000, month: "2024-06", status: "pending" },
  { teacherId: "t5", teacherName: "Otabek Kamolov",   salaryType: "percent", baseSalary: 20,      groupCount: 2, studentCount: 28, totalCollected: 8400000,  calculatedSalary: 1680000, month: "2024-06", status: "paid" },
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
};
