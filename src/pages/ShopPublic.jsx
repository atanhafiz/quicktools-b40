import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";

// baca dari .env
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function ShopPublic() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Terbaru");

  // Order form
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (DEV_MODE) {
      // Dummy kedai & produk
      const dummyShop = { id: 1, shop_name: "Atan Kuih", slug: "atan-kuih" };
      const dummyProducts = [
        {
          id: 1,
          shop_id: 1,
          name: "Kuih Cara",
          price: 2,
          stock: 100,
          category: "Makanan",
          image_url: "https://placehold.co/200x150?text=Kuih+Cara",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          shop_id: 1,
          name: "Pulut Panggang",
          price: 1.5,
          stock: 50,
          category: "Makanan",
          image_url: "https://placehold.co/200x150?text=Pulut+Panggang",
          created_at: new Date().toISOString(),
        },
      ];
      setShop(dummyShop);
      setProducts(dummyProducts);
    } else {
      if (slug) fetchShop();
    }
  }, [slug]);

  async function fetchShop() {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!error) {
      setShop(data);
      fetchProducts(data.id);
    } else {
      console.error("Error fetch shop:", error.message);
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

  async function placeOrder(e) {
    e.preventDefault();
    if (!selectedProduct) return;

    if (DEV_MODE) {
      alert(
        `Dev mode: Order dummy untuk ${selectedProduct.name}, quantity ${quantity}`
      );
      setSelectedProduct(null);
      setBuyerName("");
      setBuyerPhone("");
      setQuantity(1);
      return;
    }

    const { error } = await supabase.from("orders").insert([
      {
        product_id: selectedProduct.id,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        quantity,
      },
    ]);

    if (error) {
      console.error("Error insert order:", error.message);
      alert("Gagal buat tempahan!");
    } else {
      alert("Tempahan berjaya dihantar! 🎉");
      setSelectedProduct(null);
      setBuyerName("");
      setBuyerPhone("");
      setQuantity(1);
    }
  }

  // Filter & sort
  let filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === "Murah") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === "Stok") {
    filteredProducts.sort((a, b) => b.stock - a.stock);
  } else {
    filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return (
    <section className="section">
      <div className="container">
        {!shop ? (
          <p className="p-muted">Kedai tidak dijumpai.</p>
        ) : (
          <>
            {/* Kedai Info */}
            <div className="mb-6">
              <h1 className="h1">{shop.shop_name}</h1>
              <p className="p-muted">Slug: {shop.slug}</p>
            </div>

            {/* Search + Sort */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-xl p-3 flex-1"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-xl p-3"
              >
                <option>Terbaru</option>
                <option>Murah</option>
                <option>Stok</option>
              </select>
            </div>

            {/* Senarai Produk */}
            {filteredProducts.length === 0 ? (
              <p className="p-muted">Belum ada produk.</p>
            ) : (
              <ul className="grid md:grid-cols-3 gap-6">
                {filteredProducts.map((p) => (
                  <li
                    key={p.id}
                    className="card hover:shadow-lg cursor-pointer"
                    onClick={() => setSelectedProduct(p)}
                  >
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-40 object-cover rounded mb-3"
                      />
                    )}
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-slate-500">
                      RM {p.price} • Stok: {p.stock}
                    </p>
                    <p className="text-xs text-slate-400">{p.category}</p>
                  </li>
                ))}
              </ul>
            )}

            {/* Order Form */}
            {selectedProduct && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">
                    Tempah: {selectedProduct.name}
                  </h2>
                  <form onSubmit={placeOrder} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nama anda"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      required
                      className="w-full border rounded-xl p-3"
                    />
                    <input
                      type="text"
                      placeholder="No Telefon"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      required
                      className="w-full border rounded-xl p-3"
                    />
                    <input
                      type="number"
                      placeholder="Kuantiti"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      required
                      className="w-full border rounded-xl p-3"
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="btn btn-outline"
                      >
                        Batal
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Hantar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
