"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { CreditCard, Info, Receipt, X, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { ReceiptModal } from "@/components/payments/receipt-modal";
import { StudentPicker, type PickedStudent } from "@/components/finance/student-picker";
import { BranchPicker } from "@/components/layout/branch-filter";
import { useBranch } from "@/lib/contexts/branch-context";
import { useStudent } from "@/lib/hooks/useStudents";
import { cn } from "@/lib/utils";
import { SELECTABLE_METHODS, methodGridCls } from "@/lib/payment-methods";
import { formatCurrency } from "@/lib/money";
import { fetcher } from "@/lib/fetcher";
import { activeFreeze, isFrozenNow, freezeUntilLabel, type FreezeLike } from "@/lib/freeze";




type Membership = {
  groupId: string;
  enrollmentStatus?: string;
  group?: { name?: string };
  freezes?: FreezeLike[];
};

type PayForm = {
  studentId: string;
  groupId: string;
  amount: string;
  method: string;
  note: string;
  /** Pul QAYSI kassaga tushdi. Bo'sh = o'quvchining o'z filiali. */
  branchId: string;
};

const EMPTY_FORM: PayForm = { studentId: "", groupId: "", amount: "", method: "NAQD", note: "", branchId: "" };

type AcceptPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  defaultStudentId?: string;
};

export function AcceptPaymentModal({
  open,
  onClose,
  defaultStudentId,
}: AcceptPaymentModalProps) {
  const { kopFilial } = useBranch();
  const [payForm, setPayForm] = useState<PayForm>(EMPTY_FORM);
  const [payFormErr, setPayFormErr] = useState("");
  const [saving, setSaving] = useState(false);
  // To'lov qabul qilinishi bilan chek OCHILADI — kassada qog'oz shu zahoti
  // kerak bo'ladi. Yopish bir bosishda, ya'ni chek kerak bo'lmasa xalaqit
  // qilmaydi.
  const [chekId, setChekId] = useState<string | null>(null);

  /**
   * QO'SHIMCHA TO'LOV — kitob, forma, sertifikat.
   *
   * Belgilanganda oyna `Payment` EMAS, `MaterialEntry` yaratadi.
   * Bu ataylab: `Payment` ga bayroq qo'yilsa, uni o'qiydigan 30 ta
   * joyning har biri filtrlashi kerak bo'lardi va bittasi unutilsa
   * (masalan o'qituvchi foizi) raqam jimgina noto'g'ri bo'lardi.
   * Kassir uchun farq yo'q — summa, usul va izoh o'sha joyda qoladi.
   */
  const [forMaterials, setForMaterials] = useState(false);
  const [category, setCategory] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const { data: categories } = useSWR<{ id: string; name: string }[]>(
    open && forMaterials ? "/api/materials/categories" : null,
    fetcher,
  );

  /**
   * QARZNI YOPISH — o'quvchi kartochkasidagi oyna bilan bir xil.
   *
   * Busiz kassir qarzni yopa olmasdi: oyna har doim YANGI SOTUV
   * yaratardi va qarz tegilmay qolardi (egasi 2026-09-20 da duch
   * keldi). Server tomonda `POST /api/materials/pay` bor edi,
   * shunchaki hech kim chaqirmasdi.
   */
  const [qarzYopish, setQarzYopish] = useState(false);
  const { data: matHolat } = useSWR<{ debt: number }>(
    open && forMaterials && payForm.studentId
      ? `/api/materials/student/${payForm.studentId}` : null,
    fetcher,
  );
  const matQarz = matHolat?.debt ?? 0;

  /**
   * Tanlangan o'quvchi — endi ro'yxatdan emas, qidiruvdan keladi.
   *
   * `undefined` = "kassir hali tanlamadi" (standart o'quvchi ishlatiladi),
   * `null` = "ataylab tozaladi". Ikkalasini ajratmasak, o'quvchi
   * kartasidan ochilgan oynada X bosilgan zahoti o'sha odam o'zidan
   * o'zi qaytib kelaverardi.
   */
  const [tanlov, setTanlov] = useState<PickedStudent | null | undefined>(undefined);

  // O'quvchi kartasidan ochilgan bo'lsa — BITTA so'rov, butun ro'yxat emas.
  const { data: boshlangich } = useStudent(defaultStudentId ?? "");
  const tanlangan: PickedStudent | null = tanlov !== undefined
    ? tanlov
    : (defaultStudentId ? ((boshlangich as PickedStudent | undefined) ?? null) : null);

  useEffect(() => {
    if (!open) return;
    setPayForm({ ...EMPTY_FORM, studentId: defaultStudentId ?? "" });
    setPayFormErr("");
    setTanlov(undefined);
  }, [open, defaultStudentId]);

  const selectedStudent = tanlangan;

  // To'lov QAYSI guruh uchun ekani — foizli o'qituvchi maoshi va kurs kesimidagi
  // tushum shunga qarab hisoblanadi. Ilgari `groups[0]` olinardi: o'quvchi
  // chiqib ketgan guruhga ham tushib ketishi mumkin edi.
  const payableGroups: Membership[] = (selectedStudent?.groups ?? []).filter(
    (sg: Membership) => sg.enrollmentStatus !== "CHIQIB_KETGAN",
  );

  // Tanlangan guruh — o'quvchi almashsa eski tanlov o'z-o'zidan bekor bo'ladi,
  // bitta a'zolik bo'lsa avtomatik o'sha tanlanadi (effekt kerak emas).
  const selectedGroupId =
    payableGroups.some(g => g.groupId === payForm.groupId)
      ? payForm.groupId
      : payableGroups.length === 1
        ? payableGroups[0].groupId
        : "";

  // MUZLATILGAN GURUHGA TO'LOV — to'xtatilmaydi, lekin OGOHLANTIRILADI
  // (Doniyorjon, 2026-09-22: adashib muzlatilgan guruhga to'lab yuborishadi).
  // Pul balansga tushadi va o'quvchi qaytganda ishlatiladi, shuning uchun
  // taqiq emas; xodim bilib tursin, xolos.
  const tanlanganMuz = activeFreeze(
    payableGroups.find(g => g.groupId === selectedGroupId)?.freezes);

  function handleClose() {
    setPayForm(EMPTY_FORM);
    setPayFormErr("");
    setForMaterials(false);
    setQarzYopish(false);
    setCategory("");
    setInfoOpen(false);
    onClose();
  }

  /**
   * Qo'shimcha to'lov — sotuv va uning to'lovi bitta amalda.
   *
   * `paidNow` server tarafda ikkalasini bitta tranzaksiyada yozadi:
   * qarz yozilib to'lovi yozilmay qolsa, o'quvchida sababsiz qarz
   * paydo bo'lardi.
   */
  async function submitMaterials() {
    const yopish = qarzYopish && matQarz > 0;
    const res = await fetch(yopish ? "/api/materials/pay" : "/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(yopish
        ? {
            studentId: payForm.studentId,
            amount: Number(payForm.amount),
            method: payForm.method,
            note: payForm.note || undefined,
          }
        : {
            studentId: payForm.studentId,
            category: category.trim(),
            amount: Number(payForm.amount),
            method: payForm.method,
            note: payForm.note || undefined,
            paidNow: true,
          }),
    });

    if (!res.ok) {
      const xato = await res.json().catch(() => null);
      setPayFormErr(xato?.error ?? "Xatolik yuz berdi");
      return;
    }

    void mutate(key => typeof key === "string" && key.startsWith("/api/materials"));
    void mutate(key => typeof key === "string" && key.startsWith("/api/dashboard"));
    void mutate(key => typeof key === "string" && key.startsWith("/api/reports"));
    // Chek ochilmaydi: bu kurs to'lovi emas va `ReceiptModal`
    // `Payment` id sini kutadi.
    handleClose();
  }

  async function submitPayment() {
    if (!payForm.studentId) { setPayFormErr("O'quvchini tanlang"); return; }
    if (!payForm.amount || Number(payForm.amount) <= 0) { setPayFormErr("Summani kiriting"); return; }
    if (!forMaterials && payableGroups.length > 1 && !selectedGroupId) {
      setPayFormErr("Qaysi guruh uchun to'lov ekanini tanlang"); return;
    }
    if (forMaterials && !qarzYopish && !category.trim()) {
      setPayFormErr("Nima uchun to'lov ekanini tanlang"); return;
    }
    // Qarzdan ko'p to'lab bo'lmaydi — ortiqcha pulni bu jurnalda
    // ishlatib bo'lmaydi (server ham rad etadi).
    if (forMaterials && qarzYopish && Number(payForm.amount) > matQarz) {
      setPayFormErr(`Qarzdan ko'p: ${formatCurrency(matQarz)} qarz bor`); return;
    }
    setPayFormErr("");
    setSaving(true);
    try {
      if (forMaterials) {
        await submitMaterials();
        return;
      }

      const groupId = selectedGroupId || payableGroups[0]?.groupId;
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: payForm.studentId,
          amount: Number(payForm.amount),
          method: payForm.method,
          note: payForm.note || undefined,
          ...(groupId ? { groupId } : {}),
          ...(payForm.branchId ? { branchId: payForm.branchId } : {}),
        }),
      });
      const created = await res.json().catch(() => null);
      if (!res.ok) {
        setPayFormErr(created?.error ?? "Xatolik yuz berdi");
        return;
      }
      void mutate(key => typeof key === "string" && key.startsWith("/api/payments"));
      void mutate("/api/students");
      void mutate(key => typeof key === "string" && key.startsWith("/api/dashboard"));
      void mutate(key => typeof key === "string" && key.startsWith("/api/reports"));
      handleClose();
      if (created?.id) setChekId(created.id);
    } catch {
      setPayFormErr("Serverga ulanib bo'lmadi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <ModalOverlay open={open} onClose={handleClose}>
      <div className="glass-strong rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden border border-white/60 dark:border-white/10">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/50 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-5 h-5 text-neutral-500 shrink-0" />
            <h2 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100 truncate">
              To&apos;lov qabul qilish
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 dark:hover:bg-white/10 text-neutral-400 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div>
            <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">O&apos;quvchi</Label>
            <StudentPicker
              value={tanlangan}
              autoFocus={!defaultStudentId}
              onChange={(s) => {
                setTanlov(s);
                // Guruh tanlovi eski o'quvchiniki bo'lib qolmasin.
                setPayForm(p => ({ ...p, studentId: s?.id ?? "", groupId: "" }));
                setPayFormErr("");
              }}
            />
          </div>

          {/* Qo'shimcha to'lovda guruh SO'RALMAYDI: kitob puli birorta
              guruhga bog'lanmaydi va tanlov javobsiz savol bo'lib
              qolardi (o'quvchi kartochkasidagi oyna ham shunday). */}
          {!forMaterials && payableGroups.length > 1 && (
            <div>
              <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                Qaysi guruh uchun
              </Label>
              <select
                value={selectedGroupId}
                onChange={e => setPayForm(p => ({ ...p, groupId: e.target.value }))}
                className="w-full h-10 sm:h-9 px-3 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                <option value="">Tanlang…</option>
                {payableGroups.map(sg => (
                  <option key={sg.groupId} value={sg.groupId}>
                    {sg.group?.name ?? sg.groupId}{isFrozenNow(sg.freezes) ? " — muzlatilgan" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!forMaterials && tanlanganMuz && (
            <div className="flex items-start gap-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-900/40 px-3 py-2">
              <Snowflake className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
              <p className="text-[12px] text-sky-800 dark:text-sky-200">
                Bu guruhda a&apos;zolik <strong>muzlatilgan</strong> ({freezeUntilLabel(tanlanganMuz)}).
                To&apos;lov balansga tushadi va o&apos;quvchi qaytganda ishlatiladi — guruh to&apos;g&apos;ri tanlanganini tekshiring.
              </p>
            </div>
          )}

          {/* FILIAL — pul qaysi kassaga tushdi. Bo'sh qoldirilsa
              o'quvchining o'z filialiga yoziladi; boshqa filialda to'lasa
              kassir shu yerda ko'rsatadi, aks holda tushum noto'g'ri
              filial hisobotiga tushardi. */}
          {kopFilial && (
            <div>
              <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                Filial (kassa)
              </Label>
              <BranchPicker value={payForm.branchId}
                onChange={(v) => setPayForm(p => ({ ...p, branchId: v }))}
                hammasiLabel="O'quvchining filiali"
                className="h-10 sm:h-9 rounded-md text-sm" />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-medium text-neutral-500">Summa (so&apos;m)</Label>
              {/* QARZNI BIR BOSISHDA. Kassirning eng ko'p qiladigan ishi —
                  qarzni to'liq yopish. Ilgari u balansga qarab, raqamni
                  qo'lda ko'chirib yozardi va aynan shu joyda xato qilardi. */}
              {selectedStudent && selectedStudent.balance < 0 && (
                <button type="button"
                  onClick={() => setPayForm(p => ({
                    ...p, amount: String(Math.round(Math.abs(selectedStudent.balance))),
                  }))}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400
                    hover:underline">
                  {`Qarzni to'liq: ${formatCurrency(Math.abs(selectedStudent.balance))}`}
                </button>
              )}
            </div>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="400000"
              value={payForm.amount}
              onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
              className="h-10 sm:h-9 text-sm"
            />
          </div>

          {/* QO'SHIMCHA TO'LOV. Kassir kitob yoki forma pulini shu yerda
              yozadi — o'quvchi kartochkasiga o'tmasdan. Belgilanganda
              yozuv boshqa jurnalga tushadi: o'quvchi balansi va
              o'qituvchi foizi tegilmaydi. */}
          <div className="rounded-xl border border-white/60 dark:border-white/10 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForMaterials(v => !v)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <span className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                  forMaterials
                    ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500"
                    : "border-neutral-300 dark:border-white/20",
                )}>
                  <Receipt className={cn("w-3 h-3", forMaterials ? "text-white" : "text-neutral-400")} />
                </span>
                <span className="text-[12px] font-medium text-neutral-600 dark:text-neutral-300">
                  O&apos;quv materiallari uchun
                </span>
              </button>

              <button
                type="button"
                onClick={() => setInfoOpen(v => !v)}
                aria-label="Bu qanaqa to'lov"
                className="p-1 rounded-lg text-neutral-400 hover:text-indigo-600
                  dark:hover:text-indigo-400 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {infoOpen && (
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Kitob, ish daftari, forma, sertifikat kabi to&apos;lovlar.
                O&apos;quvchining kurs qarziga ta&apos;sir qilmaydi va
                o&apos;qituvchi foiziga kirmaydi, lekin markaz daromadida
                hamda &laquo;Qo&apos;shimcha to&apos;lovlar&raquo; hisobotida
                ko&apos;rinadi.
              </p>
            )}

            {forMaterials && matQarz > 0 && (
              /* REJIM — faqat qarzi bor o'quvchida. */
              <div className="mt-2.5">
                <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                  Qarz: {formatCurrency(matQarz)}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { v: true,  l: "Qarzni yopish" },
                    { v: false, l: "Yangi sotuv" },
                  ].map(o => (
                    <button key={String(o.v)} type="button"
                      onClick={() => { setQarzYopish(o.v); setPayFormErr(""); }}
                      className={cn("h-8 rounded-lg text-[12px] font-semibold border transition-colors",
                        qarzYopish === o.v
                          ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500"
                          : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-indigo-400")}>
                      {o.l}
                    </button>
                  ))}
                </div>
                {qarzYopish && (
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    Ko&apos;pi bilan {formatCurrency(matQarz)}. Kamroq to&apos;lasangiz —
                    qolgani qarzda qoladi.
                  </p>
                )}
              </div>
            )}

            {forMaterials && !qarzYopish && (
              <div className="mt-2.5">
                <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                  Nima uchun
                </Label>
                {categories === undefined ? (
                  <p className="text-[11px] text-neutral-400">Yuklanmoqda...</p>
                ) : categories.length === 0 ? (
                  <p className="text-[11px] text-neutral-400">
                    Kategoriya yo&apos;q — sozlamalardan qo&apos;shing.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(k => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setCategory(k.name)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
                          category === k.name
                            ? "bg-indigo-600 text-white dark:bg-indigo-500 border-indigo-600"
                            : "border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10",
                        )}
                      >
                        {k.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium text-neutral-500 mb-2 block">To&apos;lov usuli</Label>
            {/* Ustunlar soni ro'yxat uzunligidan hisoblanadi — ilgari
                `grid-cols-4` qattiq yozilgan va aynan to'rtta usulga
                moslangandi. */}
            <div className={cn("grid gap-2", methodGridCls(SELECTABLE_METHODS.length))}>
              {SELECTABLE_METHODS.map(({ value: m, label }) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayForm(p => ({ ...p, method: m }))}
                  className={cn(
                    "py-2.5 sm:py-2 rounded-xl text-[12px] font-semibold border transition-colors",
                    payForm.method === m
                      ? "bg-indigo-600 text-white dark:bg-indigo-500 border-neutral-900 dark:border-neutral-100"
                      : "border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Izoh (ixtiyoriy)</Label>
            <Input
              placeholder="Masalan: Iyun oyi to'lovi"
              value={payForm.note}
              onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))}
              className="h-10 sm:h-9 text-sm"
            />
          </div>

          {payFormErr && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl px-3 py-2.5">
              <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{payFormErr}</p>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-white/50 dark:border-white/10 shrink-0 flex flex-col-reverse sm:flex-row gap-2">
          <Button
 className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 h-10"
            disabled={saving}
            onClick={submitPayment}
          >
            {saving
              ? "Saqlanmoqda..."
              : forMaterials
                ? (qarzYopish ? "Qarzni yopish" : "Qo'shimcha to'lovni yozish")
                : "To'lovni qabul qilish"}
          </Button>
          <Button variant="outline" className="h-10 sm:px-4" onClick={handleClose}>
            Bekor
          </Button>
        </div>
      </div>
    </ModalOverlay>

    <ReceiptModal paymentId={chekId} open={!!chekId}
      onClose={() => setChekId(null)} />
    </>
  );
}
