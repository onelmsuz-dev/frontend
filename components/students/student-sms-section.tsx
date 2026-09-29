"use client";

import useSWR from "swr";
import { MessageSquare, User, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { fmtRelative } from "@/lib/date-uz";

interface SmsRecord {
  id: string;
  text: string;
  recipient: "OQUVCHI" | "OTA_ONA";
  status: "YUBORILDI" | "XATOLIK";
  sentAt: string;
}

const RECIPIENT_LABEL: Record<string, { label: string; icon: typeof User }> = {
  OQUVCHI: { label: "O'quvchi", icon: User },
  OTA_ONA: { label: "Ota-ona", icon: UsersIcon },
};

/** SMS TARIXI — shu o'quvchi va ota-onasiga yuborilgan xabarlar (davomat, to'lov eslatmalari va h.k.). */
export function StudentSmsSection({ studentId }: { studentId: string }) {
  const { data, isLoading } = useSWR<SmsRecord[]>(`/api/students/${studentId}/sms`, fetcher);
  const items = Array.isArray(data) ? data : [];

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-neutral-400" />
        <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">SMS tarixi</h3>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3">
          {[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-[12px] text-neutral-400 p-5 text-center">Hali SMS yuborilmagan</p>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {items.map(s => {
            const r = RECIPIENT_LABEL[s.recipient] ?? RECIPIENT_LABEL.OQUVCHI;
            const Icon = r.icon;
            return (
              <li key={s.id} className="flex gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">{r.label}</span>
                    <time className="shrink-0 text-[10.5px] text-neutral-400">{fmtRelative(s.sentAt)}</time>
                  </div>
                  <p className="text-[12.5px] text-neutral-700 dark:text-neutral-200 mt-0.5 leading-snug">{s.text}</p>
                  <span className={cn("inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-md font-semibold",
                    s.status === "YUBORILDI"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                    {s.status === "YUBORILDI" ? "Yuborildi" : "Xatolik"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
