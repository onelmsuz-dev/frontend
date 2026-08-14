"use client";

import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import { useStudentProfile } from "@/lib/hooks/usePanel";
import { LogOut } from "lucide-react";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  // Sahifadagi bilan bir xil SWR kaliti — qo'shimcha so'rov ketmaydi.
  const { data: profile } = useStudentProfile();

  /**
   * DIQQAT: `session.user.name` bo'sh SATR bo'lishi mumkin (`??` bo'sh satrni
   * o'tkazib yuboradi), shunda avatarda hech narsa chiqmay, `?? "U"` zaxirasi
   * ishlab qolardi. Shu sabab `||` ishlatiladi va asosiy manba — profil API,
   * chunki u har doim o'quvchining haqiqiy ismini qaytaradi.
   */
  const name = (profile?.name || session?.user?.name || "").trim();
  const initial = name[0]?.toUpperCase() ?? "•";

  return (
    <div className="min-h-screen glass-soft">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-white/60 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-[14px]">O</span>
            </div>
            <span className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100">OneRoom</span>
          </div>
          <div className="flex items-center gap-2">
            <FullscreenToggle />
            <ThemeToggle />
            <div className="flex items-center gap-2 pl-1">
              {name && (
                <span className="hidden sm:block max-w-[160px] truncate text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">
                  {name}
                </span>
              )}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                {initial}
              </div>
            </div>
            <button
              onClick={async () => {
                const loginUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/login";
                await signOut({ redirect: false });
                window.location.href = loginUrl;
              }}
              title="Chiqish"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
