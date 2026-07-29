"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

// Penanda pemisah antar akun. HARUS SAMA PERSIS dengan yang dipakai di
// function fulfill_order() pada supabase/schema.sql (lihat migrasi
// fix-multi-item-separator.sql).
const DELIMITER = "===AKUN===";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard API gagal (browser lama / tanpa izin) -> diamkan saja,
          // bukan error yang perlu ditampilkan ke user.
        }
      }}
      className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

// Menampilkan account_data dari tabel orders. Kalau order-nya beli lebih dari
// 1 pcs (data lebih dari 1 blok dipisah DELIMITER), tiap akun ditampilkan
// sebagai kartu terpisah dengan nomor urut -- supaya nggak nempel/membingungkan
// seperti sebelumnya.
export function AccountDataDisplay({ data }: { data: string | null }) {
  if (!data) {
    return <p className="text-sm text-muted-foreground italic">Data sedang disiapkan...</p>;
  }

  const blocks = data
    .split(DELIMITER)
    .map((b) => b.trim())
    .filter(Boolean);

  // Cuma 1 blok (beli 1 pcs, produk tipe file, atau pesan info seperti "stok
  // kosong") -> tampilkan apa adanya tanpa penomoran.
  if (blocks.length <= 1) {
    return (
      <div className="p-3 bg-muted rounded-xl border border-border">
        <div className="flex items-start justify-between gap-3">
          <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">{data}</pre>
          <CopyButton text={data} />
        </div>
      </div>
    );
  }

  // Lebih dari 1 blok (beli beberapa pcs sekaligus) -> ditampilkan sebagai
  // list bernomor (1. 2. 3. dst) dengan jarak & garis pembatas tipis antar
  // akun, biar jelas kelihatan mana batas akun satu ke akun berikutnya.
  return (
    <div className="p-3 bg-muted rounded-xl border border-border">
      {blocks.map((block, i) => (
        <div
          key={i}
          className={`flex items-start justify-between gap-3 ${i > 0 ? "mt-3 pt-3 border-t border-border/60" : ""}`}
        >
          <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
            <span className="font-sans font-bold text-purple-600 dark:text-purple-400">{i + 1}. </span>
            {block}
          </pre>
          <CopyButton text={block} />
        </div>
      ))}
    </div>
  );
}
