"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteModal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { TOUR_TARGETS } from "@/lib/onboarding/steps";
import { OnboardingSettingsPanel } from "@/components/onboarding/onboarding-settings-panel";
import { BillingSettings } from "@/components/settings/billing-settings";
import { ActivitySection } from "@/components/settings/activity-section";
import { useOnboardingCtx } from "@/lib/contexts/onboarding-context";
import type { Branch, Room } from "@/types";
import {
  Plus, Trash2, Users, Building, Bell,
  MapPin, DoorOpen, Phone, CreditCard, MessageSquare, Rocket, Wallet, History,
} from "lucide-react";
import { useBranches } from "@/lib/hooks/useBranches";
import { useRooms } from "@/lib/hooks/useRooms";
import { useOrganization } from "@/lib/hooks/useOrganization";
import { useSms, useSmsAutomation, useUpdateSmsAutomation } from "@/lib/hooks/useSms";
import { TarifSection } from "@/components/settings/tarif-section";
import { StaffSection } from "@/components/settings/staff-section";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { mutate } from "swr";

/** Markaz ish kunlari — guruh jadvalidagi kalitlar bilan bir xil. */
const WORK_DAYS = [
  { v: "DUSHANBA", l: "Du" }, { v: "SESHANBA", l: "Se" }, { v: "CHORSHANBA", l: "Cho" },
  { v: "PAYSHANBA", l: "Pay" }, { v: "JUMA", l: "Ju" }, { v: "SHANBA", l: "Sha" },
  { v: "YAKSHANBA", l: "Yak" },
];

const sections = [
  { id: "markaz",        label: "O'quv markaz",    icon: Building },
  { id: "tolov",         label: "To'lov qoidalari", icon: Wallet },
  { id: "tarif",         label: "Tarif",           icon: CreditCard },
  { id: "filliallar",    label: "Filliallar",      icon: MapPin },
  { id: "xonalar",       label: "Xonalar",         icon: DoorOpen },
  { id: "xodimlar",      label: "Xodimlar",        icon: Users },
  { id: "bildirishnoma", label: "Bildirishnomalar", icon: Bell },
  // Yo'l ko'rsatuvchi bayrog'i o'chiq markazda bu tab ko'rsatilmaydi
  // (quyida `visibleSections` da filtrlanadi).
  { id: "organish",      label: "Yo'l ko'rsatuvchi", icon: Rocket, feature: "onboarding" },
  // Harakatlar tarixi ham bayroq ortida chiqariladi va qo'shimcha ravishda
  // `activity.view` ruxsatini talab qiladi — jurnalda kim qachon nima
  // qilgani turadi, uni har bir xodimga ochib qo'yish markaz ichidagi
  // munosabatga aralashish bo'lardi.
  { id: "harakatlar",    label: "So'nggi harakatlar", icon: History,
    feature: "activity", perm: "activity.view" },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-lg", className)} />;
}

/**
 * `useSearchParams` Suspense chegarasini talab qiladi (aks holda butun
 * sahifa oldindan chizilmaydi) — shuning uchun asosiy komponent ichkarida.
 */
export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const [activeSection, setActiveSection] = useState("xodimlar");

  // Bayroq va ruxsat ortidagi bo'limlar.
  //
  // Ilgari bu filtr FAQAT onboarding'ni bilardi (`|| onboardingEnabled`) —
  // ya'ni bayroq ortidagi ikkinchi bo'lim qo'shilgan zahoti u ham
  // onboarding bayrog'iga bog'lanib qolardi. Endi har bo'lim o'z kalitini
  // ko'rsatadi va tekshiruv umumiy.
  const { enabled: onboardingEnabled } = useOnboardingCtx();
  const features = useFeatures().data;
  const { me } = useMe();

  const visibleSections = sections.filter((s) => {
    const key = "feature" in s ? (s.feature as string) : null;
    if (key) {
      const on = key === "onboarding" ? onboardingEnabled : features?.[key];
      // `undefined` = bayroqlar hali yuklanmagan — tab ko'rsatilmaydi.
      // Ko'rsatib keyin yo'qotish sakrashga olib kelardi.
      if (!on) return false;
    }
    if ("perm" in s && !hasPerm(me?.permissions, s.perm as string)) return false;
    return true;
  });

  // Boshqa sahifadan aniq bo'limga o'tish: /settings?tab=xonalar (masalan
  // guruh kartochkasidagi ogohlantirish yoki yo'l ko'rsatuvchining turi).
  //
  // `useSearchParams` — `window.location` EMAS: ikkinchisi faqat mount'da
  // bir marta o'qilardi va foydalanuvchi ALLAQACHON /settings da turganda
  // `?tab=xonalar` ga o'tish hech qanday ta'sir qilmasdi (tur aynan shu
  // yerda tiqilib qolardi). Bu hook har o'zgarishda qayta ishlaydi va
  // gidratsiya nomuvofiqligi ham bo'lmaydi.
  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get("tab");
    // Noma'lum qiymat berilsa hech bir bo'lim chizilmay, sahifa bo'sh
    // ko'rinardi — faqat mavjud bo'limlar qabul qilinadi.
    // `visibleSections` — `sections` emas: aks holda bayroq o'chiq yoki
    // ruxsati yo'q foydalanuvchi `?tab=harakatlar` havolasi bilan bo'limni
    // ochib olardi (chap ro'yxatda tugma ko'rinmasa ham).
    if (tab && visibleSections.some(sec => sec.id === tab)) setActiveSection(tab);
  }, [searchParams, visibleSections]);

  // Tarif bloklangan bo'lsa — to'lov bo'limiga to'g'ridan-to'g'ri yo'naltiramiz
  useEffect(() => {
    if (me?.subscriptionBlocked) setActiveSection("tarif");
  }, [me?.subscriptionBlocked]);

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
  const [newRoom, setNewRoom] = useState({ name: "", branchId: "", capacity: "" });
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomErr, setRoomErr] = useState("");

  const [orgForm, setOrgForm] = useState<{
    name: string; workDays: string[] | null; workStart: string; workEnd: string;
  }>({ name: "", workDays: null, workStart: "", workEnd: "" });

  // Ish kunlari — belgilanmagan bo'lsa markazning hozirgi sozlamasi.
  const workDays = orgForm.workDays ?? orgData?.workDays ?? [];
  const toggleWorkDay = (v: string) =>
    setOrgForm(p => {
      const cur = p.workDays ?? orgData?.workDays ?? [];
      const list = cur as string[];
      return { ...p, workDays: list.includes(v) ? list.filter((d: string) => d !== v) : [...list, v] };
    });
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgErr, setOrgErr] = useState("");

  // ── Bildirishnomalar ──
  // Bu bo'lim ilgari to'liq soxta edi: toggle'lar `defaultChecked` bilan
  // chizilgan, "Saqlash" hech qayerga bormas edi. Endi haqiqiy /api/sms va
  // /api/sms/automation endpointlariga ulangan (SMS sahifasi bilan bir manba).
  const { data: smsStatus, isLoading: smsLoading } = useSms();
  const { data: automation, mutate: mutateAutomation } = useSmsAutomation();
  const { trigger: saveAutomation, isMutating: automationSaving } = useUpdateSmsAutomation();
  const [automationErr, setAutomationErr] = useState("");

  const smsBalance    = smsStatus?.balance ?? 0;
  const smsConfigured = smsStatus?.configured ?? false;

  async function toggleAbsenceSms(enabled: boolean, templateId?: string | null) {
    setAutomationErr("");
    try {
      await saveAutomation({ enabled, templateId: templateId ?? automation?.absence.templateId } as any);
      mutateAutomation();
    } catch (e: any) {
      setAutomationErr(e?.error ?? "Saqlab bo'lmadi");
    }
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
      setNewRoom({ name: "", branchId: "", capacity: "" });
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
      const res = await fetch("/api/organization", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgForm.name || orgData?.name,
          ...(orgForm.workDays ? { workDays: orgForm.workDays } : {}),
          ...(orgForm.workStart ? { workStart: orgForm.workStart } : {}),
          ...(orgForm.workEnd ? { workEnd: orgForm.workEnd } : {}),
        }),
      });
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

      {/* Mobilda ustma-ust, kattaroq ekranda yonma-yon.
          Ilgari `flex` doimiy edi va 208px lik yon menyu telefonda ekranning
          yarmini egallab, kontent qolgan tor joyga siqilib chiqib ketardi. */}
      <div className="p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Bo'limlar — mobilda gorizontal lenta, desktopda yon menyu */}
        <div className="lg:w-52 lg:shrink-0 -mx-1 px-1 lg:mx-0 lg:px-0">
          <nav className="flex lg:flex-col gap-1.5 lg:gap-0.5 overflow-x-auto pb-1 lg:pb-0
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleSections.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  data-tour={`settings-tab-${s.id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors",
                    "shrink-0 whitespace-nowrap px-3 py-2.5 lg:w-full",
                    activeSection === s.id
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "glass-soft lg:bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10"
                  )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0 max-w-3xl space-y-4">

          {/* ── Xodimlar va rollar ── */}
          {activeSection === "xodimlar" && <StaffSection branches={branches} />}

          {/* ── Tarif ── */}
          {activeSection === "tarif" && <TarifSection />}

          {/* ── O'quv markaz ── */}
          {activeSection === "markaz" && (
            <Card className="border border-white/60 dark:border-white/10 shadow-none">
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
                        <Input defaultValue={orgData?.subdomain ?? ""} disabled className="h-9 text-sm rounded-r-none glass-soft" />
                        <span className="flex items-center px-3 glass-soft border border-l-0 border-white/60 dark:border-white/10 rounded-r-lg text-sm text-neutral-500">.oneroom.uz</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1.5">
                        Subdomen — markazning asosiy filiali. Qolgan filiallar shunga qo'shiladi.
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Ish kunlari</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {WORK_DAYS.map(d => {
                          const on = workDays.includes(d.v);
                          return (
                            <button key={d.v} type="button" onClick={() => toggleWorkDay(d.v)}
                              className={cn("px-2.5 h-8 rounded-lg text-[12px] font-semibold border transition-colors",
                                on
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "glass-soft border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-indigo-400")}>
                              {d.l}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1.5">
                        Markaz ishlaydigan kunlar — jadval shu kunlarni asos qilib oladi.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Ish boshlanishi</Label>
                        <Input type="time"
                          value={orgForm.workStart || orgData?.workStart || "08:00"}
                          onChange={e => setOrgForm(p => ({ ...p, workStart: e.target.value }))}
                          className="h-9 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Ish tugashi</Label>
                        <Input type="time"
                          value={orgForm.workEnd || orgData?.workEnd || "20:00"}
                          onChange={e => setOrgForm(p => ({ ...p, workEnd: e.target.value }))}
                          className="h-9 text-sm" />
                      </div>
                      <p className="col-span-2 text-[11px] text-neutral-400 -mt-1">
                        Jadval setkasi shu oraliqda chiziladi. Bu oraliqdan tashqarida dars
                        bo'lsa, jadval o'zi kengayadi — dars yashirinib qolmaydi.
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Tarif rejasi</Label>
                      <Input defaultValue={orgData?.plan ?? ""} disabled className="h-9 text-sm glass-soft" />
                    </div>
                    {orgErr && (
                      <p className="text-[12px] text-red-600 dark:text-red-400">{orgErr}</p>
                    )}
 <Button onClick={saveOrg} disabled={orgSaving} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 mt-2">
                      {orgSaving ? "Saqlanmoqda..." : "Saqlash"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── To'lov qoidalari ── */}
          {activeSection === "tolov" && (
            <BillingSettings org={orgData} onSaved={() => mutate("/api/organization")} />
          )}

          {/* ── Yo'l ko'rsatuvchi ── */}
          {activeSection === "organish" && <OnboardingSettingsPanel />}

          {activeSection === "harakatlar" && <ActivitySection />}

          {/* ── Filliallar ── */}
          {activeSection === "filliallar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {branchesLoading ? "Yuklanmoqda..." : `${branches.length} ta filial`}
                </p>
                <Button size="sm" onClick={() => { setShowBranchForm(v => !v); setBranchErr(""); }}
 className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-xs h-8">
                  <Plus className="w-3.5 h-3.5" /> Filial qo'shish
                </Button>
              </div>
              {showBranchForm && (
                <Card className="border border-white/60 dark:border-white/10 shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold">Yangi filial</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs text-neutral-500 mb-1 block">Filial nomi *</Label><Input placeholder="Mirzo Ulug'bek filiali" value={newBranch.name} onChange={e => setNewBranch(p => ({...p, name: e.target.value}))} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs text-neutral-500 mb-1 block">Telefon</Label><Input placeholder="+998 71 ..." value={newBranch.phone} onChange={e => setNewBranch(p => ({...p, phone: e.target.value}))} className="h-8 text-sm" /></div>
                      <div className="col-span-2"><Label className="text-xs text-neutral-500 mb-1 block">Manzil</Label><Input placeholder="Shahar, tuman, ko'cha" value={newBranch.address} onChange={e => setNewBranch(p => ({...p, address: e.target.value}))} className="h-8 text-sm" /></div>
                    </div>
                    {branchErr && <p className="text-[12px] text-red-600 dark:text-red-400">{branchErr}</p>}
                    <div className="flex gap-2">
 <Button size="sm" onClick={addBranch} disabled={branchSaving} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 h-8 text-xs">
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
                    <Card key={branch.id} className="border border-white/60 dark:border-white/10 shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 glass-soft rounded-xl flex items-center justify-center shrink-0"><Building className="w-5 h-5 text-neutral-500" /></div>
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
                        <div className="flex gap-4 mt-3 pt-3 border-t border-white/50 dark:border-white/10">
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
 <Button size="sm" data-tour={TOUR_TARGETS.roomAddBtn} onClick={() => { setShowRoomForm(true); setRoomErr(""); }} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-xs h-8"><Plus className="w-3.5 h-3.5" /> Xona qo'shish</Button>
              </div>
              {showRoomForm && (
                <Card className="border border-white/60 dark:border-white/10 shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold">Yangi xona</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div data-tour={TOUR_TARGETS.roomNameInput}><Label className="text-xs text-neutral-500 mb-1 block">Xona nomi *</Label><Input placeholder="4-xona" value={newRoom.name} onChange={e => setNewRoom(p => ({...p, name: e.target.value}))} className="h-8 text-sm" /></div>
                      <div><Label className="text-xs text-neutral-500 mb-1 block">Sig'imi</Label><Input type="number" placeholder="15" value={newRoom.capacity} onChange={e => setNewRoom(p => ({...p, capacity: e.target.value}))} className="h-8 text-sm" /></div>
                      <div className="col-span-2"><Label className="text-xs text-neutral-500 mb-1 block">Filial</Label>
                        <select value={newRoom.branchId || branches[0]?.id || ""} onChange={e => setNewRoom(p => ({...p, branchId: e.target.value}))} className="w-full h-8 px-2 text-sm rounded-md border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 outline-none">
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    </div>
                    {roomErr && <p className="text-[12px] text-red-600 dark:text-red-400">{roomErr}</p>}
                    <div className="flex gap-2">
 <Button size="sm" data-tour={TOUR_TARGETS.roomSaveBtn} onClick={addRoom} disabled={roomSaving} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 h-8 text-xs">
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
                          <Card key={room.id} className="border border-white/60 dark:border-white/10 shadow-none">
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className="w-9 h-9 glass-soft rounded-lg flex items-center justify-center shrink-0"><DoorOpen className="w-4 h-4 text-neutral-500" /></div>
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
            <div className="space-y-4">

              {/* SMS holati — haqiqiy ma'lumot */}
              <Card className="border border-white/60 dark:border-white/10 shadow-none">
                <CardHeader className="pb-3"><CardTitle className="text-[15px]">SMS holati</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center justify-between py-2 border-b border-white/50 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Eskiz.uz shlyuzi</span>
                    </div>
                    {smsLoading ? <Skeleton className="h-5 w-20" /> : (
                      <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-semibold",
                        smsConfigured
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400")}>
                        {smsConfigured ? "Ulangan" : "Ulanmagan"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">SMS balansi</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {smsLoading
                        ? <Skeleton className="h-5 w-16" />
                        : <span className={cn("text-[13px] font-black",
                            smsBalance > 0 ? "text-neutral-900 dark:text-neutral-100" : "text-red-500")}>
                            {smsBalance} ta
                          </span>}
                      <a href="/sms" className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                        SMS bo'limi →
                      </a>
                    </div>
                  </div>
                  {!smsLoading && !smsConfigured && (
                    <p className="text-[11px] text-neutral-400">
                      Shlyuz platforma darajasida sozlanadi — ulanmagan bo'lsa hech qanday SMS yuborilmaydi.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Ishlaydigan avtomatik bildirishnoma */}
              <Card className="border border-white/60 dark:border-white/10 shadow-none">
                <CardHeader className="pb-3"><CardTitle className="text-[15px]">Avtomatik bildirishnomalar</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-white/50 dark:border-white/10 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                        Davomat: &quot;Kelmadi&quot; belgilanganda ota-onaga SMS
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        O&apos;qituvchi o&apos;quvchini &quot;Kelmadi&quot; deb belgilasa — ota-onasiga
                        (raqami bo&apos;lmasa o&apos;ziga) tanlangan matn avtomatik yuboriladi.
                      </p>
                      {automation?.absence.enabled && (
                        <select
                          value={automation.absence.templateId ?? ""}
                          onChange={e => toggleAbsenceSms(true, e.target.value)}
                          className="mt-2 h-8 px-2.5 text-[12px] rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
                          {(automation.availableTemplates ?? []).length === 0 && <option value="">Tasdiqlangan matn yo&apos;q</option>}
                          {(automation.availableTemplates ?? []).map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const next = !automation?.absence.enabled;
                        if (next && !automation?.availableTemplates?.length) {
                          setAutomationErr("Avval SMS bo'limida tasdiqlangan matn qo'shing");
                          return;
                        }
                        toggleAbsenceSms(next, automation?.availableTemplates?.[0]?.id);
                      }}
                      disabled={automationSaving}
                      className={cn(
                        "relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60",
                        automation?.absence.enabled ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-600",
                      )}>
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                        automation?.absence.enabled && "translate-x-4",
                      )} />
                    </button>
                  </div>
                  {automationErr && <p className="text-[12px] text-red-600 dark:text-red-400">{automationErr}</p>}
                  <p className="text-[11px] text-neutral-400">
                    O&apos;zgarish darhol saqlanadi — alohida tasdiqlash shart emas.
                  </p>
                </CardContent>
              </Card>

              {/* Hali yo'q imkoniyatlar — soxta tugma o'rniga rostini aytamiz */}
              <Card className="border border-white/60 dark:border-white/10 shadow-none">
                <CardHeader className="pb-3"><CardTitle className="text-[15px]">Rejalashtirilgan</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {[
                    { label: "To'lov eslatmasi (oylik)",        note: "Rejalashtiruvchi (cron) kerak" },
                    { label: "Yangi lid qo'shilganda email",    note: "Email yuborish integratsiyasi yo'q" },
                    { label: "Telegram bot bildirishnomalari",  note: "Bot integratsiyasi yo'q" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/50 dark:border-white/10 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-400 dark:text-neutral-500">{item.label}</p>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-600">{item.note}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-lg font-semibold bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 shrink-0">
                        Tez orada
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
