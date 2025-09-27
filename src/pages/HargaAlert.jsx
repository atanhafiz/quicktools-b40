import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

// baca dari .env
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function HargaAlert() {
  const [alerts, setAlerts] = useState([]);
  const [itemName, setItemName] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [editPrice, setEditPrice] = useState({});
  const [filter, setFilter] = useState("Semua");
  const [sortBy, setSortBy] = useState("Terbaru");

  useEffect(() => {
    if (DEV_MODE) {
      // Dummy data
      setAlerts([
        {
          id: 1,
          item_name: "Beras 10kg",
          target_price: 35,
          current_price: 33,
          category: "Makanan",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          item_name: "Minyak Masak 5kg",
          target_price: 27,
          current_price: 30,
          category: "Makanan",
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          item_name: "Susu Pekat",
          target_price: 2.5,
          current_price: null,
          category: "Makanan",
          created_at: new Date().toISOString(),
        },
      ]);
    } else {
      fetchAlerts();
    }
  }, []);

  async function fetchAlerts() {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetch:", error.message);
    else setAlerts(data);
  }

  async function addAlert(e) {
    e.preventDefault();
    if (DEV_MODE) {
      alert("Dev mode: data tak disimpan ke Supabase.");
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      alert("Sila login dulu!");
      return;
    }

    const { error } = await supabase.from("alerts").insert([
      {
        user_id: user.id,
        item_name: itemName,
        target_price: parseFloat(targetPrice),
        current_price: null,
        category,
      },
    ]);

    if (error) {
      console.error("Error insert:", error.message);
      alert("Gagal tambah alert!");
    } else {
      setItemName("");
      setTargetPrice("");
      setCategory("Makanan");
      fetchAlerts();
    }
  }

  async function deleteAlert(id) {
    if (DEV_MODE) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      return;
    }
    if (!confirm("Padam alert ni?")) return;
    const { error } = await supabase.from("alerts").delete().eq("id", id);
    if (error) console.error("Error delete:", error.message);
    else fetchAlerts();
  }

  async function updateCurrentPrice(id) {
    const price = parseFloat(editPrice[id]);
    if (isNaN(price)) {
      alert("Sila isi harga semasa yang sah!");
      return;
    }

    if (DEV_MODE) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, current_price: price } : a
        )
      );
      setEditPrice((prev) => ({ ...prev, [id]: "" }));
      return;
    }

    const { error } = await supabase
      .from("alerts")
      .update({ current_price: price })
      .eq("id", id);

    if (error) console.error("Error update:", error.message);
    else {
      setEditPrice((prev) => ({ ...prev, [id]: "" }));
      fetchAlerts();
    }
  }

  // Filter ikut status
  let filteredAlerts = alerts.filter((a) => {
    const isHit =
      a.current_price !== null && a.current_price <= a.target_price;
    if (filter === "Semua") return true;
    if (filter === "Capai Target") return isHit;
    if (filter === "Belum Capai") return !isHit;
    return true;
  });

  // Sorting
  if (sortBy === "Murah") {
    filteredAlerts.sort(
      (a, b) => (a.current_price || 999999) - (b.current_price || 999999)
    );
  } else if (sortBy === "Dekat Target") {
    filteredAlerts.sort(
      (a, b) =>
        Math.abs((a.current_price || a.target_price) - a.target_price) -
        Math.abs((b.current_price || b.target_price) - b.target_price)
    );
  } else {
    filteredAlerts.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }

  return (
    <section className="section">
      <div className="container grid md:grid-cols-2 gap-8">
        {/* Form tambah alert */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Tambah Harga Alert</h2>
          <form onSubmit={addAlert} className="space-y-4">
            <input
              type="text"
              placeholder="Nama barang"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              className="w-full border rounded-xl p-3"
            />
            <input
              type="number"
              placeholder="Target harga (RM)"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              required
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
            <button type="submit" className="btn btn-primary w-full">
              Simpan
            </button>
          </form>
        </div>

        {/* Senarai alert */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Senarai Alert</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-lg p-2 text-sm"
            >
              <option>Semua</option>
              <option>Capai Target</option>
              <option>Belum Capai</option>
            </select>
          </div>

          {filteredAlerts.length === 0 ? (
            <p className="p-muted">Belum ada alert barang</p>
          ) : (
            <ul className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredAlerts.map((a) => {
                const isHit =
                  a.current_price !== null &&
                  a.current_price <= a.target_price;

                return (
                  <li
                    key={a.id}
                    className={`border-b pb-2 text-sm p-2 rounded ${
                      isHit ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{a.item_name}</p>
                        <p className="text-slate-500">
                          🎯 Target: RM {a.target_price} • Harga semasa:{" "}
                          {a.current_price ? `RM ${a.current_price}` : "-"} •{" "}
                          {a.category}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteAlert(a.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Padam
                      </button>
                    </div>

                    {/* Update harga semasa */}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        placeholder="Harga semasa"
                        value={editPrice[a.id] || ""}
                        onChange={(e) =>
                          setEditPrice((prev) => ({
                            ...prev,
                            [a.id]: e.target.value,
                          }))
                        }
                        className="border rounded-lg p-2 text-sm flex-1"
                      />
                      <button
                        onClick={() => updateCurrentPrice(a.id)}
                        className="btn btn-outline text-xs"
                      >
                        Update
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
