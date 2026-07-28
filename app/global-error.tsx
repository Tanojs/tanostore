"use client";

// Khusus menangkap error yang terjadi di app/layout.tsx sendiri (kasus langka,
// tapi kalau terjadi dan file ini tidak ada, user cuma lihat halaman putih
// kosong). Karena root layout ikut error, file ini harus render <html>/<body>
// sendiri dan pakai inline style (tidak bisa mengandalkan globals.css yang
// mungkin gagal dimuat bersamaan dengan layout yang error).
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, background: "#0c0c1e", color: "#fafafa", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              maxWidth: 384,
              width: "100%",
              textAlign: "center",
              background: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 24,
              padding: 32,
            }}
          >
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Terjadi kesalahan fatal</h1>
            <p style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
              Aplikasi mengalami masalah serius saat memuat. Coba muat ulang halaman.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 24,
                width: "100%",
                background: "#6C3CE1",
                color: "#fff",
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
