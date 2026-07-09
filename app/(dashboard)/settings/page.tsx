"use client";

import { useState } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import type { Branch, Room } from "@/types";
import {
  Shield, Plus, Trash2, User, Building, Bell,
  MapPin, DoorOpen, Phone, Users, CheckCircle, XCircle, Pencil, KeyRound, CreditCard,
} from "lucide-react";
import { useUsers } from "@/lib/hooks/useUsers";
import { useBranches } from "@/lib/hooks/useBranches";
import { useRooms } from "@/lib/hooks/useRooms";
import { useOrganization } from "@/lib/hooks/useOrganization";
import { useStaffRoles } from "@/lib/hooks/useStaffRoles";
import { TarifSection } from "@/components/settings/tarif-section";
import { RolesSection } from "@/components/settings/roles-section";
import { mutate } from "swr";

const ROLE_CFG: Record<string, { label: string; color: string; description: string; permissions: string[] }> = {
  SUPER_ADMIN:  { label: "Super Admin",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",       description: "Barcha imkoniyatlarga to'liq kirish", permissions: ["Dashboard", "Lidlar", "O'quvchilar", "O'qituvchilar", "Kurslar", "Guruhlar", "Moliya", "Hisobotlar", "Sozlamalar"] },
  RECEPTIONIST: { label: "Qabulxona",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",    description: "Lidlar, o'quvchilar va to'lovlarni boshqarish", permissions: ["Dashboard", "Lidlar", "O'quvchilar", "Kurslar", "Guruhlar", "To'lovlar"] },
  TEACHER:      { label: "O'qituvchi",   color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", description: "O'z guruhlari va davomatni boshqarish", permissions: ["Dashboard", "O'z guruhlari", "Davomat", "O'quvchilar (ko'rish)", "Kurslar (ko'rish)"] },
  ACCOUNTANT:   { label: "Buxgalter",    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", description: "Moliya va hisobotlarni boshqarish", permissions: ["Dashboard", "To'lovlar", "Xarajatlar", "Hisobotlar", "Guruhlar (ko'rish)"] },
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  dars_xonasi: "Dars xonasi", kompyuter_lab: "Kompyuter lab", sport_zal: "Sport zal", akt_zal: "Akt zal",
};
const ROOM_TYPE_COLORS: Record<string, string> = {
  dars_xonasi: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  kompyuter_lab: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  sport_zal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  akt_zal: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const sections = [
  { id: "markaz",        label: "O'quv markaz",    icon: Building },
  { id: "tarif",        label: "Tarif",            icon: CreditCard },
  { id: "filliallar",   label: "Filliallar",       icon: MapPin },
  { id: "xonalar",      label: "Xonalar",          icon: DoorOpen },
  { id: "rollar",       label: "Rollar",           icon: Shield },
  { id: "hodimlar",     label: "Hodimlar",         icon: User },
  { id: "bildirishnoma", label: "Bildirishnomalar", icon: Bell },
];

const EMPTY_USER = { name: "", phone: "", email: "", password: "", role: "RECEPTIONIST" as string, branchId: "", staffRoleId: "" };

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-lg", className)} />;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("hodimlar");

  const { data: branchesRaw, isLoading: branchesLoading } = useBranches();
  const branches: Branch[] = Array.isArray(branchesRaw) ? branchesRaw : [];

  const { data: roomsRaw, isLoading: roomsLoading } = useRooms();
  const rooms: Room[] = Array.isArray(roomsRaw) ? roomsRaw : [];

  const { data: orgData, isLoading: orgLoading } = useOrganization();

  const [showBranchForm, setShowBranchForm] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", address: "", phone: "", managerName: "" });
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchErr, setBranchErr] = useState("");
  const [deleteBranch, setDeleteBranch] = useState<Branch | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", branchId: "", capacity: "", type: "dars_xonasi" });
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomErr, setRoomErr] = useState("");

  const [orgForm, setOrgForm] = useState({ name: "" });
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgErr, setOrgErr] = useState("");

  // Staff / users state
  const { data: usersRaw, isLoading: usersLoading } = useUsers();
  const users: any[] = Array.isArray(usersRaw) ? usersRaw : [];

  const { data: staffRolesRaw } = useStaffRoles();
  const staffRoles: any[] = Array.isArray(staffRolesRaw) ? staffRolesRaw : [];

  const [showUserModal,  setShowUserModal]  = useState(false);
  const [editUser,       setEditUser]       = useState<any>(null);
  const [deleteUser,     setDeleteUser]     = useState<any>(null);
  const [userForm,       setUserForm]       = useState(EMPTY_USER);
  const [userSaving,     setUserSaving]     = useState(false);
  const [userError,      setUserError]      = useState("");

  // Password reset
  const [resetUser,      setResetUser]      = useState<any>(null);
  const [resetPassword,  setResetPassword]  = useState("");
  const [resetSaving,    setResetSaving]    = useState(false);
  const [resetError,     setResetError]     = useState("");

  function openCreateUser() {
    setEditUser(null); setUserForm(EMPTY_USER); setUserError(""); setShowUserModal(true);
  }
  function openEditUser(u: any) {
    setEditUser(u);
    setUserForm({
      name: u.name ?? "", phone: u.phone ?? "", email: u.email ?? "", password: "",
      role: u.role, branchId: u.branchId ?? "", staffRoleId: u.staffRoleId ?? "",
    });
    setUserError(""); setShowUserModal(true);
  }

  async function submitUser() {
    if (!editUser) {
      const digits = userForm.phone.replace(/\D/g, "");
      if (!userForm.name.trim()) { setUserError("Ism majburiy"); return; }
      if (digits.length !== 12)  { setUserError("To'liq telefon raqam kiriting"); return; }
      if (!userForm.password.trim()) { setUserError("Parol majburiy"); return; }
    }
    if (userForm.role === "STAFF" && !userForm.staffRoleId) {
      setUserError("Maxsus rol tanlang"); return;
    }
    setUserSaving(true); setUserError("");
    try {
      const body: Record<string, unknown> = { role: userForm.role };
      if (userForm.name.trim())     body.name  = userForm.name;
      if (userForm.phone.trim())    body.phone = userForm.phone;
      if (userForm.email.trim())    body.email = userForm.email;
      if (userForm.password.trim()) body.password = userForm.password;
      if (userForm.branchId)        body.branchId = userForm.branchId;
      body.staffRoleId = userForm.role === "STAFF" ? userForm.staffRoleId : "";

      const url    = editUser ? `/api/users/${editUser.id}` : "/api/users";
      const method = editUser ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) { setUserError(data.error ?? "Xatolik"); return; }
      mutate("/api/users");
      setShowUserModal(false);
    } catch { setUserError("Serverga ulanib bo'lmadi"); }
    finally { setUserSaving(false); }
  }

  async function toggleActive(u: any) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    mutate("/api/users");
  }

  async function confirmResetPassword() {
    if (!resetUser || resetPassword.length < 6) { setResetError("Kamida 6 belgi kiriting"); return; }
    setResetSaving(true); setResetError("");
    try {
      const res = await fetch(`/api/users/${resetUser.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.error ?? "Xatolik"); return; }
      setResetUser(null); setResetPassword("");
    } catch { setResetError("Serverga ulanib bo'lmadi"); }
    finally { setResetSaving(false); }
  }

  async function confirmDeleteUser() {
    if (!deleteUser) return;
    setUserSaving(true);
    await fetch(`/api/users/${deleteUser.id}`, { method: "DELETE" });
    mutate("/api/users");
    setDeleteUser(null); setUserSaving(false);
  }

  async function addBranch() {
    if (!newBranch.name.trim()) { setBranchErr("Filial nomi majburiy"); return; }
    setBranchSaving(true); setBranchErr("");
    try {
      const res = await fetch("/api/branches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBranch) });
      const data = await res.json();
      if (!res.ok) { setBranchErr(data.error ?? "Xatolik"); return; }
      mutate("/api/branches");
      setNewBranch({ name: "", address: "", phone: "", managerName: "" });
      setShowBranchForm(false);
    } catch { setBranchErr("Serverga ulanib bo'lmadi"); }
    finally { setBranchSaving(false); }
  }

  async function confirmDeleteBranch() {
    if (!deleteBranch) return;
    await fetch(`/api/branches/${deleteBranch.id}`, { method: "DELETE" });
    mutate("/api/branches");
    setDeleteBranch(null);
  }

  async function addRoom() {
    if (!newRoom.name.trim()) { setRoomErr("Xona nomi majburiy"); return; }
    const branchId = newRoom.branchId || branches[0]?.id;
    if (!branchId) { setRoomErr("Avval filial qo'shing"); return; }
    setRoomSaving(true); setRoomErr("");
    try {
      const res = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newRoom, branchId, capacity: Number(newRoom.capacity) || 15 }) });
      const data = await res.json();
      if (!res.ok) { setRoomErr(data.error ?? "Xatolik"); return; }
      mutate("/api/rooms");
      setNewRoom({ name: "", branchId: "", capacity: "", type: "dars_xonasi" });
      setShowRoomForm(false);
    } catch { setRoomErr("Serverga ulanib bo'lmadi"); }
    finally { setRoomSaving(false); }
  }

  async function confirmDeleteRoom() {
    if (!deleteRoom) return;
    await fetch(`/api/rooms/${deleteRoom.id}`, { method: "DELETE" });
    mutate("/api/rooms");
    setDeleteRoom(null);
  }

  async function saveOrg() {
    setOrgSaving(true); setOrgErr("");
    try {
      const res = await fetch("/api/organization", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: orgForm.name || orgData?.name }) });
      const data = await res.json();
      if (!res.ok) { setOrgErr(data.error ?? "Xatolik"); return; }
      mutate("/api/organization");
    } catch { setOrgErr("Serverga ulanib bo'lmadi"); }
    finally { setOrgSaving(false); }
  }

  return (
    <div>
      <TopHeader title="Sozlamalar" subtitle="Tizim va markaz sozlamalari" />

      <Modal
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editUser ? "Hodimni tahrirlash" : "Yangi hodim qo'shish"}
        subtitle={editUser ? undefined : "Hodim ma'lumotlarini to'ldiring"}
        size="md"
        footer={
          <>
            <Button onClick={submitUser} disabled={userSaving}
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
              {userSaving ? "Saqlanmoqda..." : editUser ? "Saqlash" : "Qo'shish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowUserModal(false)}>Bekor</Button>
          </>
        }
      >
        <FormField label="Ism familiya" required={!editUser}>
          <Input
            placeholder="Sarvar Abdullayev"
            value={userForm.name}
            onChange={e => setUserForm(p => ({...p, name: e.target.value}))}
            className="h-10"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Telefon" required={!editUser}>
            <PhoneInput
              value={userForm.phone}
              onChange={v => setUserForm(p => ({...p, phone: v}))}
              error={userError.includes("telefon")}
            />
          </FormField>
          <FormField label="Email" hint="Ixtiyoriy">
            <Input
              placeholder="email@mail.com"
              value={userForm.email}
              onChange={e => setUserForm(p => ({...p, email: e.target.value}))}
              className="h-10"
            />
          </FormField>
        </div>

        <FormField
          label={editUser ? "Yangi parol" : "Parol"}
          required={!editUser}
          hint={editUser ? "Bo'sh qoldirsangiz o'zgarmaydi" : undefined}
        >
          <Input
            type="password"
            placeholder="Kamida 6 belgi"
            value={userForm.password}
            onChange={e => setUserForm(p => ({...p, password: e.target.value}))}
            className="h-10"
          />
        </FormField>

        <FormField label="Filial">
          <select
            value={userForm.branchId}
            onChange={e => setUserForm(p => ({ ...p, branchId: e.target.value }))}
            className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none"
          >
            <option value="">Filial tanlanmagan</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FormField>

        <FormField label="Rol" required>
          <div className="space-y-2">
            {/* Tayyor rollar */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: "RECEPTIONIST", label: "Qabulxona", color: ROLE_CFG.RECEPTIONIST.color },
                { role: "ACCOUNTANT",   label: "Buxgalter", color: ROLE_CFG.ACCOUNTANT.color },
              ].map(({ role, label, color }) => (
                <button key={role} type="button"
                  onClick={() => setUserForm(p => ({ ...p, role, staffRoleId: "" }))}
                  className={cn(
                    "text-left p-2.5 rounded-xl border-2 transition-all",
                    userForm.role === role
                      ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                  )}>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", color)}>{label}</span>
                  <p className="text-[11px] text-neutral-400 mt-1">Tayyor rol</p>
                </button>
              ))}
            </div>

            {/* Maxsus rollar (StaffRole) */}
            {staffRoles.filter(r => r.isActive).length > 0 && (
              <div>
                <p className="text-[11px] text-neutral-400 mb-1.5">Maxsus rollar</p>
                <div className="grid grid-cols-2 gap-2">
                  {staffRoles.filter(r => r.isActive).map(r => (
                    <button key={r.id} type="button"
                      onClick={() => setUserForm(p => ({ ...p, role: "STAFF", staffRoleId: r.id }))}
                      className={cn(
                        "text-left p-2.5 rounded-xl border-2 transition-all",
                        userForm.role === "STAFF" && userForm.staffRoleId === r.id
                          ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                      )}>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{r.name}</span>
                      <p className="text-[11px] text-neutral-400 mt-1">{r.permissions.length} ruxsat</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FormField>

        {userError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
            <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round"/></svg>
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{userError}</p>
          </div>
        )}
      </Modal>

      {/* Password reset modal */}
      <Modal
        open={!!resetUser}
        onClose={() => { setResetUser(null); setResetPassword(""); setResetError(""); }}
        title="Parolni tiklash"
        subtitle={resetUser ? `${resetUser.name} uchun yangi parol o'rnating` : ""}
        size="sm"
        footer={
          <>
            <Button onClick={confirmResetPassword} disabled={resetSaving}
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
              {resetSaving ? "Saqlanmoqda..." : "Parolni yangilash"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]"
              onClick={() => { setResetUser(null); setResetPassword(""); setResetError(""); }}>
              Bekor
            </Button>
          </>
        }
      >
        <FormField label="Yangi parol" required>
          <Input
            type="password"
            placeholder="Kamida 6 belgi"
            value={resetPassword}
            onChange={e => { setResetPassword(e.target.value); setResetError(""); }}
            className="h-10"
            autoFocus
          />
        </FormField>
        {resetError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
            <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round"/></svg>
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{resetError}</p>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={confirmDeleteUser}
        loading={userSaving}
        title="Hodimni o'chirish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteUser?.name}</span> tizimdan o'chirilsinmi? Foydalanuvchi tizimga kira olmaydi.
        </>}
      />

      <ConfirmDeleteModal
        open={!!deleteBranch}
        onClose={() => setDeleteBranch(null)}
        onConfirm={confirmDeleteBranch}
        loading={false}
        title="Filialni o'chirish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteBranch?.name}</span> o'chirilsinmi? Filial bilan bog'liq barcha xonalar ham o'chadi.
        </>}
      />

      <ConfirmDeleteModal
        open={!!deleteRoom}
        onClose={() => setDeleteRoom(null)}
        onConfirm={confirmDeleteRoom}
        loading={false}
        title="Xonani o'chirish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteRoom?.name}</span> o'chirilsinmi?
        </>}
      />

      <div className="p-6 flex gap-6">
        {/* Sidebar */}
        <div className="w-52 shrink-0">
          <nav className="space-y-0.5">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeSection === s.id
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 max-w-3xl space-y-4">

          {/* ── Hodimlar (real API) ── */}
          {activeSection === "hodimlar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Tizim foydalanuvchilari</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {usersLoading ? "Yuklanmoqda..." : `${users.length} ta hodim — har biri o'z roliga mos ma'lumotlarni ko'radi`}
                  </p>
                </div>
                <Button size="sm" onClick={openCreateUser}
                  className="gap-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs h-8">
                  <Plus className="w-3.5 h-3.5" /> Hodim qo'shish
                </Button>
              </div>

              {/* Role legend */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ROLE_CFG).map(([role, cfg]) => (
                  <div key={role} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", cfg.color)}>{cfg.label}</span>
                      <span className="text-[11px] text-neutral-400 font-semibold">
                        {users.filter(u => u.role === role).length} ta
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cfg.permissions.slice(0, 4).map(p => (
                        <span key={p} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded">{p}</span>
                      ))}
                      {cfg.permissions.length > 4 && (
                        <span className="text-[10px] text-neutral-400">+{cfg.permissions.length - 4}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* User list */}
              <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
                <CardContent className="p-0">
                  {usersLoading
                    ? Array.from({length: 4}).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                          <Skeleton className="w-9 h-9 rounded-full" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-2.5 w-24" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      ))
                    : users.length === 0
                      ? (
                          <div className="py-12 text-center text-neutral-400">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Hali hodim qo'shilmagan</p>
                          </div>
                        )
                      : users.map((u: any) => {
                          const cfg = ROLE_CFG[u.role];
                          return (
                            <div key={u.id}
                              className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
                                  u.isActive
                                    ? "bg-gradient-to-br from-blue-400 to-purple-500"
                                    : "bg-neutral-300 dark:bg-neutral-600"
                                )}>
                                  {u.name?.[0] ?? "?"}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{u.name}</p>
                                    {!u.isActive && (
                                      <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">Bloklangan</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                                    {u.phone}{u.branch?.name ? ` · ${u.branch.name}` : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {u.role === "STAFF" && u.staffRole ? (
                                  <span className="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    {u.staffRole.name}
                                  </span>
                                ) : cfg ? (
                                  <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-semibold", cfg.color)}>
                                    {cfg.label}
                                  </span>
                                ) : null}
                                <button
                                  onClick={() => { setResetUser(u); setResetPassword(""); setResetError(""); }}
                                  title="Parolni tiklash"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => openEditUser(u)}
                                  title="Tahrirlash"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => toggleActive(u)}
                                  title={u.isActive ? "Bloklash" : "Faollashtirish"}
                                  className={cn(
                                    "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                                    u.isActive
                                      ? "text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                      : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  )}>
                                  {u.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                </button>
                                {u.role !== "SUPER_ADMIN" && (
                                  <button onClick={() => setDeleteUser(u)}
                                    title="O'chirish"
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                  }
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Tarif ── */}
          {activeSection === "tarif" && <TarifSection />}

          {/* ── Rollar (builder) ── */}
          {activeSection === "rollar" && <RolesSection />}

          {/* ── O'quv markaz ── */}
          {activeSection === "markaz" && (
            <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px]">O'quv markaz ma'lumotlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orgLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Markaz nomi</Label>
                      <Input
                        defaultValue={orgData?.name ?? ""}
                        onChange={e => setOrgForm(p => ({...p, name: e.target.value}))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Subdomen</Label>
                      <div className="flex">
                        <Input defaultValue={orgData?.subdomain ?? ""} disabled className="h-9 text-sm rounded-r-none bg-neutral-50 dark:bg-neutral-800" />
                        <span className="flex items-center px-3 bg-neutral-100 dark:bg-neutral-800 border border-l-0 border-neutral-200 dark:border-neutral-700 rounded-r-lg text-sm text-neutral-500">.oneroom.uz</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Tarif rejasi</Label>
                      <Input defaultValue={orgData?.plan ?? ""} disabled className="h-9 text-sm bg-neutral-50 dark:bg-neutral-800" />
                    </div>
                    {orgErr && (
                      <p className="text-[12px] text-red-600 dark:text-red-400">{orgErr}</p>
                    )}
                    <Button onClick={saveOrg} disabled={orgSaving} className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 mt-2">
                      {orgSaving ? "Saqlanmoqda..." : "Saqlash"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Filliallar ── */}
          {activeSection === "filliallar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {branchesLoading ? "Yuklanmoqda..." : `${branches.length} ta filial`}
                </p>
                <Button size="sm" onClick={() => { setShowBranchForm(v => !v); setBranchErr(""); }}
                  className="gap-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs h-8">
                  <Plus className="w-3.5 h-3.5" /> Filial qo'shish
                </Button>
              </div>
              {showBranchForm && (
                <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold">Yangi filial</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs text-neutral-500 mb-1 block">Filial nomi *</Label><Input placeholder="Mirzo Ulug'bek filiali" value={newBranch.name} onChange={e => setNewBranch(p => ({...p, name: e.target.value}))} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs text-neutral-500 mb-1 block">Telefon</Label><Input placeholder="+998 71 ..." value={newBranch.phone} onChange={e => setNewBranch(p => ({...p, phone: e.target.value}))} className="h-8 text-sm" /></div>
                      <div className="col-span-2"><Label className="text-xs text-neutral-500 mb-1 block">Manzil</Label><Input placeholder="Shahar, tuman, ko'cha" value={newBranch.address} onChange={e => setNewBranch(p => ({...p, address: e.target.value}))} className="h-8 text-sm" /></div>
                    </div>
                    {branchErr && <p className="text-[12px] text-red-600 dark:text-red-400">{branchErr}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addBranch} disabled={branchSaving} className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 h-8 text-xs">
                        {branchSaving ? "Saqlanmoqda..." : "Saqlash"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowBranchForm(false)} className="h-8 text-xs">Bekor</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {branchesLoading ? (
                <div className="space-y-3">{Array.from({length: 2}).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : branches.length === 0 ? (
                <div className="py-10 text-center text-neutral-400">
                  <Building className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Hali filial qo'shilmagan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {branches.map(branch => (
                    <Card key={branch.id} className="border border-neutral-200 dark:border-neutral-800 shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center shrink-0"><Building className="w-5 h-5 text-neutral-500" /></div>
                            <div>
                              <h3 className="font-semibold text-[14px]">{branch.name}</h3>
                              {branch.address && <div className="flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-neutral-400" /><p className="text-xs text-neutral-500">{branch.address}</p></div>}
                              {branch.phone && <div className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-neutral-400" /><p className="text-xs text-neutral-500">{branch.phone}</p></div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-red-600" onClick={() => setDeleteBranch(branch)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center gap-1.5"><DoorOpen className="w-3.5 h-3.5 text-neutral-400" /><span className="text-xs text-neutral-500">{branch.roomCount ?? 0} xona</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Xonalar ── */}
          {activeSection === "xonalar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  {roomsLoading ? "Yuklanmoqda..." : `${rooms.length} ta xona`}
                </p>
                <Button size="sm" onClick={() => { setShowRoomForm(v => !v); setRoomErr(""); }} className="gap-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs h-8"><Plus className="w-3.5 h-3.5" /> Xona qo'shish</Button>
              </div>
              {showRoomForm && (
                <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold">Yangi xona</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs text-neutral-500 mb-1 block">Xona nomi *</Label><Input placeholder="4-xona" value={newRoom.name} onChange={e => setNewRoom(p => ({...p, name: e.target.value}))} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs text-neutral-500 mb-1 block">Sig'imi</Label><Input type="number" placeholder="15" value={newRoom.capacity} onChange={e => setNewRoom(p => ({...p, capacity: e.target.value}))} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs text-neutral-500 mb-1 block">Filial</Label>
                        <select value={newRoom.branchId || branches[0]?.id || ""} onChange={e => setNewRoom(p => ({...p, branchId: e.target.value}))} className="w-full h-8 px-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div><Label className="text-xs text-neutral-500 mb-1 block">Turi</Label><select value={newRoom.type} onChange={e => setNewRoom(p => ({...p, type: e.target.value}))} className="w-full h-8 px-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none">{Object.entries(ROOM_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                    </div>
                    {roomErr && <p className="text-[12px] text-red-600 dark:text-red-400">{roomErr}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addRoom} disabled={roomSaving} className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 h-8 text-xs">
                        {roomSaving ? "Saqlanmoqda..." : "Saqlash"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowRoomForm(false)} className="h-8 text-xs">Bekor</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {roomsLoading ? (
                <div className="space-y-2">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : rooms.length === 0 ? (
                <div className="py-10 text-center text-neutral-400">
                  <DoorOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Hali xona qo'shilmagan</p>
                </div>
              ) : (
                branches.map(branch => {
                  const branchRooms = rooms.filter(r => r.branchId === branch.id);
                  if (branchRooms.length === 0) return null;
                  return (
                    <div key={branch.id}>
                      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Building className="w-3.5 h-3.5" />{branch.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {branchRooms.map(room => (
                          <Card key={room.id} className="border border-neutral-200 dark:border-neutral-800 shadow-none">
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center shrink-0"><DoorOpen className="w-4 h-4 text-neutral-500" /></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold">{room.name}</p>
                                {room.capacity && <span className="text-[10px] text-neutral-400">{room.capacity} o'rin</span>}
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-red-600 shrink-0" onClick={() => setDeleteRoom(room)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Bildirishnomalar ── */}
          {activeSection === "bildirishnoma" && (
            <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
              <CardHeader className="pb-3"><CardTitle className="text-[15px]">Bildirishnoma sozlamalari</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {[
                  { label: "SMS bildirishnomalar (Eskiz.uz orqali)", checked: true },
                  { label: "Davomat haqida ota-onaga SMS", checked: true },
                  { label: "To'lov eslatmasi (oylik)", checked: true },
                  { label: "Yangi lid qo'shilganda email", checked: false },
                  { label: "Telegram bot bildirishnomalari", checked: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{item.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                      <div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full peer peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-100 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white dark:after:bg-neutral-900 after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                  </div>
                ))}
                <Button className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 mt-3">Saqlash</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
