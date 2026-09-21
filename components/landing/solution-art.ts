/**
 * Klaster sahifalarning 3D rasmlari (`public/landing/solutions/*-transparent.png`).
 * Bosh sahifadagi "Yechimlar" kartalari bilan bir xil rasmlar; kalit — sahifa manzili.
 */
const ART_BY_HREF: Record<string, string> = {
  "/oquv-markaz-crm": "crm",
  "/davomat": "attendance",
  "/tolovlar": "payments",
  "/qarzdorlik": "debt",
  "/hisobot": "reports",
  "/oqituvchi-oyligi": "salary",
  "/guruh-boshqaruvi": "groups",
  "/dars-jadvali": "schedule",
  "/telegram-bot": "telegram",
  "/oquv-markazini-avtomatlashtirish": "automation",
};

export function solutionArt(href: string): string | undefined {
  const name = ART_BY_HREF[href];
  return name ? `/landing/solutions/${name}-transparent.png` : undefined;
}
