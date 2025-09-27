import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

// baca dari .env
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function KedaiExpress() {
  const [shops, setShops] = useState([]);
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");

  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [category, setCategory] = useState("Lain-lain");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedShop, setSelectedShop] = useState(null);

  useEffect(() => {
    if (DEV_MODE) {
      // Dummy data untuk dev mode
      const dummyShops = [
        { id: 1, shop_name: "Atan Kuih", slug: "atan-kuih" },
        { id: 2, shop_name: "Atan Printing", slug: "atan-printing" },
      ];
      setShops(dummyShops);
      setSelectedShop(1);

      const dummyProducts = [
        {
          id: 101,
          shop_id: 1,
          name: "Kuih Cara",
          price: 2,
          stock: 100,
          category: "Makanan",
          image_url: "https://placehold.co/100x100?text=Kuih",
        },
        {
          id: 102,
          shop_id: 2,
          name: "Banner Printing",
          price: 30,
          stock: 20,
          category: "Printing",
          image_url: "https://placehold.co/100x100?text=Banner",
        },
      ];
      setProducts(dummyProducts);
    } else {
      fetchShops();
    }
  }, []);

  async function fetchShops() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setShops(data);
      if (data.length > 0) {
        setSelectedShop(data[0].id);
        fetchProducts(data[0].id);
      }
    }
  }

  async function fetchProducts(shopId) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (!error) setProducts(data);
  }

  async function addShop(e) {
    e.preventDefault();
    if (DEV_MODE) {
      alert("Dev mode: data tak disimpan ke Supabase.");
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    await supabase.from("shops").insert([
      {
        user_id: user.id,
        shop_name: shopName,
        slug,
      },
    ]);

    setShopName("");
    setSlug("");
    fetchShops();
  }

  async function addProduct(e) {
    e.preventDefault();
    if (DEV_MODE) {
      alert("Dev mode: data tak disimpan ke Supabase.");
      return;
    }

    if (!selectedShop) return;

    await supabase.from("products").insert([
      {
        shop_id: selectedShop,
        name: productName,
        price: parseFloat(productPrice),
        stock: parseInt(productStock) || 0,
        category,
        image_url: imageUrl,
      },
    ]);

    setProductName("");
    setProductPrice("");
    setProductStock("");
    setCategory("Lain-lain");
    setImageUrl("");
    fetchProducts(selectedShop);
  }

  async function deleteProduct(id) {
    if (DEV_MODE) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    await supabase.from("products").delete().eq("id", id);
    fetchProducts(selectedShop);
  }

  return (
    <section className="section">
      <div className="container grid md:grid-cols-2 gap-8">
        {/* Form tambah kedai */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Buat Kedai Baru</h2>
          <form onSubmit={addShop} className="space-y-4">
            <input
              type="text"
              placeholder="Nama Kedai"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              className="w-full border rounded-xl p-3"
            />
            <input
              type="text"
              placeholder="Slug (unik, contoh: atan-kuih)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full border rounded-xl p-3"
            />
            <button type="submit" className="btn btn-primary w-full">
              Simpan
            </button>
          </form>
        </div>

        {/* Form tambah produk */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Tambah Produk</h2>
          {shops.length === 0 ? (
            <p className="p-muted">Buat kedai dulu sebelum tambah produk.</p>
          ) : (
            <>
              <select
                value={selectedShop || ""}
                onChange={(e) => {
                  setSelectedShop(e.target.value);
                  if (!DEV_MODE) fetchProducts(e.target.value);
                }}
                className="w-full border rounded-xl p-3 mb-4"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shop_name}
                  </option>
                ))}
              </select>
              <form onSubmit={addProduct} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nama Produk"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="w-full border rounded-xl p-3"
                />
                <input
                  type="number"
                  placeholder="Harga (RM)"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  required
                  className="w-full border rounded-xl p-3"
                />
                <input
                  type="number"
                  placeholder="Stok"
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value)}
                  className="w-full border rounded-xl p-3"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  <option>Makanan</option>
                  <option>Barang Rumah</option>
                  <option>Elektrik</option>
                  <option>Lain-lain</option>
                </select>
                <input
                  type="text"
                  placeholder="URL Gambar Produk"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full border rounded-xl p-3"
                />
                <button type="submit" className="btn btn-primary w-full">
                  Simpan
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Senarai produk */}
      {selectedShop && (
        <div className="container mt-10 card">
          <h2 className="text-xl font-bold mb-4">Produk dalam Kedai</h2>
          {products.length === 0 ? (
            <p className="p-muted">Belum ada produk</p>
          ) : (
            <ul className="space-y-3 max-h-[400px] overflow-y-auto">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center border-b pb-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-slate-500">
                        RM {p.price} • Stok: {p.stock} • {p.category}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Padam
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
