import { Spinner } from "@/components/ui/spinner";

// File ini otomatis dipakai Next.js sebagai loading UI setiap kali halaman/
// route sedang dimuat (termasuk saat streaming data dari server). Nggak perlu
// diimport manual di manapun.
export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 p-4">
      <Spinner className="size-8 text-primary" />
      <p className="text-sm text-muted-foreground">Memuat...</p>
    </div>
  );
}
