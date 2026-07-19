"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Server, ChevronLeft, ChevronRight } from "lucide-react";

const supabase = createClient();

interface ProductDetail {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category_name: string | null;
  delivery_type: "account" | "file";
  image_url: string | null;
  redirect_url: string | null;
  stock: number | null;
}

interface GalleryImage {
  id: number;
  image_url: string;
}

function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString("id-ID")}`;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!productId) {
        setLoading(false);
        return;
      }

      const [{ data: productData }, { data: galleryData }] = await Promise.all([
        supabase.from("products_with_stock").select("*").eq("id", productId).single(),
        supabase
          .from("product_images")
          .select("id, image_url")
          .eq("product_id", productId)
          .order("sort_order", { ascending: true }),
      ]);

      if (productData) {
        setProduct(productData);
        // Foto utama (image_url) ditaruh paling depan, lalu foto tambahan dari galeri.
        // Produk boleh sama sekali tidak punya foto.
        const gallery = ((galleryData || []) as GalleryImage[]).map((g) => g.image_url);
        const allImages = productData.image_url ? [productData.image_url, ...gallery] : gallery;
        setImages(allImages);
      }
      setLoading(false);
    }
    fetchData();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Memuat produk...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
          <h2 className="font-bold text-xl text-red-600 dark:text-red-400">Produk tidak ditemukan</h2>
          <Link href="/" className="mt-4 inline-block text-purple-600 dark:text-purple-400 font-bold text-sm">
            ← Kembali ke Home
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = !product.redirect_url && product.delivery_type === "account" && (product.stock ?? 0) <= 0;

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 mb-4 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>

        <div className="bg-card border border-border rounded-3xl shadow-lg overflow-hidden">
          {/* GALERI FOTO — boleh kosong sama sekali */}
          <div className="relative aspect-square w-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
            {images.length > 0 ? (
              <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <Server className="w-16 h-16 text-[#6C3CE1] dark:text-purple-400" />
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full hover:bg-black/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full hover:bg-black/60 transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === activeImage ? "bg-white w-4" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto border-b border-border">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors cursor-pointer ${
                    i === activeImage ? "border-purple-600" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="p-6">
            {product.category_name && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full mb-2">
                {product.category_name}
              </span>
            )}
            <h1 className="text-xl font-bold text-foreground">{product.title}</h1>

            {!product.redirect_url && (
              <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
                {formatPrice(product.price)}
              </div>
            )}

            {!product.redirect_url && !isOutOfStock && (
              <div className="text-xs text-muted-foreground mt-1">
                {product.stock === null ? "Stok tersedia" : `Stok: ${product.stock}`}
              </div>
            )}

            {product.description && (
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            )}

            <div className="mt-6">
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full bg-muted-foreground/40 text-white text-sm font-bold py-3.5 rounded-2xl uppercase tracking-wide cursor-not-allowed"
                >
                  Stok Habis
                </button>
              ) : product.redirect_url ? (
                <a
                  href={product.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center w-full bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] text-white text-sm font-bold py-3.5 rounded-2xl shadow-lg shadow-[#6C3CE1]/20 active:scale-95 transition-all"
                >
                  Beli Sekarang
                </a>
              ) : (
                <Link
                  href={`/checkout?id=${product.id}`}
                  className="block text-center w-full bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] text-white text-sm font-bold py-3.5 rounded-2xl shadow-lg shadow-[#6C3CE1]/20 active:scale-95 transition-all"
                >
                  Beli Sekarang
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
