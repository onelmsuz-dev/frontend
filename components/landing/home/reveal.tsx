"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sahifa aylantirilganda elementni yumshoq paydo qiladi (fade + pastdan ko'tarilish).
 * `prefers-reduced-motion` yoqilgan bo'lsa animatsiyasiz darhol ko'rsatadi.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // MUHIM: boshlang'ich holat — KO'RINADIGAN. Ilgari server HTMLida hammasi
  // yashirin (`opacity-0`) chiqardi: JS yuklanmasa yoki sahifa jonlanmasa
  // kontent butunlay ko'rinmay qolardi. Endi faqat sahifa jonlangach va
  // element ekrandan PASTDA bo'lsagina yashiriladi, aylantirilganda paydo bo'ladi.
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Ekranda yoki undan yuqorida turgan element yashirilmaydi (miltillash bo'lmasin).
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setHidden(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        hidden ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      } ${className}`}
    >
      {children}
    </div>
  );
}
