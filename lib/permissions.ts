import type { Role } from "@/types/roles";

// ─── Permission matrix ────────────────────────────────────────────────────────

type Action = "read" | "create" | "update" | "delete";
type Resource =
  | "dashboard"
  | "students"
  | "groups"
  | "teachers"
  | "courses"
  | "schedule"
  | "attendance"
  | "finance"
  | "payments"
  | "expenses"
  | "leads"
  | "reports"
  | "users"
  | "settings";

const MATRIX: Record<Resource, Partial<Record<Action, Role[]>>> = {
  dashboard: {
    read: ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST", "ACCOUNTANT"],
  },
  students: {
    read:   ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST"],
    create: ["SUPER_ADMIN", "RECEPTIONIST"],
    update: ["SUPER_ADMIN", "RECEPTIONIST"],
    delete: ["SUPER_ADMIN"],
  },
  groups: {
    read:   ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST", "ACCOUNTANT"],
    create: ["SUPER_ADMIN"],
    update: ["SUPER_ADMIN", "TEACHER"],
    delete: ["SUPER_ADMIN"],
  },
  teachers: {
    read:   ["SUPER_ADMIN"],
    create: ["SUPER_ADMIN"],
    update: ["SUPER_ADMIN"],
    delete: ["SUPER_ADMIN"],
  },
  courses: {
    read:   ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST", "ACCOUNTANT"],
    create: ["SUPER_ADMIN"],
    update: ["SUPER_ADMIN"],
    delete: ["SUPER_ADMIN"],
  },
  schedule: {
    read:   ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST"],
    create: ["SUPER_ADMIN"],
    update: ["SUPER_ADMIN"],
    delete: ["SUPER_ADMIN"],
  },
  attendance: {
    read:   ["SUPER_ADMIN", "TEACHER"],
    create: ["SUPER_ADMIN", "TEACHER"],
    update: ["SUPER_ADMIN", "TEACHER"],
    delete: ["SUPER_ADMIN"],
  },
  finance: {
    read:   ["SUPER_ADMIN", "ACCOUNTANT"],
    create: ["SUPER_ADMIN", "ACCOUNTANT"],
    update: ["SUPER_ADMIN", "ACCOUNTANT"],
    delete: ["SUPER_ADMIN"],
  },
  payments: {
    read:   ["SUPER_ADMIN", "ACCOUNTANT", "RECEPTIONIST"],
    create: ["SUPER_ADMIN", "ACCOUNTANT", "RECEPTIONIST"],
    update: ["SUPER_ADMIN", "ACCOUNTANT"],
    delete: ["SUPER_ADMIN"],
  },
  expenses: {
    read:   ["SUPER_ADMIN", "ACCOUNTANT"],
    create: ["SUPER_ADMIN", "ACCOUNTANT"],
    update: ["SUPER_ADMIN", "ACCOUNTANT"],
    delete: ["SUPER_ADMIN"],
  },
  leads: {
    read:   ["SUPER_ADMIN", "RECEPTIONIST"],
    create: ["SUPER_ADMIN", "RECEPTIONIST"],
    update: ["SUPER_ADMIN", "RECEPTIONIST"],
    delete: ["SUPER_ADMIN"],
  },
  reports: {
    read:   ["SUPER_ADMIN", "ACCOUNTANT"],
    create: [],
    update: [],
    delete: [],
  },
  users: {
    read:   ["SUPER_ADMIN"],
    create: ["SUPER_ADMIN"],
    update: ["SUPER_ADMIN"],
    delete: ["SUPER_ADMIN"],
  },
  settings: {
    read:   ["SUPER_ADMIN"],
    update: ["SUPER_ADMIN"],
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return MATRIX[resource]?.[action]?.includes(role) ?? false;
}

export function isSuperAdmin(role: Role) { return role === "SUPER_ADMIN"; }
export function isTeacher(role: Role)    { return role === "TEACHER"; }

// Nav items visible to each role
export const NAV_PERMISSIONS: Record<string, Role[]> = {
  "/dashboard":  ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST", "ACCOUNTANT"],
  "/leads":      ["SUPER_ADMIN", "RECEPTIONIST"],
  "/courses":    ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST", "ACCOUNTANT"],
  "/groups":     ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST", "ACCOUNTANT"],
  "/schedule":   ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST"],
  "/attendance": ["SUPER_ADMIN", "TEACHER"],
  "/students":   ["SUPER_ADMIN", "TEACHER", "RECEPTIONIST"],
  "/teachers":   ["SUPER_ADMIN"],
  "/finance":    ["SUPER_ADMIN", "ACCOUNTANT"],
  "/reports":    ["SUPER_ADMIN", "ACCOUNTANT"],
  "/settings":   ["SUPER_ADMIN"],
};
