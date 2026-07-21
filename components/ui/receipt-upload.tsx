"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;                 // base64 data-URL
  onChange: (dataUrl: string) => void;
  className?: string;
}

const MAX_SIDE = 1100;           // px — rasm shu o'lchamgacha kichraytiriladi
const QUALITY = 0.72;            // JPEG sifati

/** Faylni siqib, base64 data-URL ga aylantiradi (canvas orqali). */
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Fayl o'qilmadi"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasm yuklanmadi"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_SIDE) { height = Math.round(height * MAX_SIDE / width); width = MAX_SIDE; }
        else if (height > MAX_SIDE) { width = Math.round(width * MAX_SIDE / height); height = MAX_SIDE; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas xato"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** To'lov chekini rasm sifatida yuklash (havola emas). */
export function ReceiptUpload({ value, onChange, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Faqat rasm fayli"); return; }
    setLoading(true); setErr("");
    try {
      onChange(await fileToCompressedDataUrl(file));
    } catch (e: any) {
      setErr(e?.message ?? "Rasmni qayta ishlab bo'lmadi");
    } finally { setLoading(false); }
  }

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Chek" className="w-full max-h-56 object-contain bg-neutral-50 dark:bg-neutral-800" />
          <button type="button" onClick={() => { onChange(""); setErr(""); }}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}
          className="w-full h-28 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
          {loading
            ? <Loader2 className="w-6 h-6 animate-spin" />
            : <><Upload className="w-6 h-6" /><span className="text-[12px] font-medium">Chek rasmini yuklang</span><span className="text-[10px] text-neutral-400 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> JPG / PNG</span></>}
        </button>
      )}
      {err && <p className="text-[11px] text-red-500 mt-1">{err}</p>}
    </div>
  );
}
