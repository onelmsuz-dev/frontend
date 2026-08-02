"use client";

import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import { LogOut } from "lucide-react";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Foydalanuvchi";

  return (
    <div className="min-h-screen glass-soft">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-white/60 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-neutral-900 dark:bg-neutral-100 rounded-xl flex items-center justify-center">
              <span className="text-white dark:text-neutral-900 font-black text-[14px]">O</span>
            </div>
            <span className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100">OneRoom</span>
          </div>
          <div className="flex items-center gap-2">
            <FullscreenToggle />
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[12px] font-bold">
              {name[0]?.toUpperCase() ?? "U"}
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
