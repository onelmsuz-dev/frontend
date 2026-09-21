"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import QRCode from "qrcode";
import { Printer, Loader2, X, Download, Share2, Check, FileText } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import {
  drawReceipt, canvasBlob, receiptPdf, saqla, type ReceiptData,
} from "@/lib/receipt-canvas";
import { cn } from "@/lib/utils";
import { ModalOverlay } from "@/components/ui/modal-overlay";

/**
 * TO'LOV CHEKI — ko'rish, chop etish, yuklash, jo'natish.
 *
 * CHEK KANVASGA CHIZILADI, HTML sifatida emas. Sabab amaliy: bitta
 * chizilgan rasm ham ekranda ko'rinadi, ham PNG bo'lib yuklanadi, ham
 * PDF ichiga tushadi, ham Telegramga jo'natiladi — hammasi AYNAN bir xil
 * ko'rinishda. HTML bo'lganda har bir yo'l uchun alohida ko'rinish
 * yasash kerak bo'lardi va ular vaqt o'tib bir-biridan uzoqlashardi.
 *
 * "QAYSI OY UCHUN" serverdan TAYYOR keladi va `planGroupLedger()` izidan
 * olinadi. Bu yerda qayta hisoblanmaydi: chek bilan panel har xil raqam
 * ko'rsatsa, mijoz bilan bahsda qog'oz yutadi.
 */

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #chek, #chek * { visibility: visible !important; }
  /* CHEK \`body\` NING TO'G'RIDAN-TO'G'RI BOLASI — modal ichida emas.

     NEGA SHUNDAY: \`position: absolute\` eng yaqin JOYLASHTIRILGAN yoki
     TRANSFORM qilingan ajdodga nisbatan hisoblanadi. Umumiy modal
     qavati (\`ModalOverlay\`) panelida ochilish animatsiyasi uchun
     \`transform\` bor — ya'ni chek sahifa emas, PANEL boshiga
     qo'yilardi. Panel esa tor bosma sahifada \`items-end\` bilan pastga
     tushar va chek varaqning eng pastida, kichkina bo'lib chiqardi
     (Proton School, 2026-09-21).

     Modal tuzilmasiga bog'lanib qolmaslik uchun chop etiladigan nusxa
     \`body\` ga alohida chiqariladi. Ekranda u KO'RINMAYDI. */
  #chek {
    display: block !important;
    position: absolute; left: 0; top: 0;
    width: 100%; margin: 0; padding: 0;
    box-shadow: none !important; border: none !important;
    background: #fff !important;
  }
  /* QOG'OZNING BUTUN ENI. Ilgari \`width: 80mm\` qat'iy berilardi va
     sahifaga 8 mm chekka qo'shilardi — 58 mm li termal apparatda
     chop etiladigan joy 42 mm ga tushib, rasm o'shanga siqilardi va
     matn yana kichrayardi. \`100%\` + \`max-width\` esa qanday qog'oz
     bo'lsa, o'shanga to'liq yoyiladi.
     CHEKKA 0: chekning o'z ichki hoshiyasi bor (kanvasdagi \`CHET\`),
     termal apparat esa o'z chetini o'zi qo'yadi. */
  #chek img { width: 100% !important; max-width: 80mm !important; height: auto !important; }
  .chek-yashir { display: none !important; }
  @page { margin: 0; }
}`;

type Holat = "" | "pdf" | "rasm" | "jonat";

export function ReceiptModal({
  paymentId, open, onClose,
}: {
  paymentId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useSWR<ReceiptData>(
    open && paymentId ? `/api/payments/${paymentId}/receipt` : null, fetcher);

  /**
   * Chizilgan chek QAYSI to'lovniki ekani bilan birga saqlanadi.
   * Faqat `setRasm("")` qilib qo'ysak, ikkita narsa buziladi: effekt
   * ichida sinxron holat o'zgarishi (keraksiz qayta chizish) va bir
   * zumlik "eski chek" — yangi to'lov ochilganda avvalgisining rasmi
   * ko'rinib turardi.
   */
  const [chizilgan, setChizilgan] = useState<{ id: string; src: string } | null>(null);
  const rasm = chizilgan && chizilgan.id === paymentId ? chizilgan.src : "";
  const [band, setBand] = useState<Holat>("");
  const [bajarildi, setBajarildi] = useState<Holat>("");
  const [xato, setXato] = useState("");
  const kanvas = useRef<HTMLCanvasElement | null>(null);

  // Ma'lumot kelgach chekni chizamiz. QR chiqmasa ham chek ishlayveradi —
  // kod matni baribir chekda qoladi.
  useEffect(() => {
    let bekor = false;
    if (!data || !paymentId) return;
    (async () => {
      const qr = data.code
        ? await QRCode.toDataURL(data.code, { margin: 0, width: 240 }).catch(() => undefined)
        : undefined;
      const c = await drawReceipt(data, qr);
      if (bekor) return;
      kanvas.current = c;
      setChizilgan({ id: paymentId, src: c.toDataURL("image/png") });
    })().catch(() => { if (!bekor) setXato("Chek chizilmadi"); });
    return () => { bekor = true; };
  }, [data, paymentId]);

  function nishon(h: Holat) {
    setBajarildi(h);
    setTimeout(() => setBajarildi(""), 1800);
  }

  const nomAsosi = data
    ? `chek-${(data.code ?? data.receiptLabel ?? "").replace(/[^A-Za-z0-9-]/g, "") || "tolov"}`
    : "chek";

  async function pdfYukla() {
    if (!kanvas.current) return;
    setBand("pdf"); setXato("");
    try {
      saqla(await receiptPdf(kanvas.current), `${nomAsosi}.pdf`);
      nishon("pdf");
    } catch { setXato("PDF yasalmadi"); }
    finally { setBand(""); }
  }

  async function rasmYukla() {
    if (!kanvas.current) return;
    setBand("rasm"); setXato("");
    try {
      saqla(await canvasBlob(kanvas.current), `${nomAsosi}.png`);
      nishon("rasm");
    } catch { setXato("Rasm yasalmadi"); }
    finally { setBand(""); }
  }

  /**
   * JO'NATISH — telefonda Telegram/WhatsApp ochiladi.
   *
   * RASM jo'natiladi, PDF emas: Telegramda rasm suhbatda darhol
   * ko'rinadi, PDF esa ochib ko'rish kerak bo'lgan fayl bo'lib tushadi.
   * Ota-ona uchun birinchisi ancha qulay.
   *
   * Kompyuterda ulashish oynasi ko'pincha yo'q — o'shanda jimgina
   * rasmni yuklab beramiz, "ishlamadi" deyish o'rniga.
   */
  async function jonat() {
    if (!kanvas.current) return;
    setBand("jonat"); setXato("");
    try {
      const blob = await canvasBlob(kanvas.current);
      const fayl = new File([blob], `${nomAsosi}.png`, { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
        share?: (d: ShareData) => Promise<void>;
      };
      if (nav.share && nav.canShare?.({ files: [fayl] })) {
        await nav.share({ files: [fayl], title: "To'lov cheki" });
        nishon("jonat");
      } else {
        saqla(blob, `${nomAsosi}.png`);
        nishon("rasm");
      }
    } catch (e) {
      // Foydalanuvchi ulashishni bekor qilsa — bu xato emas.
      if ((e as { name?: string })?.name !== "AbortError") setXato("Jo'natilmadi");
    } finally { setBand(""); }
  }

  // `ModalOverlay` ochilish/yopilish animatsiyasini o'zi boshqaradi va
  // yopiq holatda hech nima chizmaydi — shuning uchun bu yerda erta
  // `return null` KERAK EMAS. Aksincha, u animatsiyani yo'q qilardi.
  return (
    <>
      {/*
        FAQAT OCHIQ TURGANDA. `PRINT_CSS` ichida
        `body * { visibility: hidden }` bor va uni `#chek` qaytarib
        ko'rsatadi. Agar bu uslub oyna yopiq turganda ham sahifada
        qolsa, `#chek` mavjud bo'lmaydi va foydalanuvchi ISTALGAN
        sahifani chop etganda OQ VARAQ chiqardi.

        Ilgari butun komponent `if (!open) return null` bilan
        chizilmasdi, ya'ni bu o'z-o'zidan hal bo'lardi; endi oynani
        `ModalOverlay` boshqaradi va shart shu yerga ko'chdi.
      */}
      {open && <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />}

      {/*
        UMUMIY `ModalOverlay` — ilgari bu oyna O'ZI yozilgan
        `fixed inset-0` edi va ikki narsa buzilardi:

        1. MARKAZDA OCHILMASDI. `fixed` ota elementda `transform`,
           `filter` yoki `backdrop-filter` bo'lsa EKRANGA emas, o'sha
           ota elementga nisbatan joylashadi. Ilovada `glass-panel`,
           `glass-strong` va shadcn `Card` larning hammasida
           `backdrop-filter: blur()` bor — ya'ni chek qaysi joydan
           ochilishiga qarab ekranning tepasiga tushib qolardi
           (egasi xabar berdi, 2026-09-19). `ModalOverlay` esa
           `document.body` ga PORTAL qiladi va ota elementlar unga
           umuman ta'sir qilmaydi.

        2. QATLAM PAST EDI. Bu oyna `z-50` da, boshqa oynalar esa
           `z-[100]` da turadi — to'lov oynasidan chek ochilganda u
           ortda qolardi. Mobil pastki menyu (`z-[60]`) ham chekning
           ustiga chiqardi.

        Yon foyda: telefonda pastdan ko'tariladigan varaq, tananing
        orqa fondagi aylanishini to'xtatish va animatsiya — hammasi
        boshqa oynalar bilan bir xil.
      */}
      <ModalOverlay open={open} onClose={onClose} panelClassName="sm:max-w-[420px]">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full
          flex flex-col max-h-full min-h-0 overflow-hidden">

          <div className="chek-yashir flex items-center justify-between px-4 py-3 shrink-0
            border-b border-neutral-200 dark:border-white/10">
            <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
              To&apos;lov cheki
            </p>
            <button onClick={onClose} aria-label="Yopish"
              className="w-7 h-7 flex items-center justify-center rounded-lg
                text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-neutral-100 dark:bg-neutral-950 p-4">
            {(isLoading || (!rasm && !xato && !error)) && (
              <div className="py-16 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                <p className="text-[12px] text-neutral-400">Chek tayyorlanmoqda...</p>
              </div>
            )}

            {error && (
              <p className="py-16 text-center text-[12.5px] text-red-600 dark:text-red-400">
                Chek ochilmadi
              </p>
            )}

            {/* Chek O'RTADA, oq qog'oz ko'rinishida — qorong'i rejimda ham
                oq qoladi, chunki bosib chiqarilganda shunday chiqadi. */}
            {/* EKRANDAGI nusxa — `id` YO'Q. Chop etiladigan nusxa
                alohida, `body` ga chiqariladi (pastda). */}
            {rasm && (
              <div className="mx-auto w-full max-w-[340px] bg-white rounded-xl
                shadow-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rasm} alt="To'lov cheki" className="w-full block" />
              </div>
            )}
          </div>

          {rasm && (
            <div className="chek-yashir px-4 py-3 shrink-0 border-t border-neutral-200
              dark:border-white/10 space-y-2">
              {xato && (
                <p className="text-[11.5px] font-medium text-red-600 dark:text-red-400 text-center">
                  {xato}
                </p>
              )}

              <button onClick={() => window.print()}
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white
                  text-[13px] font-semibold flex items-center justify-center gap-1.5
                  transition-colors">
                <Printer className="w-4 h-4" />
                Chop etish
              </button>

              <div className="grid grid-cols-3 gap-2">
                <Amal icon={FileText} label="PDF" band={band === "pdf"}
                  bajarildi={bajarildi === "pdf"} onClick={pdfYukla} />
                <Amal icon={Download} label="Rasm" band={band === "rasm"}
                  bajarildi={bajarildi === "rasm"} onClick={rasmYukla} />
                <Amal icon={Share2} label="Jo'natish" band={band === "jonat"}
                  bajarildi={bajarildi === "jonat"} onClick={jonat} />
              </div>
            </div>
          )}
        </div>
      </ModalOverlay>

      {/* CHOP ETILADIGAN NUSXA — `body` ga, modaldan TASHQARIDA.
          Ekranda `hidden`, bosmada `#chek` qoidasi uni ochadi. */}
      {open && rasm && typeof document !== "undefined" && createPortal(
        <div id="chek" className="hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rasm} alt="To'lov cheki" className="w-full block" />
        </div>,
        document.body,
      )}
    </>
  );
}

function Amal({
  icon: Icon, label, band, bajarildi, onClick,
}: {
  icon: typeof Download;
  label: string;
  band: boolean;
  bajarildi: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={band}
      className={cn(
        "h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5",
        "border transition-colors disabled:opacity-60",
        bajarildi
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
          : "border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5",
      )}>
      {band
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : bajarildi
          ? <Check className="w-3.5 h-3.5" />
          : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
