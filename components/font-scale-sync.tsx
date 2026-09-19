"use client";

import { useEffect } from "react";
import { useMe } from "@/lib/hooks/useMe";
import { applyFontScale, type FontScale } from "@/lib/font-scale";

/**
 * Markaz tanlagan shriftni serverdan olib `<html>` ga qo'yadi.
 *
 * NEGA `layout.tsx` dagi inline skript YETARLI EMAS: u `localStorage`
 * dan o'qiydi, ya'ni faqat SHU brauzerda ilgari ochilgan bo'lsa
 * ishlaydi. Boshqa kompyuterdan kirgan xodim markaz sozlamasini
 * ko'rmasdi. Bu komponent serverdagi haqiqatni olib keladi va
 * `localStorage` ni ham yangilaydi — keyingi ochilishda inline skript
 * to'g'ri qiymatni topadi.
 *
 * Teskarisi ham muhim: admin sozlamani o'zgartirsa, boshqa xodimlarda
 * `/api/me` keyingi yangilanishida o'zi qo'llanadi.
 */
export function FontScaleSync() {
  const { me } = useMe();
  const v = me?.uiFontScale;

  useEffect(() => {
    if (v) applyFontScale(v as FontScale);
  }, [v]);

  return null;
}
