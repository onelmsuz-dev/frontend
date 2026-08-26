import type { Metadata } from "next";

// `/login` sahifasi client komponent bo'lgani uchun o'zi metadata eksport
// qila olmaydi — shu sabab qobiq layout kerak. Qidiruvda chiqmasligi kerak:
// bu autentifikatsiya ekrani, landing emas.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
