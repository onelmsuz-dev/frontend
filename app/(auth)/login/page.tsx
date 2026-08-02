"use client";

import { useState, useTransition, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

function getSubdomain(): string {
  if (typeof window === "undefined") return "";
  const host  = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "";
  const parts = host.split(".");
  // markaz.oneroom.uz → parts = ["markaz","oneroom","uz"] → parts[0]
  // oneroom.uz → parts = ["oneroom","uz"] → no subdomain
  return parts.length >= 3 ? parts[0] : "";
}

function LoginForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 12) { setError("To'liq telefon raqam kiriting"); return; }
    if (!password) { setError("Parol kiriting"); return; }

    const subdomain = getSubdomain();

    startTransition(async () => {
      const res = await signIn("credentials", {
        phone, password, subdomain, redirect: false,
      });
      if (res?.error) {
        setError("Telefon raqam yoki parol noto'g'ri");
      } else {
        // Rolga qarab yo'naltirish: o'quvchi → /panel, boshqalar → callbackUrl
        let dest = callbackUrl;
        try {
          const s = await fetch("/api/auth/session").then(r => r.json());
          if (s?.user?.role === "STUDENT") dest = "/panel";
        } catch { /* ignore */ }
        window.location.href = dest;
      }
    });
  }

  return (
    <div className="glass-strong border border-white/60 dark:border-white/10 rounded-2xl shadow-xl p-6 space-y-5">
      <div>
        <h2 className="text-[17px] font-bold text-neutral-900 dark:text-neutral-100">Kirish</h2>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">
          Telefon raqam va parolingizni kiriting
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-[13px] font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Telefon raqam
          </label>
          <PhoneInput
            value={phone}
            onChange={v => { setPhone(v); setError(""); }}
            error={!!error && error.includes("telefon")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Parol
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <Input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              required
              className="pl-9 pr-10 h-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label={showPass ? "Parolni yashirish" : "Parolni ko'rsatish"}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "w-full h-10 rounded-xl font-semibold text-[14px] transition-all",
            "bg-indigo-600 hover:bg-indigo-700 shadow-sm",
            "text-white",
            isPending && "opacity-60 cursor-not-allowed"
          )}
        >
          {isPending ? "Kirilmoqda..." : "Kirish"}
        </button>
      </form>

      <p className="text-center text-[12px] text-neutral-400 dark:text-neutral-500">
        Parolingizni unutdingizmi?{" "}
        <a href="https://t.me/oneroomuz" target="_blank" rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-medium">
          Telegram orqali bog'laning
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Same split backdrop as the app shell */}
      <div className="app-bg-base fixed inset-0 -z-20" />
      <div className="app-bg-split fixed inset-0 -z-10" />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-3 shadow-lg">
            <Image src="/logo.png" alt="OneRoom" width={56} height={56} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">OneRoom</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Smart O'quv Markaz Tizimi</p>
        </div>
        <Suspense fallback={
          <div className="glass-strong border border-white/60 dark:border-white/10 rounded-2xl shadow-xl p-6 h-64 animate-pulse" />
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
