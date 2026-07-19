"use client";

import { useState, useEffect } from "react";
import { Server } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  delivery_type: "account" | "file";
  image_url?: string | null;
  redirect_url?: string | null; // kalau diisi, tombol Beli langsung ke link ini (tanpa checkout)
  stock: number | null; // null = tidak terbatas (produk tipe file)
  created_at: string;
}

// Palet warna badge kategori — dipilih berdasarkan nama kategori supaya
// tetap konsisten tanpa perlu hardcode nama kategori tertentu.
const BADGE_COLORS = [
  "bg-[#6C3CE1]",
  "bg-purple-600",
  "bg-fuchsia-600",
  "bg-indigo-600",
  "bg-violet-600",
];

function getBadgeColor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString("id-ID")}`;
}

export function ProductsSection() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: categoryData }, { data: productData, error }] = await Promise.all([
        supabase.from("categories").select("id, name, slug").order("name"),
        // products_with_stock: view publik yang sudah menghitung stok tanpa
        // membocorkan data akun mentah di tabel product_items.
        supabase.from("products_with_stock").select("*").order("created_at", { ascending: false }),
      ]);

      setCategories(categoryData || []);

      if (error) {
        console.error("Gagal fetch produk:", error);
        setProducts([]);
      } else {
        setProducts(productData || []);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredProducts = products.filter((product) => {
    if (activeCategory === "semua") return true;
    return product.category_id === activeCategory;
  });

  const activeCategoryLabel =
    activeCategory === "semua"
      ? "Semua Layanan"
      : categories.find((c) => c.id === activeCategory)?.name || "Produk";

  if (loading) {
    return (
      <section className="py-8 bg-background text-foreground px-3 sm:px-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#6C3CE1] border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Memuat produk...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-8 bg-background text-foreground px-3 sm:px-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar justify-center">
          <button
            onClick={() => setActiveCategory("semua")}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeCategory === "semua"
                ? "bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] text-white shadow-lg shadow-[#6C3CE1]/30"
                : "bg-card border border-border text-muted-foreground hover:border-[#6C3CE1] hover:text-[#6C3CE1]"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] text-white shadow-lg shadow-[#6C3CE1]/30"
                  : "bg-card border border-border text-muted-foreground hover:border-[#6C3CE1] hover:text-[#6C3CE1]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="mb-4 text-center sm:text-left">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            {activeCategoryLabel} <span className="text-[#6C3CE1]">({filteredProducts.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredProducts.map((product) => {
            // Produk dengan redirect_url dianggap selalu tersedia (langsung ke link luar, bukan checkout).
            // Tipe 'file' = pengiriman via link setelah bayar, dianggap selalu tersedia (stock null).
            const isOutOfStock = !product.redirect_url && product.delivery_type === "account" && (product.stock ?? 0) <= 0;
            const badgeLabel = (product.category_name || "PRODUK").toUpperCase();
            const badgeColor = getBadgeColor(product.category_slug || product.category_name || "default");

            return (
              <div
                key={product.id}
                className={`bg-card border border-border/70 rounded-[24px] p-3 shadow-md transition-all hover:-translate-y-1 duration-300 flex flex-col h-full text-center group ${
                  isOutOfStock ? "opacity-60 grayscale" : "hover:border-[#6C3CE1]/40"
                }`}
              >
                <Link href={`/product/${product.id}`} className="contents">
                  <div className="relative aspect-square w-full bg-zinc-200 dark:bg-zinc-800 rounded-[18px] overflow-hidden shrink-0 flex items-center justify-center mb-3 cursor-pointer">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <Server className="w-10 h-10 text-[#6C3CE1] dark:text-purple-400" />
                    )}

                    <div className="absolute top-2 right-2">
                      <span className={`${badgeColor} text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-[0.5px]`}>
                        {badgeLabel}
                      </span>
                    </div>

                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-[18px]">
                        <span className="text-white font-bold text-xs bg-red-600 px-3 py-1 rounded-full">STOK HABIS</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-2.5 px-1 cursor-pointer">
                    <h3 className="font-bold text-foreground text-sm group-hover:text-[#6C3CE1] transition-colors line-clamp-1 leading-snug">
                      {product.title}
                    </h3>
                    {!product.redirect_url && (
                      <div className="text-[#6C3CE1] dark:text-purple-400 font-extrabold text-sm sm:text-base mt-1.5 border-t border-border/40 pt-1.5">
                        {formatPrice(product.price)}
                      </div>
                    )}
                    {!isOutOfStock && !product.redirect_url && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {product.stock === null ? "Tersedia" : `Stok: ${product.stock}`}
                      </div>
                    )}
                    {product.redirect_url && (
                      <div className="text-[11px] text-muted-foreground mt-1.5 border-t border-border/40 pt-1.5 line-clamp-2 min-h-[2.2em]">
                        {product.description || "Klik untuk lihat detail"}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-col justify-between flex-1 px-1">
                  {isOutOfStock ? (
                    <button
                      disabled
                      className="w-full bg-muted-foreground/40 text-white text-[11px] font-bold py-2 rounded-xl block uppercase tracking-wide cursor-not-allowed"
                    >
                      Habis
                    </button>
                  ) : product.redirect_url ? (
                    <a
                      href={product.redirect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] text-white text-[11px] font-bold py-2 rounded-xl text-center active:scale-95 transition-all block shadow-md shadow-[#6C3CE1]/15 uppercase tracking-wide cursor-pointer"
                    >
                      Beli
                    </a>
                  ) : (
                    <Link
                      href={`/checkout?id=${product.id}`}
                      className="w-full bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] text-white text-[11px] font-bold py-2 rounded-xl text-center active:scale-95 transition-all block shadow-md shadow-[#6C3CE1]/15 uppercase tracking-wide cursor-pointer"
                    >
                      Beli
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada produk dalam kategori ini.</p>
          </div>
        )}

      </div>
    </section>
  );
}
