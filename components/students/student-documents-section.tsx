"use client";

import { useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { FileText, Upload, Download, Trash2, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { formatUzDate } from "@/lib/date-uz";
import { compressImage, readAsDataUrl, UPLOAD_MAX_BYTES } from "@/lib/image-compress";

/** Ro'yxatdagi fayl — MAZMUNSIZ (mazmun yuklab olishda alohida so'raladi). */
interface Doc {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

const KEY = (studentId: string) => `/api/students/${studentId}/documents`;

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function docIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type === "application/pdf") return FileText;
  return FileIcon;
}

/** Rasm nomi JPEG'ga aylangach kengaytmasi ham mos bo'lsin. */
function jpgNomi(name: string): string {
  return /\.(jpe?g)$/i.test(name) ? name : `${name.replace(/\.[^.]+$/, "")}.jpg`;
}

/**
 * FAYLLAR — shartnoma, pasport nusxasi va h.k. Fayl bazaga base64 bo'lib
 * yoziladi (alohida fayl-saqlash xizmati yo'q). So'rov Vercel proksisidan
 * o'tadi va u 4.5 MB dan kattasini o'tkazmaydi — shuning uchun rasm
 * yuborishdan oldin kichraytiriladi, boshqa fayl 3 MB bilan cheklanadi,
 * ro'yxat esa mazmunsiz keladi (`lib/image-compress.ts`).
 */
export function StudentDocumentsSection({ studentId, canUpload }: { studentId: string; canUpload: boolean }) {
  const { data, isLoading } = useSWR<Doc[]>(KEY(studentId), fetcher);
  const items = Array.isArray(data) ? data : [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setErr(""); setUploading(true);
    try {
      // Rasm — kichraytiriladi (pasport nusxasi o'qiladigan bo'lib qoladi).
      const siqilgan = await compressImage(file, { maxSide: 1800, quality: 0.85 });
      const payload = siqilgan
        ? { name: jpgNomi(file.name), type: siqilgan.type, size: siqilgan.size, dataUrl: siqilgan.dataUrl }
        : file.size > UPLOAD_MAX_BYTES
          ? null
          : { name: file.name, type: file.type, size: file.size, dataUrl: await readAsDataUrl(file) };
      if (!payload) { setErr("Fayl 3 MB dan katta bo'lmasligi kerak (rasmlar o'zi kichraytiriladi)"); return; }

      const res = await fetch(KEY(studentId), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(res.status === 413 ? "Fayl juda katta" : d?.error ?? "Yuklab bo'lmadi");
        return;
      }
      mutate(KEY(studentId));
    } catch { setErr("Yuklab bo'lmadi"); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  /** Mazmun faqat shu yerda so'raladi — ro'yxat javobi yengil qoladi. */
  async function download(d: Doc) {
    setErr("");
    try {
      const res = await fetch(`${KEY(studentId)}/${d.id}`);
      const full = await res.json().catch(() => null);
      if (!res.ok || !full?.dataUrl) { setErr(full?.error ?? "Faylni ochib bo'lmadi"); return; }
      const a = document.createElement("a");
      a.href = full.dataUrl;
      a.download = d.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
  }

  async function remove(docId: string) {
    setErr("");
    try {
      const res = await fetch(`${KEY(studentId)}/${docId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d?.error ?? "O'chirib bo'lmadi");
      }
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    mutate(KEY(studentId));
  }

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-400" />
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Fayllar</h3>
        </div>
        {canUpload && (
          <>
            <input ref={inputRef} type="file" className="hidden"
              onChange={e => handleFiles(e.target.files)} />
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50">
              <Upload className="w-3 h-3" /> {uploading ? "Yuklanmoqda..." : "Fayl yuklash"}
            </button>
          </>
        )}
      </div>

      {err && <p className="text-[11px] text-red-500 px-5 pt-2">{err}</p>}

      {isLoading ? (
        <div className="p-5 space-y-2">
          {[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-[12px] text-neutral-400 p-5 text-center">Hali fayl yuklanmagan</p>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {items.map(d => {
            const Icon = docIcon(d.type);
            return (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">{d.name}</p>
                  <p className="text-[11px] text-neutral-400">
                    {fmtSize(d.size)} · {formatUzDate(d.uploadedAt)} · {d.uploadedBy}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => download(d)} title="Yuklab olish"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400
                      hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {canUpload && (
                    <button onClick={() => remove(d.id)} title="O'chirish"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400
                        hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
