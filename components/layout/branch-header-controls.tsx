"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown, Plus, Check } from "lucide-react";
import { mutate } from "swr";
import { useBranch } from "@/lib/contexts/branch-context";
import { AcceptPaymentModal } from "@/components/finance/accept-payment-modal";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function BranchHeaderControls() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canManage = role === "SUPER_ADMIN";

  const {
    branches,
    activeBranchId,
    activeBranch,
    isLoading,
    setActiveBranchId,
    refreshBranches,
  } = useBranch();

  const [showAdd, setShowAdd] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAddBranch() {
    if (!name.trim()) { setError("Filial nomi majburiy"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xatolik"); return; }
      refreshBranches();
      void mutate("/api/branches");
      setActiveBranchId(data.id);
      setName("");
      setShowAdd(false);
    } catch {
      setError("Serverga ulanib bo'lmadi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPay(true)}
        className="inline-flex items-center h-9 px-3 sm:px-4 rounded-lg bg-[#5B6FD6] hover:bg-[#4d60c4] text-white text-[11px] sm:text-[12px] font-bold tracking-wide transition-colors shrink-0"
      >
        TO&apos;LOV
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-1 h-9 px-2 sm:px-3 rounded-lg",
            "text-[13px] font-medium text-neutral-700 dark:text-neutral-200",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors outline-none",
          )}
        >
          <span className="max-w-[120px] sm:max-w-[160px] truncate">
            {isLoading ? "..." : activeBranch?.name ?? "Filial tanlang"}
          </span>
          <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[200px]">
          {branches.length === 0 && !isLoading && (
            <DropdownMenuItem disabled className="text-neutral-400">
              Filial yo&apos;q
            </DropdownMenuItem>
          )}
          {branches.map(b => (
            <DropdownMenuItem
              key={b.id}
              onClick={() => setActiveBranchId(b.id)}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate">{b.name}</span>
              {b.id === activeBranchId && (
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          {canManage && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => { setShowAdd(true); setError(""); }}
                className="text-blue-600 dark:text-blue-400 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Filial qo&apos;shish
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AcceptPaymentModal open={showPay} onClose={() => setShowPay(false)} />

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Yangi filial"
        subtitle="Filial nomini kiriting"
        size="sm"
        footer={
          <>
            <Button className="flex-1 sm:flex-none" onClick={handleAddBranch} disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setShowAdd(false)} disabled={saving}>
              Bekor
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Masalan: Nur filiali"
            onKeyDown={e => e.key === "Enter" && handleAddBranch()}
          />
          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>
      </Modal>
    </>
  );
}
