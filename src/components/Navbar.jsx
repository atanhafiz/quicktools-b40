import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function Navbar() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (DEV_MODE) {
      setSession({ user: { id: "dev-user", email: "dev@test.com" } });
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    if (!DEV_MODE) await supabase.auth.signOut();
    setSession(null);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="container flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 24 24" className="text-brand">
            <path fill="currentColor" d="M3 12a9 9 0 1 1 18 0a9 9 0 0 1-18 0m10-6v5.59l3.7 3.7l-1.42 1.42L11 12.41V6z"/>
          </svg>
          <span className="font-extrabold text-xl">QuickTools B40</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/budget-tracker" className={({isActive})=>isActive?"text-brand font-semibold":"text-slate-600 hover:text-slate-900"}>Budget</NavLink>
          <NavLink to="/harga-alert" className={({isActive})=>isActive?"text-brand font-semibold":"text-slate-600 hover:text-slate-900"}>Harga Alert</NavLink>
          <NavLink to="/kedai-express" className={({isActive})=>isActive?"text-brand font-semibold":"text-slate-600 hover:text-slate-900"}>Kedai Express</NavLink>
          <NavLink to="/orders" className={({isActive})=>isActive?"text-brand font-semibold":"text-slate-600 hover:text-slate-900"}>Orders</NavLink>
          <NavLink to="/promosi" className={({isActive})=>isActive?"text-brand font-semibold":"text-slate-600 hover:text-slate-900"}>Promosi</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
              <button onClick={handleLogout} className="btn btn-outline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <a href="#" className="btn btn-primary">Daftar</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
