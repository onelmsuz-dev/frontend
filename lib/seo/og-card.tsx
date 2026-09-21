import { ImageResponse } from "next/og";

/**
 * Ijtimoiy tarmoq (OG / Twitter) rasmi — barcha tillar uchun umumiy; farqi faqat shior matni.
 * O'zbekcha (`app/opengraph-image.tsx`) — asosiy; ruscha/inglizcha — `app/[locale]/opengraph-image.tsx`.
 */
export const OG_SIZE = { width: 1200, height: 630 };

export function renderOgCard(tagline: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #eef2ff 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 84,
              height: 84,
              borderRadius: 20,
              background: "#2563eb",
              color: "#fff",
              fontSize: 48,
              fontWeight: 800,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            O
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color: "#0f172a" }}>
            One<span style={{ color: "#2563eb" }}>Room</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 32,
            fontWeight: 600,
            color: "#475569",
            textAlign: "center",
            maxWidth: 860,
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
