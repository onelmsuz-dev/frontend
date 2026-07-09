"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function toDisplay(value: string): string {
  let d = value.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

export default function AdmodeLoginPage() {
  const router = useRouter();
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState("");
  const [isPending, startTransition] = useTransition();

  const isComplete = phone.replace(/\D/g, "").length === 12;

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    setPhone("+998" + digits);
    if (error) setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isComplete) { setError("To'liq telefon raqam kiriting"); return; }
    startTransition(async () => {
      const res = await signIn("credentials", {
        phone,
        password,
        subdomain: "admin",
        redirect: false,
      });
      if (res?.error) {
        setError("Telefon raqam yoki parol noto'g'ri");
      } else {
        router.push("/admode");
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">OneRoom</h1>
          <p className="text-sm text-neutral-500 mt-1">Platform boshqaruv paneli</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-5">
          <div>
            <h2 className="text-[17px] font-bold text-white">Kirish</h2>
            <p className="text-[13px] text-neutral-500 mt-0.5">Platform admin huquqi talab etiladi</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[13px] font-medium text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone field - dark theme */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wide">
                Telefon raqam
              </label>
              <div className={cn(
                "flex h-10 items-center rounded-xl border transition-all overflow-hidden",
                error.includes("telefon")
                  ? "border-red-700 bg-red-950/30"
                  : isComplete
                    ? "border-blue-600 focus-within:border-blue-500"
                    : "border-neutral-700 focus-within:border-neutral-500"
              )}>
                <div className="flex items-center gap-1.5 pl-3 pr-2.5 shrink-0 h-full border-r border-neutral-700">
                  <span className="text-base leading-none">🇺🇿</span>
                  <span className="text-[13px] font-bold text-neutral-500 tracking-tight">+998</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={toDisplay(phone)}
                  onChange={handlePhoneChange}
                  placeholder="90 123 45 67"
                  className="flex-1 px-3 h-full text-[14px] font-medium bg-transparent outline-none tracking-wide text-white placeholder:text-neutral-600 placeholder:font-normal placeholder:tracking-normal"
                />
                {isComplete && !error && (
                  <div className="pr-3 shrink-0">
                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wide">
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pl-9 pr-10 h-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-blue-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full h-10 rounded-xl font-semibold text-[14px] transition-all",
                "bg-blue-600 hover:bg-blue-500 text-white",
                isPending && "opacity-60 cursor-not-allowed"
              )}
            >
              {isPending ? "Kirilmoqda..." : "Kirish"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
