export type Role = "super_admin" | "admin" | "teacher" | "student" | "marketing";

export type LeadStatus = "yangi" | "aloqa_qilingan" | "sinov_darsi" | "to_landi" | "bekor";

export type PaymentStatus = "tolandi" | "qarzdor" | "qisman";

export type AttendanceStatus = "keldi" | "kelmadi" | "kech_keldi" | "sababli";

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: Role;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: LeadStatus;
  course?: string;
  note?: string;
  assignedTo?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  groupId: string;
  groupName: string;
  teacherName: string;
  balance: number;
  paymentStatus: PaymentStatus;
  enrolledAt: string;
  avatar?: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subjects: string[];
  groupCount: number;
  studentCount: number;
  salary: number;
  salaryType: "fixed" | "percent";
  avatar?: string;
  joinedAt: string;
  status: "active" | "inactive";
}

export interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  groupCount: number;
  studentCount: number;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  maxStudents: number;
  schedule: string;
  time: string;
  room: string;
  startDate: string;
  status: "active" | "completed" | "upcoming";
}

export interface ScheduleEntry {
  id: string;
  groupName: string;
  teacherName: string;
  courseName: string;
  day: string;
  time: string;
  endTime: string;
  room: string;
  color: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  date: string;
  status: AttendanceStatus;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  groupName: string;
  amount: number;
  date: string;
  method: "naqd" | "karta" | "click" | "payme";
  note?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeGroups: number;
  totalTeachers: number;
  monthlyRevenue: number;
  newLeads: number;
  attendance: number;
}

export interface MonthlyRevenue {
  month: string;
  kirim: number;
  chiqim: number;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  managerName?: string;
  studentCount: number;
  roomCount: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Room {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  capacity: number;
  type: "dars_xonasi" | "kompyuter_lab" | "sport_zal" | "akt_zal";
  status: "active" | "inactive";
}

export interface TeacherSalary {
  teacherId: string;
  teacherName: string;
  salaryType: "fixed" | "percent";
  baseSalary: number;
  groupCount: number;
  studentCount: number;
  totalCollected: number;
  calculatedSalary: number;
  month: string;
  status: "pending" | "paid";
}
