"use client";

import { useRef, useState } from "react";
import { extractNationalDigits, toDisplayPhone, caretForDigits } from "@/lib/phone-format";

/**
 * Ariza formasi mantig'i (holat, tekshiruv, telefon formati, yuborish) — ko'rinishsiz.
 *
 * `apply-form.tsx` (ariza modali, bosh sahifa va klaster sahifalardagi ariza bloki)
 * shu hook'dan foydalanadi: bitta ishonchli mantiq. Yuborish `/api/contact` ga ketadi va Telegram botga
 * tushadi (backend o'zgarmaydi). Backend sxemasida alohida "markaz"/"manba" maydoni yo'q —
 * ular ixtiyoriy `message` ichiga qator bo'lib qo'shiladi va Telegramda "Izoh" ostida ko'rinadi.
 */

/** Backenddagi `CONTACT_TOPICS` kalitlari bilan bir xil. */
export type ContactTopic = "demo" | "narx" | "kochirish" | "hamkorlik" | "boshqa";

const REQUEST_TIMEOUT_MS = 15_000;

interface Options {
  /** Telegramga boradigan xabarda ko'rinadigan manba, masalan "Bosh sahifa › Hero". */
  source: string;
  topic?: ContactTopic;
  /** O'quv markaz nomini majburiy qiladi. */
  askCenter?: boolean;
}

export function useLeadForm({ source, topic: initialTopic = "demo", askCenter = false }: Options) {
  const [name, setName] = useState("");
  const [digits, setDigits] = useState("");
  const [center, setCenter] = useState("");
  const [note, setNote] = useState("");
  const [topic, setTopic] = useState<ContactTopic>(initialTopic);
  // Honeypot — nomi ataylab "website"/"url" emas (brauzer avtoto'ldirishi ularni to'ldirib qo'yadi).
  const [trap, setTrap] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const centerRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const nameOk = name.trim().length >= 2;
  const phoneOk = digits.length === 9;
  const centerOk = !askCenter || center.trim().length >= 2;
  const valid = nameOk && phoneOk && centerOk;

  function onPhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const digitsBefore = el.value.slice(0, caret).replace(/\D/g, "").length;
    const next = extractNationalDigits(el.value);
    setDigits(next);
    requestAnimationFrame(() => {
      const pos = caretForDigits(toDisplayPhone(next), digitsBefore);
      el.setSelectionRange(pos, pos);
    });
  }

  function onPhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace") return;
    const el = e.currentTarget;
    const caret = el.selectionStart ?? 0;
    if (caret === 0 || el.selectionStart !== el.selectionEnd) return;
    if (/\d/.test(el.value[caret - 1])) return;

    e.preventDefault();
    const before = el.value.slice(0, caret).replace(/\D/g, "");
    const kept = before.slice(0, -1) + el.value.slice(caret).replace(/\D/g, "");
    const next = kept.slice(0, 9);
    setDigits(next);
    requestAnimationFrame(() => {
      const pos = caretForDigits(toDisplayPhone(next), Math.max(0, before.length - 1));
      el.setSelectionRange(pos, pos);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    if (!valid) {
      (!nameOk ? nameRef : !phoneOk ? phoneRef : centerRef).current?.focus();
      return;
    }
    if (status === "sending") return;

    setStatus("sending");
    setError("");

    const message =
      (askCenter ? `Markaz: ${center.trim()}\n` : "") +
      `Sahifa: ${source}` +
      (note.trim() ? `\n\n${note.trim()}` : "");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: name.trim(),
          phone: `+998${digits}`,
          topic,
          message,
          ...(trap ? { contact_ref: trap } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Juda ko'p urinish bo'ldi. Bir necha daqiqadan so'ng qayta urining yoki Telegram orqali yozing."
            : (data.error ?? "Ariza yuborilmadi. Birozdan keyin urinib ko'ring."),
        );
        setStatus("idle");
        return;
      }
      setStatus("sent");
      requestAnimationFrame(() => successRef.current?.focus());
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "So'rov juda uzoq davom etdi. Aloqani tekshirib, qayta urining."
          : "Internetga ulanib bo'lmadi. Aloqani tekshirib, qayta urining.",
      );
      setStatus("idle");
    } finally {
      clearTimeout(timer);
    }
  }

  function reset() {
    setName("");
    setDigits("");
    setCenter("");
    setNote("");
    setTopic(initialTopic);
    setTrap("");
    setTouched(false);
    setError("");
    setStatus("idle");
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  return {
    // qiymatlar
    name, setName, digits, center, setCenter, note, setNote, topic, setTopic, trap, setTrap,
    phoneDisplay: toDisplayPhone(digits),
    // holat
    status, error, touched,
    nameOk, phoneOk, centerOk,
    showNameErr: touched && !nameOk,
    showPhoneErr: touched && !phoneOk,
    showCenterErr: touched && !centerOk,
    // ref'lar
    nameRef, phoneRef, centerRef, successRef,
    // amallar
    onPhoneChange, onPhoneKeyDown, submit, reset,
  };
}
