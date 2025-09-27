import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// baca dari .env
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function OrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const pageSize = 10;
  const COLORS = ["#f59e0b", "#10b981"];

  useEffect(() => {
    if (DEV_MODE) {
      // Dummy shops
      setShops([
        { id: 1, shop_name: "Atan Kuih" },
        { id: 2, shop_name: "Atan Printing" },
      ]);

      // Dummy orders
      setOrders([
        {
          id: 101,
          buyer_name: "Ali",
          buyer_phone: "0123456789",
          quantity: 3,
          status: "Pending",
          created_at: new Date().toISOString(),
          products: {
            id: 1,
            name: "Kuih Cara",
            price: 2,
            shops: { id: 1, shop_name: "Atan Kuih" },
          },
        },
        {
          id: 102,
          buyer_name: "Siti",
          buyer_phone: "0134567890",
          quantity: 5,
          status: "Selesai",
          created_at: new Date(
            new Date().setMonth(new Date().getMonth() - 1)
          ).toISOString(),
          products: {
            id: 2,
            name: "Banner Printing",
            price: 30,
            shops: { id: 2, shop_name: "Atan Printing" },
          },
        },
      ]);
    } else {
      fetchShops();
      fetchOrders();

      const channel = supabase
        .channel("orders-changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          () => fetchOrders()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function fetchShops() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data } = await supabase
      .from("shops")
      .select("id, shop_name")
      .eq("user_id", user.id);

    setShops(data || []);
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        buyer_name,
        buyer_phone,
        quantity,
        status,
        created_at,
        products (
          id,
          name,
          price,
          shop_id,
          shops (
            id,
            shop_name
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (!error) setOrders(data.filter((o) => o.products?.shops) || []);
  }

  async function updateStatus(id, newStatus) {
    if (DEV_MODE) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      return;
    }
    await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    fetchOrders();
  }

  // Apply filters
  let filteredOrders = orders.filter((o) => {
    const matchShop =
      selectedShop === "all" || o.products?.shops?.id === parseInt(selectedShop);
    const matchSearch =
      o.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer_phone.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "All" || o.status === statusFilter;
    const orderDate = new Date(o.created_at);
    const matchDate =
      (!dateStart || orderDate >= new Date(dateStart)) &&
      (!dateEnd || orderDate <= new Date(dateEnd));
    return matchShop && matchSearch && matchStatus && matchDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Summary
  const totalOrders = filteredOrders.length;
  const totalQty = filteredOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalRevenue = filteredOrders.reduce(
    (sum, o) => sum + o.quantity * (o.products?.price || 0),
    0
  );

  // Analytics data
  const statusData = [
    {
      name: "Pending",
      value: filteredOrders.filter((o) => o.status === "Pending").length,
    },
    {
      name: "Selesai",
      value: filteredOrders.filter((o) => o.status === "Selesai").length,
    },
  ];

  const monthData = Object.values(
    filteredOrders.reduce((acc, o) => {
      const month = new Date(o.created_at).toLocaleString("ms-MY", {
        month: "short",
        year: "numeric",
      });
      if (!acc[month]) acc[month] = { name: month, jumlah: 0 };
      acc[month].jumlah += 1;
      return acc;
    }, {})
  );

  // CSV + Excel export
  const csvData = filteredOrders.map((o) => ({
    Nama: o.buyer_name,
    Telefon: o.buyer_phone,
    Produk: o.products?.name,
    Kedai: o.products?.shops?.shop_name,
    Kuantiti: o.quantity,
    Harga: o.products?.price,
    Jumlah: o.quantity * (o.products?.price || 0),
    Status: o.status,
    Tarikh: new Date(o.created_at).toLocaleString("ms-MY"),
  }));

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "orders.xlsx");
  }

  return (
    <section className="section">
      <div className="container card space-y-6">
        <h1 className="h1">Orders Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-slate-500">Total Order</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
          <div className="card text-center">
            <p className="text-slate-500">Produk Terjual</p>
            <p className="text-2xl font-bold">{totalQty}</p>
          </div>
          <div className="card text-center">
            <p className="text-slate-500">Revenue (RM)</p>
            <p className="text-2xl font-bold">{totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="border rounded-lg p-2 text-sm"
          >
            <option value="all">Semua Kedai</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shop_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg p-2 text-sm"
          >
            <option value="All">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Selesai">Selesai</option>
          </select>

          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="border rounded-lg p-2 text-sm"
          />
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="border rounded-lg p-2 text-sm"
          />

          <input
            type="text"
            placeholder="Cari nama / telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg p-2 flex-1"
          />

          <CSVLink
            data={csvData}
            filename="orders.csv"
            className="btn btn-outline"
          >
            Export CSV
          </CSVLink>
          <button onClick={exportExcel} className="btn btn-primary">
            Export Excel
          </button>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-2">Status Orders</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Order Bulanan</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#1e90ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders List */}
        <ul className="space-y-3">
          {paginatedOrders.map((o) => (
            <li
              key={o.id}
              className="border-b pb-3 text-sm flex justify-between items-start"
              onClick={() => setSelectedOrder(o)}
            >
              <div>
                <p className="font-semibold">
                  {o.buyer_name} ({o.buyer_phone})
                </p>
                <p className="text-slate-500">
                  Produk: {o.products?.name} • Kedai:{" "}
                  {o.products?.shops?.shop_name}
                </p>
                <p className="text-slate-500">
                  Kuantiti: {o.quantity} • RM {o.products?.price} •{" "}
                  <span
                    className={`${
                      o.status === "Selesai"
                        ? "text-green-600 font-bold"
                        : "text-yellow-600 font-semibold"
                    }`}
                  >
                    {o.status}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {o.status !== "Selesai" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(o.id, "Selesai");
                    }}
                    className="btn btn-primary text-xs"
                  >
                    Selesai
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn btn-outline"
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn btn-outline"
          >
            Next
          </button>
        </div>

        {/* Modal Order Detail */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Order Detail</h2>
              <p>
                <strong>Nama:</strong> {selectedOrder.buyer_name}
              </p>
              <p>
                <strong>Telefon:</strong> {selectedOrder.buyer_phone}
              </p>
              <p>
                <strong>Produk:</strong> {selectedOrder.products?.name}
              </p>
              <p>
                <strong>Kuantiti:</strong> {selectedOrder.quantity}
              </p>
              <p>
                <strong>Harga:</strong> RM {selectedOrder.products?.price}
              </p>
              <p>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
              <p>
                <strong>Tarikh:</strong>{" "}
                {new Date(selectedOrder.created_at).toLocaleString("ms-MY")}
              </p>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn btn-outline"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
