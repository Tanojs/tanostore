import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TanoPedia - Panel WhatsApp & Script Bot Premium";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Next.js otomatis pakai gambar ini untuk og:image DAN twitter:image (fallback
// bawaan Next.js kalau twitter-image.tsx tidak ada) setiap kali link ke situs
// ini dibagikan ke WhatsApp/Telegram/X/dll.
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c1e",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 16, height: 72, background: "#6C3CE1", borderRadius: 8, display: "flex" }} />
          <div style={{ fontSize: 84, fontWeight: 800, color: "#fafafa", display: "flex" }}>
            TanoPedia
          </div>
        </div>
        <div style={{ fontSize: 32, color: "#a1a1aa", marginTop: 24, display: "flex" }}>
          Panel WhatsApp & Script Bot Premium
        </div>
      </div>
    ),
    { ...size }
  );
}
