"use client";

import { createContext, useContext } from "react";
import type { OnboardingStep } from "@/lib/onboarding/steps";

export interface TourState {
  stepKey: string;
  stopIdx: number;
  /** `Esc` bosilganda tur o'chmaydi — pauza qiladi. */
  paused: boolean;
}

export interface OnboardingCtxValue {
  /** Bayroq yoqilgan va foydalanuvchi mos rolda. */
  enabled: boolean;
  loading: boolean;
  /** Panel dashboardda ko'rsatilsinmi. */
  visible: boolean;
  /** Markazning sozlash holati — `DONE` bo'lsa panel boshqa qaytmaydi. */
  status: "ACTIVE" | "DISMISSED" | "DONE";
  /** Rol bo'yicha filtrlangan qadamlar. */
  steps: OnboardingStep[];
  doneMap: Record<string, boolean>;
  skipped: string[];
  requiredTotal: number;
  requiredDone: number;
  /** Keyingi bajarilishi kerak bo'lgan qadam (bloklanmagan, o'tkazilmagan). */
  nextStep: OnboardingStep | null;
  /** Barcha majburiy qadamlar bajarilgan, lekin tabrik hali ko'rsatilmagan. */
  celebrating: boolean;

  tour: TourState | null;
  startTour: (stepKey: string) => void;
  stopTour: () => void;
  /** `Esc` bilan pauza qilingan turni davom ettiradi. */
  resumeTour: () => void;

  hide: () => void;
  resume: () => void;
  toggleSkip: (key: string, on: boolean) => void;
  celebrate: () => void;
  refresh: () => void;
}

/**
 * Bayroq o'chiq bo'lganda ishlatiladigan HARAKATSIZ qiymat.
 *
 * Modul darajasidagi doimiy — har renderda yangi obyekt yaratilsa, kontekstga
 * ulangan har bir komponent keraksiz qayta chizilardi.
 */
export const INERT_ONBOARDING: OnboardingCtxValue = {
  enabled: false,
  loading: false,
  visible: false,
  status: "DONE",
  steps: [],
  doneMap: {},
  skipped: [],
  requiredTotal: 0,
  requiredDone: 0,
  nextStep: null,
  celebrating: false,
  tour: null,
  startTour: () => {},
  stopTour: () => {},
  resumeTour: () => {},
  hide: () => {},
  resume: () => {},
  toggleSkip: () => {},
  celebrate: () => {},
  refresh: () => {},
};

export const OnboardingCtx = createContext<OnboardingCtxValue>(INERT_ONBOARDING);

/** Onboarding holati. Bayroq o'chiq bo'lsa — barcha maydonlar bo'sh/noop. */
export function useOnboardingCtx(): OnboardingCtxValue {
  return useContext(OnboardingCtx);
}
