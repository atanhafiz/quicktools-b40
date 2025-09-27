import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { Link } from "react-router-dom";

// baca dari .env
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (DEV_MODE) {
      // Fake user info untuk dev mode
      setUser({ email: "dev@test.com", id: "dev-user" });
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  return (
    <section className="section">
      <div className="container card">
        <h1 className="h1 mb-4">Dashboard</h1>

        {user ? (
          <p className="p-muted mb-6">
            Selamat datang,{" "}
            <span className="font-bold text-brand">{user.email}</span>
          </p>
        ) : (
          <p className="p-muted mb-6">Loading user...</p>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            to="/budget-tracker"
            className="card hover:shadow-lg text-center"
          >
            <h3 className="font-bold text-lg">📊 Budget Tracker</h3>
            <p className="p-muted mt-2">Catat duit masuk & keluar</p>
          </Link>

          <Link
            to="/harga-alert"
            className="card hover:shadow-lg text-center"
          >
            <h3 className="font-bold text-lg">📉 Harga Alert</h3>
            <p className="p-muted mt-2">Pantau harga barang dapur</p>
          </Link>

          <Link
            to="/kedai-express"
            className="card hover:shadow-lg text-center"
          >
            <h3 className="font-bold text-lg">🛒 Kedai Express</h3>
            <p className="p-muted mt-2">Buka kedai online cepat</p>
          </Link>

          <Link
            to="/orders"
            className="card hover:shadow-lg text-center"
          >
            <h3 className="font-bold text-lg">📦 Orders</h3>
            <p className="p-muted mt-2">Pantau tempahan pelanggan</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
