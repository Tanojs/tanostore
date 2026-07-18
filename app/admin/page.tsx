"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  KeyRound,
  Loader2,
  CheckCircle,
  XCircle,
  Database,
  Menu,
  X,
  Tags,
  Power,
  Image as ImageIcon,
  Upload,
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";

const supabase = createClient();

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  category_id: string | null;
  delivery_type: string;
  is_active: boolean;
  created_at: string;
  image_url: string | null;
  categories: { name: string } | null;
}

interface Order {
  id: string;
  created_at: string;
  total_price: number;
  status: string;
  whatsapp: string;
  products: { title: string } | null;
}

interface StockCount {
  total: number;
  available: number;
  sold: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [activeTab, setActiveTab] = useState<"orders" | "categories" | "products" | "stock">("orders");
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockByProduct, setStockByProduct] = useState<Record<string, StockCount>>({});

  // Form States - Kategori
  const [categoryName, setCategoryName] = useState("");

  // Form States - Produk
  const [productTitle, setProductTitle] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [deliveryType, setDeliveryType] = useState("account");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [productRedirectUrl, setProductRedirectUrl] = useState("");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Untuk tombol "Ubah Foto" di tiap baris produk yang sudah ada
  const rowFileInputRef = useRef<HTMLInputElement>(null);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);

  // Form States - Stok
  const [selectedProductId, setSelectedProductId] = useState("");
  const [bulkAccounts, setBulkAccounts] = useState("");

  // Proteksi tambahan di sisi client (proteksi utama ada di middleware.ts server-side)
  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?redirect=/admin");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") {
        router.replace("/");
        return;
      }
      setCheckingAccess(false);
    }
    checkAccess();
  }, [router]);

  useEffect(() => {
    if (checkingAccess) return;
    fetchOrders();
    fetchCategories();
    fetchProducts();
    fetchStockCounts();
  }, [checkingAccess]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, total_price, status, whatsapp, products(title)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) setOrders(data as any);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
    if (!error && data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, price, category_id, delivery_type, is_active, created_at, image_url, categories(name)")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setProducts(data as any);
      if (data.length > 0 && !selectedProductId) setSelectedProductId(data[0].id);
    }
  };

  // Upload 1 file foto ke Supabase Storage (bucket "product-images"), lalu
  // kembalikan URL publiknya untuk disimpan ke kolom image_url.
  const uploadProductImage = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      Swal.fire("Gagal", "File yang dipilih harus berupa gambar.", "error");
      return null;
    }
    if (file.size > 3 * 1024 * 1024) {
      Swal.fire("Gagal", "Ukuran foto maksimal 3MB.", "error");
      return null;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      Swal.fire("Gagal Upload Foto", uploadError.message, "error");
      return null;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Admin (via RLS) boleh baca seluruh product_items -> dipakai untuk memantau stok
  const fetchStockCounts = async () => {
    const { data, error } = await supabase.from("product_items").select("product_id, is_sold");
    if (error || !data) return;

    const counts: Record<string, StockCount> = {};
    for (const row of data as { product_id: string; is_sold: boolean }[]) {
      if (!counts[row.product_id]) counts[row.product_id] = { total: 0, available: 0, sold: 0 };
      counts[row.product_id].total += 1;
      if (row.is_sold) counts[row.product_id].sold += 1;
      else counts[row.product_id].available += 1;
    }
    setStockByProduct(counts);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) {
      Swal.fire("Gagal", error.message, "error");
    } else {
      Swal.fire("Berhasil", `Pesanan diperbarui menjadi ${newStatus}`, "success");
      fetchOrders();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    const slug = categoryName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setLoading(true);
    const { error } = await supabase.from("categories").insert([{ name: categoryName.trim(), slug }]);
    setLoading(false);

    if (error) {
      Swal.fire("Gagal", error.message, "error");
    } else {
      Swal.fire("Sukses", "Kategori baru berhasil ditambahkan!", "success");
      setCategoryName("");
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: `Hapus kategori "${name}"?`,
      text: "Produk yang pakai kategori ini nanti jadi 'Tanpa kategori', bukan ikut terhapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      Swal.fire("Gagal", error.message, "error");
    } else {
      Swal.fire("Terhapus", "Kategori berhasil dihapus.", "success");
      fetchCategories();
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: `Hapus produk "${title}"?`,
      text: "Semua data stok produk ini akan ikut terhapus dan tidak bisa dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      Swal.fire(
        "Gagal Menghapus",
        "Produk ini kemungkinan sudah pernah ada yang beli (ada riwayat pesanan), jadi tidak bisa dihapus permanen. Nonaktifkan saja produknya lewat tombol ⏻ di sebelahnya.",
        "error"
      );
    } else {
      Swal.fire("Terhapus", "Produk berhasil dihapus.", "success");
      fetchProducts();
      fetchStockCounts();
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle || !productPrice) return;
    if (deliveryType === "file" && !deliveryInfo.trim()) {
      Swal.fire("Gagal", "Tautan/link produk wajib diisi untuk tipe File.", "error");
      return;
    }

    setLoading(true);

    let imageUrl: string | null = null;
    if (productImageFile) {
      setUploadingImage(true);
      imageUrl = await uploadProductImage(productImageFile);
      setUploadingImage(false);
      if (!imageUrl) {
        setLoading(false);
        return; // uploadProductImage sudah menampilkan pesan error-nya
      }
    }

    const { error } = await supabase.from("products").insert([
      {
        title: productTitle,
        description: productDescription || null,
        price: parseInt(productPrice),
        category_id: productCategoryId || null,
        delivery_type: deliveryType,
        delivery_info: deliveryType === "file" ? deliveryInfo : null,
        image_url: imageUrl,
        redirect_url: productRedirectUrl.trim() || null,
      },
    ]);

    setLoading(false);
    if (error) {
      Swal.fire("Gagal", error.message, "error");
    } else {
      Swal.fire("Sukses", "Produk baru berhasil ditambahkan!", "success");
      setProductTitle("");
      setProductPrice("");
      setProductDescription("");
      setDeliveryInfo("");
      setProductImageFile(null);
      setProductRedirectUrl("");
      fetchProducts();
    }
  };

  const handleToggleActive = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) {
      Swal.fire("Gagal", error.message, "error");
    } else {
      fetchProducts();
    }
  };

  // Tombol "Ubah Foto" di baris produk yang sudah ada
  const triggerRowImageUpload = (productId: string) => {
    setTargetProductId(productId);
    rowFileInputRef.current?.click();
  };

  const handleRowImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya bisa pilih file yang sama lagi kalau perlu
    if (!file || !targetProductId) return;

    setUploadingImage(true);
    const imageUrl = await uploadProductImage(file);
    setUploadingImage(false);
    if (!imageUrl) return;

    const { error } = await supabase
      .from("products")
      .update({ image_url: imageUrl })
      .eq("id", targetProductId);

    if (error) {
      Swal.fire("Gagal", error.message, "error");
    } else {
      Swal.fire("Sukses", "Foto produk berhasil diperbarui!", "success");
      fetchProducts();
    }
  };

  const handleFillStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !bulkAccounts.trim()) return;

    setLoading(true);
    const lines = bulkAccounts.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const itemsToInsert = lines.map((line) => ({
      product_id: selectedProductId,
      data: line,
      is_sold: false,
    }));

    const { error } = await supabase.from("product_items").insert(itemsToInsert);

    setLoading(false);
    if (error) {
      Swal.fire("Gagal", error.message, "error");
    } else {
      Swal.fire("Sukses", `${itemsToInsert.length} stok berhasil dimasukkan!`, "success");
      setBulkAccounts("");
      fetchStockCounts();
    }
  };

  const navItems = [
    { id: "orders", label: "Daftar Pesanan", icon: <ShoppingBag size={18} /> },
    { id: "categories", label: "Kategori", icon: <Tags size={18} /> },
    { id: "products", label: "Produk", icon: <PlusCircle size={18} /> },
    { id: "stock", label: "Stok", icon: <KeyRound size={18} /> },
  ];

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-purple-600" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* HEADER MOBILE */}
      <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-1.5 rounded-lg text-white">
            <LayoutDashboard size={18} />
          </div>
          <span className="font-black text-foreground text-base">Dasbor Admin</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-all"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <div className={`w-full md:w-64 bg-card border-r border-border p-6 flex flex-col gap-2 ${isMobileMenuOpen ? "block" : "hidden md:flex"} md:sticky md:top-0 md:h-screen`}>
        <div className="hidden md:flex items-center gap-3 mb-8 px-2">
          <div className="bg-purple-600 p-2 rounded-xl text-white">
            <LayoutDashboard size={20} />
          </div>
          <span className="font-black text-foreground text-lg">Dasbor Admin</span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as any);
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === item.id ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 p-4 sm:p-6 md:p-10 overflow-x-hidden">
        {/* TAB 1: DAFTAR PESANAN */}
        {activeTab === "orders" && (
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground mb-6">Pantau Transaksi Masuk 🛒</h1>
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-x-auto">
              <div className="min-w-[700px] w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border text-xs font-bold uppercase text-muted-foreground">
                      <th className="p-4 pl-6">ID Pesanan</th>
                      <th className="p-4">Produk</th>
                      <th className="p-4">WhatsApp</th>
                      <th className="p-4">Total Harga</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-foreground divide-y divide-border">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground font-medium">Belum ada pesanan masuk.</td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-4 pl-6 font-mono font-bold text-xs text-muted-foreground">#{order.id.slice(0, 8)}</td>
                          <td className="p-4 font-semibold text-foreground">{order.products?.title || "-"}</td>
                          <td className="p-4 font-semibold text-foreground">{order.whatsapp}</td>
                          <td className="p-4 font-bold text-purple-600">Rp {Number(order.total_price).toLocaleString("id-ID")}</td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === "paid"
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : order.status === "pending"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {order.status === "paid" ? "Lunas" : order.status === "pending" ? "Pending" : order.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 flex justify-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(order.id, "paid")}
                              className="bg-green-500/10 text-green-600 dark:text-green-400 p-2 rounded-xl hover:bg-green-500/20 transition-colors cursor-pointer"
                              title="Tandai Lunas"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "expired")}
                              className="bg-red-500/10 text-red-600 dark:text-red-400 p-2 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer"
                              title="Batalkan"
                            >
                              <XCircle size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Catatan: menandai "Lunas" di sini tidak mengirimkan stok otomatis — hanya dipakai untuk pelunasan manual (mis. transfer bank). Order dari QRIS akan lunas &amp; terkirim otomatis lewat webhook Pakasir.
            </p>
          </div>
        )}

        {/* TAB 2: KATEGORI */}
        {activeTab === "categories" && (
          <div className="max-w-2xl mx-auto md:mx-0">
            <h1 className="text-xl sm:text-2xl font-black text-foreground mb-2">Kelola Kategori 🏷️</h1>
            <p className="text-sm text-muted-foreground mb-6">Tambahkan kategori untuk mengelompokkan produk di etalase.</p>

            <form onSubmit={handleAddCategory} className="bg-card border border-border p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                required
                placeholder="Nama kategori, mis. Akun Premium"
                className="flex-1 p-4 border border-border bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-foreground placeholder:text-muted-foreground"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-4 rounded-2xl font-bold text-sm shadow-lg shadow-purple-100 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                Tambah
              </button>
            </form>

            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted border-b border-border text-xs font-bold uppercase text-muted-foreground">
                    <th className="p-4 pl-6">Nama</th>
                    <th className="p-4 pr-6">Slug</th>
                    <th className="p-4 pr-6 text-right">Jumlah Produk</th>
                    <th className="p-4 pr-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-foreground divide-y divide-border">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground font-medium">Belum ada kategori.</td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id}>
                        <td className="p-4 pl-6 font-semibold text-foreground">{cat.name}</td>
                        <td className="p-4 pr-6 text-muted-foreground font-mono text-xs">{cat.slug}</td>
                        <td className="p-4 pr-6 text-right font-bold text-purple-600">
                          {products.filter((p) => p.category_id === cat.id).length}
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="bg-red-500/10 text-red-600 dark:text-red-400 p-2 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUK */}
        {activeTab === "products" && (
          <div className="max-w-3xl mx-auto md:mx-0">
            <h1 className="text-xl sm:text-2xl font-black text-foreground mb-2">Kelola Produk 📦</h1>
            <p className="text-sm text-muted-foreground mb-6">Tambah produk baru dan pantau status/stoknya di bawah.</p>

            <form onSubmit={handleAddProduct} className="bg-card border border-border p-5 sm:p-8 rounded-3xl shadow-sm space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Nama Produk</label>
                <input
                  type="text" required
                  className="w-full p-4 border border-border bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-foreground placeholder:text-muted-foreground"
                  placeholder="Contoh: Alight Motion Pro"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Deskripsi (opsional)</label>
                <textarea
                  rows={2}
                  className="w-full p-4 border border-border bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="Deskripsi singkat produk"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Harga (Rp)</label>
                <input
                  type="number" required min={0}
                  className="w-full p-4 border border-border bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-foreground placeholder:text-muted-foreground"
                  placeholder="Contoh: 5000"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Kategori</label>
                  <select
                    className="w-full p-4 border border-border bg-muted rounded-2xl text-sm font-semibold text-foreground outline-none"
                    value={productCategoryId}
                    onChange={(e) => setProductCategoryId(e.target.value)}
                  >
                    <option value="">Tanpa kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Belum ada kategori, tambahkan dulu di tab Kategori.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Metode Pengiriman</label>
                  <select
                    className="w-full p-4 border border-border bg-muted rounded-2xl text-sm font-semibold text-foreground outline-none"
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value)}
                  >
                    <option value="account">Account (dari Stok)</option>
                    <option value="file">File / Tautan Unduh</option>
                  </select>
                </div>
              </div>

              {deliveryType === "file" && (
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Tautan / Link File Produk</label>
                  <input
                    type="url" required
                    className="w-full p-4 border border-border bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-foreground placeholder:text-muted-foreground"
                    placeholder="https://drive.google.com/..."
                    value={deliveryInfo}
                    onChange={(e) => setDeliveryInfo(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Link Redirect (opsional)</label>
                <input
                  type="url"
                  className="w-full p-4 border border-border bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-foreground placeholder:text-muted-foreground"
                  placeholder="https://wa.me/62xxx atau link toko luar"
                  value={productRedirectUrl}
                  onChange={(e) => setProductRedirectUrl(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Kalau diisi, tombol Beli di produk ini akan langsung membuka link ini di tab baru — <span className="font-semibold">tidak lewat pembayaran/checkout di web ini sama sekali.</span> Kosongkan kalau mau tetap pakai checkout QRIS otomatis.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Foto Produk (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImageFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border border-border bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-purple-500/10 dark:file:bg-purple-500/20 file:text-purple-600 dark:file:text-purple-400 file:font-bold file:text-xs file:cursor-pointer cursor-pointer"
                />
                {productImageFile && (
                  <p className="text-[11px] text-muted-foreground mt-1">Terpilih: {productImageFile.name}</p>
                )}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-purple-100 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                {uploadingImage ? "Mengunggah foto..." : "Simpan Produk Baru"}
              </button>
            </form>

            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-x-auto">
              {/* Input file tersembunyi, dipicu oleh tombol "Ubah Foto" tiap baris */}
              <input
                type="file"
                accept="image/*"
                ref={rowFileInputRef}
                onChange={handleRowImageChange}
                className="hidden"
              />
              <div className="min-w-[700px] w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border text-xs font-bold uppercase text-muted-foreground">
                      <th className="p-4 pl-6">Foto</th>
                      <th className="p-4">Produk</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Harga</th>
                      <th className="p-4">Stok</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-foreground divide-y divide-border">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground font-medium">Belum ada produk.</td>
                      </tr>
                    ) : (
                      products.map((p) => {
                        const stock = stockByProduct[p.id];
                        return (
                          <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-4 pl-6">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.title} className="w-10 h-10 rounded-xl object-cover border border-border" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-semibold text-foreground">{p.title}</td>
                            <td className="p-4 text-muted-foreground">{p.categories?.name || "-"}</td>
                            <td className="p-4 font-bold text-purple-600">Rp {Number(p.price).toLocaleString("id-ID")}</td>
                            <td className="p-4">
                              {p.delivery_type === "file" ? (
                                <span className="text-xs text-muted-foreground">Tak terbatas</span>
                              ) : (
                                <span className="text-xs font-bold text-foreground">{stock?.available ?? 0} tersedia</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.is_active ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                                {p.is_active ? "Aktif" : "Nonaktif"}
                              </span>
                            </td>
                            <td className="p-4 pr-6 flex justify-center gap-2">
                              <button
                                onClick={() => triggerRowImageUpload(p.id)}
                                disabled={uploadingImage}
                                className="bg-blue-50 text-blue-600 p-2 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                                title="Ubah Foto"
                              >
                                <Upload size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleActive(p)}
                                className="bg-muted text-muted-foreground p-2 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer"
                                title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                              >
                                <Power size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.title)}
                                className="bg-red-500/10 text-red-600 dark:text-red-400 p-2 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer"
                                title="Hapus Produk"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STOK */}
        {activeTab === "stock" && (
          <div className="max-w-3xl mx-auto md:mx-0">
            <h1 className="text-xl sm:text-2xl font-black text-foreground mb-2">Kelola Stok 🔐</h1>
            <p className="text-sm text-muted-foreground mb-6">Pantau jumlah stok tiap produk dan tambahkan stok baru.</p>

            <form onSubmit={handleFillStock} className="bg-card border border-border p-5 sm:p-8 rounded-3xl shadow-sm space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Pilih Produk</label>
                <select
                  className="w-full p-4 border border-border bg-muted rounded-2xl text-sm font-semibold text-foreground outline-none"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.filter((p) => p.delivery_type === "account").length === 0 ? (
                    <option value="">Belum ada produk bertipe Account</option>
                  ) : (
                    products
                      .filter((p) => p.delivery_type === "account")
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Daftar Stok (Satu Data per Baris)</label>
                <textarea
                  required rows={6}
                  className="w-full p-4 border border-border bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 text-xs font-mono text-foreground placeholder:text-muted-foreground"
                  placeholder={"email1@gmail.com:pass1\nemail2@gmail.com:pass2"}
                  value={bulkAccounts}
                  onChange={(e) => setBulkAccounts(e.target.value)}
                />
              </div>
              <button
                type="submit" disabled={loading || !selectedProductId}
                className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-purple-100 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                Tambahkan ke Stok
              </button>
            </form>

            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted border-b border-border text-xs font-bold uppercase text-muted-foreground">
                    <th className="p-4 pl-6">Produk</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Tersedia</th>
                    <th className="p-4 pr-6">Terjual</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-foreground divide-y divide-border">
                  {products.filter((p) => p.delivery_type === "account").length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground font-medium">Belum ada produk bertipe Account.</td>
                    </tr>
                  ) : (
                    products
                      .filter((p) => p.delivery_type === "account")
                      .map((p) => {
                        const s = stockByProduct[p.id] || { total: 0, available: 0, sold: 0 };
                        return (
                          <tr key={p.id}>
                            <td className="p-4 pl-6 font-semibold text-foreground">{p.title}</td>
                            <td className="p-4 text-muted-foreground">{s.total}</td>
                            <td className={`p-4 font-bold ${s.available === 0 ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>{s.available}</td>
                            <td className="p-4 pr-6 text-muted-foreground">{s.sold}</td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
