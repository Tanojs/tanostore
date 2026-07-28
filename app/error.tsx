"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error boundary bawaan Next.js — otomatis membungkus semua halaman di bawah
// app/ (kecuali error yang terjadi di root layout.tsx sendiri, itu ditangani
// oleh global-error.tsx). Wajib Client Component.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: kalau nanti pasang tool monitoring error (mis. Sentry), kirim ke sana di sini.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full mx-auto bg-card border border-border rounded-3xl shadow-lg p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
          <ServerCrash className="size-7 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ada masalah saat memuat halaman ini. Coba muat ulang, atau kembali ke beranda kalau masih gagal.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            Coba Lagi
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
