"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";
import { CLUSTER_PAGES } from "@/lib/seo/cluster-pages";

// `/#features` (bosh sahifaga yo'naltirib, keyin scroll qiladi) — shunda
// bu havolalar cluster landinglardan ham ishlaydi, faqat bosh sahifadan emas.
const navLinks = [
  { label: "Imkoniyatlar", href: "/#features" },
  { label: "Qanday ishlaydi", href: "/#how-it-works" },
  { label: "Narxlar", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Bog'lanish", href: "/#contact" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="OneRoom bosh sahifa"
          >
            <Image
              src="/logo.png"
              alt="OneRoom logo"
              width={34}
              height={34}
              priority
              className="rounded-lg"
            />
            <span className="text-[1.0625rem] font-bold text-slate-900">
              One<span className="text-blue-600">Room</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Asosiy menyu"
          >
            {/* Yechimlar — dropdown, cluster landinglarga ichki havolalar */}
            <div
              className="relative"
              onMouseEnter={() => setSolutionsOpen(true)}
              onMouseLeave={() => setSolutionsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setSolutionsOpen((v) => !v)}
                aria-expanded={solutionsOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Yechimlar
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${solutionsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {solutionsOpen && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-80 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/10">
                    {CLUSTER_PAGES.map((p) => (
                      <Link
                        key={p.href}
                        href={p.href}
                        onClick={() => setSolutionsOpen(false)}
                        className="block rounded-xl px-3.5 py-2.5 transition-colors hover:bg-slate-50"
                      >
                        <span className="block text-sm font-semibold text-slate-900">{p.navLabel}</span>
                        <span className="block text-xs text-slate-500">{p.blurb}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Kirish
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Bepul boshlash
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-lg"
        >
          <nav className="flex flex-col gap-0.5" aria-label="Mobil menyu">
            <p className="px-3 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Yechimlar
            </p>
            {CLUSTER_PAGES.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                {p.navLabel}
              </Link>
            ))}
            <div className="my-2 border-t border-slate-100" />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 pt-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Kirish
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Bepul boshlash
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
