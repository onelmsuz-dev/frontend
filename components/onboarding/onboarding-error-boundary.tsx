"use client";

import { Component, type ReactNode } from "react";

/**
 * Onboarding UI butun dashboardni yiqitmasligi kafolati.
 *
 * Onboarding `(dashboard)` layoutida yashaydi — ya'ni undagi bitta `TypeError`
 * HAR BIR sahifani oq ekranga aylantirardi. Bayroq bu xatardan himoya
 * qilmaydi (kod baribir daraxtda), shuning uchun chegara SHART.
 *
 * DIQQAT: xato bo'lganda `fallback` chiziladi, `children` EMAS. Aks holda
 * yiqilgan komponent qayta chizilib, cheksiz sikl hosil bo'lardi.
 */
export class OnboardingErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[onboarding]", error);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
