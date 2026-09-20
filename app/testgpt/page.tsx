import type { Metadata } from "next";
import HeroLab from "./hero-lab";
export const metadata: Metadata = { title: "OneRoom — Kamroq ish. Ko‘proq ta’lim.", robots: { index: false, follow: false } };
export default function Page() { return <HeroLab />; }
