"use client";

import { useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { FileText, Upload, Download, Trash2, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { formatUzDate } from "@/lib/date-uz";

interface Doc {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

const KEY = (studentId: string) => `/api/students/${studentId}/documents`;
const MAX_SIZE = 5 * 1024 * 1024;

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

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * FAYLLAR — shartnoma, pasport nusxasi va h.k. Mock backend fayllarni
 * xotirada data-URL sifatida saqlaydi (haqiqiy disk/bulut yo'q) — faqat
 * dizayn maketi uchun, kichik fayllarga mo'ljallangan.
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
    if (file.size > MAX_SIZE) { setErr("Fayl 5 MB dan katta bo'lmasligi kerak"); return; }
    setErr(""); setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      await fetch(KEY(studentId), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, type: file.type, size: file.size, dataUrl }),
      });
      mutate(KEY(studentId));
    } catch { setErr("Yuklab bo'lmadi"); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function remove(docId: string) {
    await fetch(`${KEY(studentId)}/${docId}`, { method: "DELETE" });
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
                  <a href={d.dataUrl} download={d.name} title="Yuklab olish"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400
                      hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </a>
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
