"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import {
  TargetPageView, type TargetConfig, type TargetQiymat,
} from "@/components/target/target-page-view";

/**
 * OCHIQ ARIZA SAHIFASI — `markaz.oneroom.uz/target`.
 *
 * Instagram/Facebook target reklamasi shu havolaga olib keladi.
 * Ko'rinishning O'ZI `TargetPageView` da — sozlamalardagi namuna ham
 * AYNAN shu komponentdan chiziladi, ya'ni markaz nimani ko'rib
 * sozlasa, mijoz ham shuni ko'radi.
 *
 * LOGIN YO'Q va panel tartibidan TASHQARIDA: `(dashboard)` guruhiga
 * kirmaydi, ya'ni yon menyu, tarif tekshiruvi va boshqa hech narsa
 * yuklanmaydi. Reklamadan kelgan odam mobil internetda ochadi —
 * sekin yuklansa shunchaki chiqib ketadi.
 *
 * MARKAZ SUBDOMENDAN aniqlanadi. Havolada markaz identifikatori
 * YO'Q — aks holda uni almashtirib boshqa markazga lid yozish
 * mumkin bo'lardi.
 */

function subdomen(): string {
  if (typeof window === "undefined") return "";
  const parts = window.location.hostname.split(".");
  // `demo.oneroom.uz` → ["demo","oneroom","uz"]; `oneroom.uz` → subdomen yo'q
  return parts.length > 2 ? parts[0] : "";
}

interface Javob {
  name: string;
  config: TargetConfig | null;
  courses: { id: string; name: string }[];
}

export default function TargetPage() {
  const [data, setData] = useState<Javob | null>(null);
  const [topilmadi, setTopilmadi] = useState(false);

  useEffect(() => {
    /**
     * Subdomen bo'sh bo'lsa ham SO'ROV YUBORAMIZ: server bo'sh
     * subdomenga 404 qaytaradi va natija bitta yo'ldan — `catch` dan
     * o'tadi. Shu yerda darhol `setTopilmadi` qilish ham mumkin edi,
     * lekin effekt TANASIDA holat o'zgartirish ortiqcha qayta
     * chizishga olib keladi (`react-hooks/set-state-in-effect`).
     */
    fetch(`/api/public/center?subdomain=${encodeURIComponent(subdomen())}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: Javob) => setData(d))
      .catch(() => setTopilmadi(true));
  }, []);

  /** Xato matnini QAYTARADI (yoki `null` — muvaffaqiyat). */
  async function yubor(v: TargetQiymat): Promise<string | null> {
    try {
      const r = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: subdomen(),
          name: v.name.trim(),
          phone: `+998${v.tel}`,
          note: v.note.trim() || undefined,
          courseId: v.courseId || undefined,
          school: v.school.trim() || undefined,
          grade: v.grade.trim() || undefined,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return d?.error ?? "Yuborilmadi — birozdan keyin urinib ko'ring";
      return null;
    } catch {
      return "Internet aloqasi yo'q — qaytadan urinib ko'ring";
    }
  }

  if (topilmadi) {
    return (
      <main className="min-h-dvh grid place-items-center p-6 bg-neutral-50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Image src="/logo.png" alt="OneRoom" width={24} height={24} className="rounded-lg" />
            <span className="text-[13px] font-bold text-neutral-600">
              One<span className="text-indigo-600">Room</span>
            </span>
          </div>
          <AlertCircle className="w-10 h-10 mx-auto text-neutral-300 mb-3" />
          <p className="text-[14px] font-semibold text-neutral-700">Sahifa topilmadi</p>
          <p className="text-[12.5px] text-neutral-500 mt-1">
            Havola to&apos;liq ochilmagan bo&apos;lishi mumkin.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <TargetPageView
        markaz={data?.name ?? null}
        config={data?.config ?? null}
        courses={data?.courses ?? []}
        onSubmit={yubor}
      />
    </main>
  );
}
