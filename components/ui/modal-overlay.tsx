"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ModalOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
};

const ANIM_MS = 280;

export function ModalOverlay({
  open,
  onClose,
  children,
  panelClassName,
}: ModalOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;

    if (open) {
      setShown(true);
      const frame = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(frame);
    }

    setAnimate(false);
    const timer = window.setTimeout(() => setShown(false), ANIM_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  if (!mounted || !shown) return null;

  return createPortal(
    // `data-onb-modal` — yo'l ko'rsatuvchi turi nishon modal ichida ekanini
    // shundan biladi va spotlight'ni `z-[100]` ustiga ko'taradi.
    <div className="fixed inset-0 z-[100]" role="presentation" data-onb-modal="">
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
          animate ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-0 overflow-y-auto overscroll-contain scroll-smooth">
        <div className="flex min-h-full items-end sm:items-center justify-center p-3 sm:p-6">
          <div
            className={cn(
              "w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md",
              "max-h-[min(92dvh,780px)] flex flex-col",
              "transition-all duration-300 ease-out will-change-transform",
              animate
                ? "opacity-100 translate-y-0 sm:scale-100"
                : "opacity-0 translate-y-8 sm:translate-y-2 sm:scale-95",
              panelClassName,
            )}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
