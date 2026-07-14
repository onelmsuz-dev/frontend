"use client";

import { useState } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteModal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { Branch, Room } from "@/types";
import {
  Plus, Trash2, Users, Building, Bell,
  MapPin, DoorOpen, Phone, CreditCard,
} from "lucide-react";
import { useBranches } from "@/lib/hooks/useBranches";
import { useRooms } from "@/lib/hooks/useRooms";
import { useOrganization } from "@/lib/hooks/useOrganization";
import { TarifSection } from "@/components/settings/tarif-section";
import { StaffSection } from "@/components/settings/staff-section";
import { mutate } from "swr";

const ROOM_TYPE_LABELS: Record<string, string> = {
  dars_xonasi: "Dars xonasi", kompyuter_lab: "Kompyuter lab", sport_zal: "Sport zal", akt_zal: "Akt zal",
};

const sections = [
  { id: "markaz",        label: "O'quv markaz",    icon: Building },
  { id: "tarif",         label: "Tarif",           icon: CreditCard },
  { id: "filliallar",    label: "Filliallar",      icon: MapPin },
  { id: "xonalar",       label: "Xonalar",         icon: DoorOpen },
  { id: "xodimlar",      label: "Xodimlar",        icon: Users },
  { id: "bildirishnoma", label: "Bildirishnomalar", icon: Bell },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-lg", className)} />;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("xodimlar");

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
    const res = await fetch(`/api/branches/${deleteBranch.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setBranchErr(data.error ?? "Filialni o'chirib bo'lmadi");
    }
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

          {/* ── Xodimlar va rollar ── */}
          {activeSection === "xodimlar" && <StaffSection branches={branches} />}

          {/* ── Tarif ── */}
          {activeSection === "tarif" && <TarifSection />}

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
                      <p className="text-[11px] text-neutral-400 mt-1.5">
                        Subdomen — markazning asosiy filiali. Qolgan filiallar shunga qo'shiladi.
                      </p>
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
              {!showBranchForm && branchErr && <p className="text-[12px] text-red-600 dark:text-red-400">{branchErr}</p>}
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
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[14px]">{branch.name}</h3>
                                {branch.isMain && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
                                    Asosiy
                                  </span>
                                )}
                              </div>
                              {branch.address && <div className="flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-neutral-400" /><p className="text-xs text-neutral-500">{branch.address}</p></div>}
                              {branch.phone && <div className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-neutral-400" /><p className="text-xs text-neutral-500">{branch.phone}</p></div>}
                            </div>
                          </div>
                          {!branch.isMain && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-red-600" onClick={() => setDeleteBranch(branch)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
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
