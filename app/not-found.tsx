import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

// Otomatis ditampilkan Next.js untuk route yang tidak ketemu, atau saat kode
// manapun memanggil notFound() dari "next/navigation".
export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full mx-auto bg-card border border-border rounded-3xl shadow-lg p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
          <SearchX className="size-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari mungkin sudah dipindah, dihapus, atau memang tidak pernah ada.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  );
}
