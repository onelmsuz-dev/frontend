"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import {
  Plus, Pencil, Trash2, KeyRound, Users, Shield,
  CheckCircle, XCircle, AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormField } from "@/components/ui/form-field";
import { PermissionPicker } from "@/components/settings/permission-picker";
import { useUsers } from "@/lib/hooks/useUsers";
import { useOrganization } from "@/lib/hooks/useOrganization";
import { useStaffRoles, type StaffRole } from "@/lib/hooks/useStaffRoles";
import { cn } from "@/lib/utils";
import type { Branch } from "@/types";

/** Admin — tizimdagi doimiy rol, ruxsatlari sozlanmaydi (hammasi ochiq). */
const ADMIN = "SUPER_ADMIN";
const NEW_ROLE = "__new__";

const EMPTY_FORM = { name: "", phone: "", email: "", password: "", branchId: "" };

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-lg", className)} />;
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{text}</p>
    </div>
  );
}

/**
 * Xodimlar + rollar bitta bo'limda: yangi rol yaratish = xodimga yangi
 * imkoniyatlar to'plami berish. O'qituvchilar bu ro'yxatga kirmaydi —
 * ular O'qituvchilar bo'limida boshqariladi va tarif limitiga kirmaydi.
 */
export function StaffSection({ branches }: { branches: Branch[] }) {
  const { data: usersRaw, isLoading: usersLoading } = useUsers();
  const { data: rolesRaw } = useStaffRoles();
  const { data: org } = useOrganization();

  const users: any[] = Array.isArray(usersRaw) ? usersRaw : [];
  const roles: StaffRole[] = Array.isArray(rolesRaw) ? rolesRaw : [];

  // Xodim modali
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [roleSel, setRoleSel] = useState<string>(ADMIN);   // ADMIN | roleId | NEW_ROLE
  const [newRoleName, setNewRoleName] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Rol tahriri (xodim kartochkasidagi "qalqon" tugmasi ham shu yerga olib keladi)
  const [editRole, setEditRole] = useState<StaffRole | null>(null);
  const [roleName, setRoleName] = useState("");
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleErr, setRoleErr] = useState("");

  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleteRole, setDeleteRole] = useState<StaffRole | null>(null);

  // Parol tiklash
  const [resetUser, setResetUser] = useState<any>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [resetSaving, setResetSaving] = useState(false);

  const limit = org?.limits?.maxStaff;
  const used  = org?.usage?.staff ?? Math.max(users.length - 1, 0);
  const atLimit = typeof limit === "number" && used >= limit;

  const rolesById = useMemo(
    () => Object.fromEntries(roles.map(r => [r.id, r])) as Record<string, StaffRole>,
    [roles],
  );

  // ── Xodim modali ───────────────────────────────────────────────────────────
  function openCreate() {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setRoleSel(roles[0]?.id ?? ADMIN);
    setNewRoleName(""); setPerms(roles[0]?.permissions ?? []);
    setError(""); setShowModal(true);
  }

  function openEdit(u: any) {
    setEditUser(u);
    setForm({
      name: u.name ?? "", phone: u.phone ?? "", email: u.email ?? "",
      password: "", branchId: u.branchId ?? "",
    });
    // Rolsiz eski xodim (RECEPTIONIST/ACCOUNTANT) tasodifan Admin bo'lib qolmasligi uchun
    // Admin'ga faqat rostdan ham Admin bo'lgani tushadi.
    const sel = u.role === ADMIN
      ? ADMIN
      : (u.staffRoleId ?? roles[0]?.id ?? NEW_ROLE);
    setRoleSel(sel);
    setPerms(sel === ADMIN || sel === NEW_ROLE ? [] : (rolesById[sel]?.permissions ?? []));
    setNewRoleName(""); setError(""); setShowModal(true);
  }

  function pickRole(id: string) {
    setRoleSel(id);
    if (id === NEW_ROLE) setPerms([]);
    else if (id !== ADMIN) setPerms(rolesById[id]?.permissions ?? []);
  }

  /** Tanlangan rol uchun staffRoleId ni qaytaradi (kerak bo'lsa rolni yaratadi/yangilaydi). */
  async function resolveStaffRole(): Promise<string> {
    if (roleSel === NEW_ROLE) {
      const res = await fetch("/api/staff-roles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName.trim(), permissions: perms, isActive: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rol yaratilmadi");
      return data.id as string;
    }

    // Mavjud rol — ruxsatlar o'zgargan bo'lsa yangilaymiz
    const role = rolesById[roleSel];
    const changed =
      role && (role.permissions.length !== perms.length ||
        perms.some(p => !role.permissions.includes(p)));
    if (changed) {
      const res = await fetch(`/api/staff-roles/${roleSel}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: perms }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Ruxsatlar saqlanmadi");
    }
    return roleSel;
  }

  async function submitStaff() {
    if (!editUser) {
      if (!form.name.trim()) { setError("Ism majburiy"); return; }
      if (form.phone.replace(/\D/g, "").length !== 12) { setError("To'liq telefon raqam kiriting"); return; }
      if (!form.password.trim()) { setError("Parol majburiy"); return; }
    }
    if (roleSel === NEW_ROLE && !newRoleName.trim()) { setError("Yangi rol nomini kiriting"); return; }

    setSaving(true); setError("");
    try {
      const isAdmin = roleSel === ADMIN;
      const staffRoleId = isAdmin ? "" : await resolveStaffRole();

      const body: Record<string, unknown> = { role: isAdmin ? ADMIN : "STAFF", staffRoleId };
      if (form.name.trim())     body.name  = form.name.trim();
      if (form.phone.trim())    body.phone = form.phone;
      if (form.email.trim())    body.email = form.email.trim();
      if (form.password.trim()) body.password = form.password;
      if (form.branchId)        body.branchId = form.branchId;

      const res = await fetch(editUser ? `/api/users/${editUser.id}` : "/api/users", {
        method: editUser ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xatolik"); return; }

      mutate("/api/users"); mutate("/api/staff-roles"); mutate("/api/organization");
      setShowModal(false);
    } catch (e: any) {
      setError(e?.message ?? "Serverga ulanib bo'lmadi");
    } finally { setSaving(false); }
  }

  // ── Rol modali ─────────────────────────────────────────────────────────────
  function openRoleEdit(r: StaffRole) {
    setEditRole(r); setRoleName(r.name); setRolePerms(r.permissions ?? []);
    setRoleErr("");
  }

  async function saveRole() {
    if (!editRole) return;
    if (!roleName.trim()) { setRoleErr("Rol nomi majburiy"); return; }
    setRoleSaving(true); setRoleErr("");
    try {
      const res = await fetch(`/api/staff-roles/${editRole.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName.trim(), permissions: rolePerms }),
      });
      const data = await res.json();
      if (!res.ok) { setRoleErr(data.error ?? "Xatolik"); return; }
      mutate("/api/staff-roles"); mutate("/api/users");
      setEditRole(null);
    } catch { setRoleErr("Serverga ulanib bo'lmadi"); }
    finally { setRoleSaving(false); }
  }

  async function confirmDeleteRole() {
    if (!deleteRole) return;
    setRoleSaving(true);
    try {
      const res = await fetch(`/api/staff-roles/${deleteRole.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setRoleErr(data.error ?? "O'chirib bo'lmadi"); return; }
      mutate("/api/staff-roles");
      setDeleteRole(null);
    } finally { setRoleSaving(false); }
  }

  // ── Xodim amallari ─────────────────────────────────────────────────────────
  async function toggleActive(u: any) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    mutate("/api/users"); mutate("/api/organization");
  }

  async function confirmDeleteUser() {
    if (!deleteUser) return;
    setSaving(true);
    await fetch(`/api/users/${deleteUser.id}`, { method: "DELETE" });
    mutate("/api/users"); mutate("/api/organization");
    setDeleteUser(null); setSaving(false);
  }

  async function confirmReset() {
    if (!resetUser || resetPassword.length < 6) { setResetErr("Kamida 6 belgi kiriting"); return; }
    setResetSaving(true); setResetErr("");
    try {
      const res = await fetch(`/api/users/${resetUser.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setResetErr(data.error ?? "Xatolik"); return; }
      setResetUser(null); setResetPassword("");
    } catch { setResetErr("Serverga ulanib bo'lmadi"); }
    finally { setResetSaving(false); }
  }

  return (
    <div className="space-y-5">
      {/* Sarlavha */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Xodimlar va rollar</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            O'qituvchilar bu ro'yxatga kirmaydi — ular O'qituvchilar bo'limida qo'shiladi va limitga hisoblanmaydi
          </p>
        </div>
        <Button size="sm" onClick={openCreate} disabled={atLimit}
 className="gap-1.5 shrink-0 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-xs h-8">
          <Plus className="w-3.5 h-3.5" /> Xodim qo'shish
        </Button>
      </div>

      {/* Tarif limiti */}
      {typeof limit === "number" && (
        <div className={cn(
          "flex items-center justify-between rounded-xl border px-3.5 py-2.5",
          atLimit
            ? "border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20"
            : "border-white/60 dark:border-white/10 glass-soft",
        )}>
          <span className="text-[12px] text-neutral-600 dark:text-neutral-300">
            Xodim limiti — <strong>{used}/{limit}</strong>
            {org?.limits?.label ? ` (${org.limits.label})` : ""}
          </span>
          {atLimit && (
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              Limit to'ldi — tarifni yangilang
            </span>
          )}
        </div>
      )}

      {/* Rollar */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Rollar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="border border-white/60 dark:border-white/10 rounded-xl p-3 bg-neutral-50/60 dark:bg-neutral-800/30">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200">Admin</span>
              <span className="text-[11px] text-neutral-400">
                {users.filter(u => u.role === ADMIN).length} ta
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Barcha bo'limlarga to'liq kirish</p>
          </div>

          {roles.map(r => (
            <div key={r.id} className="border border-white/60 dark:border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">{r.name}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => openRoleEdit(r)} title="Imkoniyatlarni sozlash"
                    className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => setDeleteRole(r)} title="O'chirish"
                    className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {r.permissions.length} ta ruxsat · {r._count?.users ?? 0} ta xodim
              </p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-neutral-400">
          Yangi rol xodim qo'shish oynasida yaratiladi — rol bu xodimning imkoniyatlar to'plami.
        </p>
      </div>

      {/* Xodimlar ro'yxati */}
      <Card className="border border-white/60 dark:border-white/10 shadow-none">
        <CardContent className="p-0">
          {usersLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/50 dark:border-white/10 last:border-0">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Hali xodim qo'shilmagan</p>
            </div>
          ) : (
            users.map(u => (
              <div key={u.id}
                className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/10 last:border-0 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
                    u.isActive ? "bg-gradient-to-br from-blue-400 to-purple-500" : "bg-neutral-300 dark:bg-neutral-600",
                  )}>
                    {u.name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{u.name}</p>
                      {!u.isActive && (
                        <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded font-medium shrink-0">
                          Bloklangan
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                      {u.phone}{u.branch?.name ? ` · ${u.branch.name}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {u.role === ADMIN ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Admin
                    </span>
                  ) : (
                    <button
                      onClick={() => u.staffRole && openRoleEdit(rolesById[u.staffRole.id] ?? u.staffRole)}
                      title="Imkoniyatlarini sozlash"
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:opacity-80 transition-opacity">
                      <Shield className="w-3 h-3" />
                      {u.staffRole?.name ?? "Rolsiz"}
                    </button>
                  )}
                  <button onClick={() => { setResetUser(u); setResetPassword(""); setResetErr(""); }} title="Parolni tiklash"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEdit(u)} title="Tahrirlash"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleActive(u)} title={u.isActive ? "Bloklash" : "Faollashtirish"}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                      u.isActive
                        ? "text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20",
                    )}>
                    {u.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  </button>
                  {u.role !== ADMIN && (
                    <button onClick={() => setDeleteUser(u)} title="O'chirish"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Xodim qo'shish / tahrirlash ── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editUser ? "Xodimni tahrirlash" : "Yangi xodim"}
        subtitle={editUser ? undefined : "Ma'lumotlarni to'ldiring va rolini belgilang"}
        size="lg"
        footer={
          <>
            <Button onClick={submitStaff} disabled={saving}
 className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
              {saving ? "Saqlanmoqda..." : editUser ? "Saqlash" : "Qo'shish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowModal(false)}>Bekor</Button>
          </>
        }
      >
        <FormField label="Ism familiya" required={!editUser}>
          <Input placeholder="Sarvar Abdullayev" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-10" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Telefon" required={!editUser}>
            <PhoneInput value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          </FormField>
          <FormField label="Email" hint="Ixtiyoriy">
            <Input placeholder="email@mail.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-10" />
          </FormField>
        </div>

        <FormField
          label={editUser ? "Yangi parol" : "Parol"}
          required={!editUser}
          hint={editUser ? "Bo'sh qoldirsangiz o'zgarmaydi" : undefined}
        >
          <Input noAutofill name="staff-new-password" type="password" placeholder="Kamida 6 belgi" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="h-10" />
        </FormField>

        <FormField label="Filial">
          <select value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}
            className="w-full h-10 px-3 text-sm rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 outline-none">
            <option value="">Filial tanlanmagan</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FormField>

        {/* Rol = imkoniyatlar to'plami */}
        <FormField label="Rol" required>
          <div className="flex flex-wrap gap-1.5">
            <RoleChip label="Admin" active={roleSel === ADMIN} onClick={() => pickRole(ADMIN)} />
            {roles.map(r => (
              <RoleChip key={r.id} label={r.name} active={roleSel === r.id} onClick={() => pickRole(r.id)} />
            ))}
            <RoleChip label="+ Yangi rol" active={roleSel === NEW_ROLE} onClick={() => pickRole(NEW_ROLE)} />
          </div>
        </FormField>

        {roleSel === ADMIN ? (
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 glass-soft border border-white/60 dark:border-white/10 rounded-xl px-3 py-2.5">
            Admin barcha bo'limlarga to'liq kirish huquqiga ega — ruxsatlar sozlanmaydi.
          </p>
        ) : (
          <div className="space-y-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-3">
            {roleSel === NEW_ROLE && (
              <FormField label="Yangi rol nomi" required>
                <Input placeholder="Kassir, Buxgalter, Menejer..." value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)} className="h-10" />
              </FormField>
            )}
            <div>
              <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Imkoniyatlar <span className="text-neutral-400 font-normal">· {perms.length} ta tanlangan</span>
              </p>
              <p className="text-[11px] text-neutral-400 mb-2">
                {roleSel === NEW_ROLE
                  ? "Bu xodim panelda nimalarni ko'rishi va qila olishini belgilang"
                  : "O'zgartirsangiz shu roldagi barcha xodimlarga qo'llanadi"}
              </p>
              <PermissionPicker value={perms} onChange={setPerms} className="max-h-[34vh] overflow-y-auto pr-1" />
            </div>
          </div>
        )}

        {error && <ErrorBox text={error} />}
      </Modal>

      {/* ── Rol imkoniyatlarini sozlash ── */}
      <Modal
        open={!!editRole}
        onClose={() => setEditRole(null)}
        title="Rol imkoniyatlari"
        subtitle={`${rolePerms.length} ta ruxsat tanlangan`}
        size="lg"
        footer={
          <>
            <Button onClick={saveRole} disabled={roleSaving}
 className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
              {roleSaving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setEditRole(null)}>Bekor</Button>
          </>
        }
      >
        <FormField label="Rol nomi" required>
          <Input value={roleName} onChange={e => setRoleName(e.target.value)} className="h-10" />
        </FormField>
        <PermissionPicker value={rolePerms} onChange={setRolePerms} className="max-h-[46vh] overflow-y-auto pr-1" />
        {roleErr && <ErrorBox text={roleErr} />}
      </Modal>

      {/* ── Parol tiklash ── */}
      <Modal
        open={!!resetUser}
        onClose={() => { setResetUser(null); setResetPassword(""); setResetErr(""); }}
        title="Parolni tiklash"
        subtitle={resetUser ? `${resetUser.name} uchun yangi parol o'rnating` : ""}
        size="sm"
        footer={
          <>
            <Button onClick={confirmReset} disabled={resetSaving}
 className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
              {resetSaving ? "Saqlanmoqda..." : "Parolni yangilash"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]"
              onClick={() => { setResetUser(null); setResetPassword(""); setResetErr(""); }}>Bekor</Button>
          </>
        }
      >
        <FormField label="Yangi parol" required>
          <Input noAutofill name="staff-reset-password" type="password" placeholder="Kamida 6 belgi" value={resetPassword} autoFocus
            onChange={e => { setResetPassword(e.target.value); setResetErr(""); }} className="h-10" />
        </FormField>
        {resetErr && <ErrorBox text={resetErr} />}
      </Modal>

      <ConfirmDeleteModal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={confirmDeleteUser}
        loading={saving}
        title="Xodimni o'chirish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteUser?.name}</span> tizimdan o'chirilsinmi? Foydalanuvchi tizimga kira olmaydi.
        </>}
      />

      <ConfirmDeleteModal
        open={!!deleteRole}
        onClose={() => { setDeleteRole(null); setRoleErr(""); }}
        onConfirm={confirmDeleteRole}
        loading={roleSaving}
        title="Rolni o'chirish"
        description={roleErr ? (
          <span className="text-red-600 dark:text-red-400 font-medium">{roleErr}</span>
        ) : (
          <>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteRole?.name}</span> roli o'chirilsinmi? Bu rolda xodim bo'lsa, avval ularni boshqa rolga o'tkazing.
          </>
        )}
      />
    </div>
  );
}

function RoleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        "px-3 h-8 rounded-xl text-[12px] font-semibold border-2 transition-all",
        active
          ? "border-neutral-900 dark:border-neutral-100 bg-indigo-600 dark:bg-indigo-500 text-white"
          : "border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500",
      )}>
      {label}
    </button>
  );
}
