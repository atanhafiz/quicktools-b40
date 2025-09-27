import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CSVLink } from "react-csv";

// baca dari .env
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function BudgetTracker() {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Makan");
  const [note, setNote] = useState("");
  const [type, setType] = useState("Expense");
  const [wallet, setWallet] = useState("Personal");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const COLORS = ["#1e90ff", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];

  useEffect(() => {
    if (DEV_MODE) {
      // Dummy data untuk dev mode
      setTransactions([
        {
          id: 1,
          user_id: "dev-user",
          amount: 50,
          category: "Makan",
          note: "Sarapan",
          type: "Expense",
          wallet: "Personal",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          user_id: "dev-user",
          amount: 2000,
          category: "Gaji",
          note: "Income bulanan",
          type: "Income",
          wallet: "Personal",
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          user_id: "dev-user",
          amount: 120,
          category: "Minyak",
          note: "Isi petrol",
          type: "Expense",
          wallet: "Rumah",
          created_at: new Date().toISOString(),
        },
      ]);
    } else {
      fetchTransactions();
    }
  }, []);

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetch:", error.message);
    else setTransactions(data);
  }

  async function addTransaction(e) {
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

    const { error } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        amount: parseFloat(amount),
        category,
        note,
        type,
        wallet,
      },
    ]);

    if (error) {
      console.error("Error insert:", error.message);
      alert("Gagal tambah transaksi!");
    } else {
      setAmount("");
      setNote("");
      fetchTransactions();
    }
  }

  // Filter ikut tarikh
  const filteredTransactions = transactions.filter((t) => {
    const date = new Date(t.created_at);
    const afterStart = filterStart ? date >= new Date(filterStart) : true;
    const beforeEnd = filterEnd ? date <= new Date(filterEnd) : true;
    return afterStart && beforeEnd && (wallet ? t.wallet === wallet : true);
  });

  // Kira total income vs expense
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const balance = totalIncome - totalExpense;

  // Data untuk Pie Chart
  const chartData = ["Makan", "Minyak", "Bil", "Lain-lain"].map((cat) => {
    const total = filteredTransactions
      .filter((t) => t.category === cat && t.type === "Expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return { name: cat, value: total };
  });

  return (
    <section className="section">
      <div className="container grid md:grid-cols-2 gap-8">
        {/* Form tambah transaksi */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Tambah Transaksi</h2>
          <form onSubmit={addTransaction} className="space-y-4">
            <input
              type="number"
              placeholder="Amaun (RM)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full border rounded-xl p-3"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option>Makan</option>
              <option>Minyak</option>
              <option>Bil</option>
              <option>Lain-lain</option>
            </select>

            <select
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option>Personal</option>
              <option>Rumah</option>
              <option>Bisnes</option>
              <option>Simpanan</option>
            </select>

            <input
              type="text"
              placeholder="Nota (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-xl p-3"
            />

            <button type="submit" className="btn btn-primary w-full">
              Simpan
            </button>
          </form>
        </div>

        {/* Senarai transaksi + Filter */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Senarai Transaksi</h2>

          {/* Total baki */}
          <div className="mb-4">
            <p className="font-semibold">Income: RM {totalIncome.toFixed(2)}</p>
            <p className="font-semibold text-red-600">
              Expense: RM {totalExpense.toFixed(2)}
            </p>
            <p className="font-bold text-green-600">
              Baki: RM {balance.toFixed(2)}
            </p>
          </div>

          {/* Filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input
              type="date"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              className="border rounded-xl p-2"
            />
            <input
              type="date"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="border rounded-xl p-2"
            />
          </div>

          {/* Export CSV */}
          <CSVLink
            data={filteredTransactions}
            filename="budget-tracker.csv"
            className="btn btn-outline mb-4"
          >
            Export CSV
          </CSVLink>

          {/* List */}
          {filteredTransactions.length === 0 ? (
            <p className="p-muted">Belum ada transaksi</p>
          ) : (
            <ul className="space-y-3 max-h-[300px] overflow-y-auto">
              {filteredTransactions.map((t) => (
                <li
                  key={t.id}
                  className="flex justify-between border-b pb-2 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {t.type === "Expense" ? "-" : "+"} RM {t.amount}
                    </p>
                    <p className="text-slate-500">
                      {t.category} • {t.wallet} • {t.note || "-"}
                    </p>
                  </div>
                  <span className="text-slate-400 text-xs">
                    {new Date(t.created_at).toLocaleString("ms-MY")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pie Chart */}
      <div className="container mt-10 card">
        <h2 className="text-xl font-bold mb-4">Grafik Perbelanjaan Ikut Kategori</h2>
        {chartData.every((c) => c.value === 0) ? (
          <p className="p-muted">Belum ada data perbelanjaan untuk dipaparkan</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
