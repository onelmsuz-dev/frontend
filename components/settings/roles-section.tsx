"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import {
  useStaffRoles, usePermissionCatalog, useCreateStaffRole,
  useUpdateStaffRole, useDeleteStaffRole, type StaffRole,
} from "@/lib/hooks/useStaffRoles";
import { Shield, Plus, Pencil, Trash2, ChevronDown, Check } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-lg", className)} />;
}

export function RolesSection() {
  const { data: rolesRaw, isLoading } = useStaffRoles();
  const { data: catalog } = usePermissionCatalog();
  const roles: StaffRole[] = Array.isArray(rolesRaw) ? rolesRaw : [];

  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<StaffRole | null>(null);
  const [deleteRole, setDeleteRole] = useState<StaffRole | null>(null);

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const { trigger: createTrigger } = useCreateStaffRole();
  const { trigger: updateTrigger } = useUpdateStaffRole(editRole?.id ?? "");
  const { trigger: deleteTrigger } = useDeleteStaffRole(deleteRole?.id ?? "");

  const totalSelected = perms.size;

  function openCreate() {
    setEditRole(null); setName(""); setIsActive(true);
    setPerms(new Set()); setOpenGroups(new Set()); setErr(""); setShowModal(true);
  }
  function openEdit(r: StaffRole) {
    setEditRole(r); setName(r.name); setIsActive(r.isActive);
    setPerms(new Set(r.permissions)); setOpenGroups(new Set()); setErr(""); setShowModal(true);
  }

  function togglePerm(key: string) {
    setPerms(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  function toggleGroup(groupKeys: string[], allOn: boolean) {
    setPerms(prev => {
      const next = new Set(prev);
      groupKeys.forEach(k => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  }
  function toggleGroupOpen(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function save() {
    if (!name.trim()) { setErr("Rol nomi majburiy"); return; }
    setSaving(true); setErr("");
    try {
      const payload = { name: name.trim(), isActive, permissions: [...perms] };
      if (editRole) await updateTrigger(payload as any);
      else await createTrigger(payload as any);
      mutate("/api/staff-roles");
      setShowModal(false);
    } catch (e: any) {
      setErr(e?.error ?? "Xatolik yuz berdi");
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteRole) return;
    setSaving(true);
    try {
      await deleteTrigger();
      mutate("/api/staff-roles");
      setDeleteRole(null);
    } catch (e: any) {
      alert(e?.error ?? "O'chirib bo'lmadi");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Rollar va ruxsatlar</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Har bir rol uchun panelda nimalar ko'rinishini va qanday amallar bajarilishini belgilang
          </p>
        </div>
        <Button size="sm" onClick={openCreate}
          className="gap-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs h-8">
          <Plus className="w-3.5 h-3.5" /> Yangi rol
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : roles.length === 0 ? (
        <div className="py-12 text-center text-neutral-400">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Hali maxsus rol yaratilmagan</p>
          <p className="text-xs mt-1">Kassir, Buxgalter, Admin, Yordamchi kabi rollar yarating</p>
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map(r => (
            <Card key={r.id} className="border border-neutral-200 dark:border-neutral-800 shadow-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    r.isActive ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-200 dark:bg-neutral-700")}>
                    <Shield className={cn("w-4 h-4", r.isActive ? "text-white dark:text-neutral-900" : "text-neutral-400")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{r.name}</p>
                      {!r.isActive && <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-500 px-1.5 py-0.5 rounded">Faol emas</span>}
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      {r.permissions.length} ta ruxsat · {r._count?.users ?? 0} ta xodim
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(r)} title="Tahrirlash"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteRole(r)} title="O'chirish"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editRole ? "Rolni tahrirlash" : "Yangi rol"}
        subtitle={`${totalSelected} ta ruxsat tanlangan`}
        size="lg"
        footer={
          <>
            <Button onClick={save} disabled={saving}
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
              {saving ? "Saqlanmoqda..." : "Saqlash va yopish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowModal(false)}>Bekor</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 items-end">
            <FormField label="Rol nomi" required>
              <Input placeholder="Kassir, Buxgalter, Admin..." value={name} onChange={e => setName(e.target.value)} className="h-10" />
            </FormField>
            <label className="flex items-center gap-2 h-10 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded accent-neutral-900 dark:accent-neutral-100" />
              <span className="text-[13px] text-neutral-600 dark:text-neutral-300">Faol</span>
            </label>
          </div>

          <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
            {(catalog ?? []).map(group => {
              const groupKeys = group.permissions.map(p => p.key);
              const selectedIn = groupKeys.filter(k => perms.has(k)).length;
              const allOn = selectedIn === groupKeys.length && groupKeys.length > 0;
              const someOn = selectedIn > 0 && !allOn;
              const isOpen = openGroups.has(group.key);
              return (
                <div key={group.key} className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/50">
                    <button type="button" onClick={() => toggleGroup(groupKeys, allOn)}
                      className="flex items-center gap-2 flex-1 text-left">
                      <span className={cn(
                        "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                        allOn ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100"
                          : someOn ? "bg-neutral-400 border-neutral-400"
                          : "border-neutral-300 dark:border-neutral-600"
                      )}>
                        {(allOn || someOn) && <Check className="w-3 h-3 text-white dark:text-neutral-900" />}
                      </span>
                      <span className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">{group.label}</span>
                      <span className="text-[11px] text-neutral-400">{selectedIn}/{groupKeys.length}</span>
                    </button>
                    <button type="button" onClick={() => toggleGroupOpen(group.key)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {group.permissions.map(p => {
                        const on = perms.has(p.key);
                        return (
                          <label key={p.key} className="flex items-center gap-2 py-1 cursor-pointer">
                            <input type="checkbox" checked={on} onChange={() => togglePerm(p.key)}
                              className="w-4 h-4 rounded accent-neutral-900 dark:accent-neutral-100" />
                            <span className="text-[12px] text-neutral-600 dark:text-neutral-300">{p.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={!!deleteRole}
        onClose={() => setDeleteRole(null)}
        onConfirm={confirmDelete}
        loading={saving}
        title="Rolni o'chirish"
        description={<><span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteRole?.name}</span> roli o'chirilsinmi?</>}
      />
    </div>
  );
}
