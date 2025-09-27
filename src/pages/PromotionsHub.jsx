import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import Toast from "../components/Toast.jsx";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

const DEFAULT_CATEGORIES = ["Makanan","Elektrik","Pakaian","Rumah & Dapur","Kesihatan","Bundle","Lain-lain"];
const PLATFORMS = ["manual","kedai","shopee","tiktok","lazada","event"];
const STATES = ["Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang","Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor","Terengganu","WP Kuala Lumpur","WP Putrajaya","WP Labuan"];

export default function PromotionsHub() {
  const [promos, setPromos] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [fCat, setFCat] = useState("Semua");
  const [fPlat, setFPlat] = useState("Semua");
  const [fState, setFState] = useState("Semua");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Terbaru");
  const [toast, setToast] = useState({open:false});

  // form tambah manual
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Lain-lain");
  const [platform, setPlatform] = useState("manual");
  const [state, setState] = useState("");
  const [priceBefore, setPriceBefore] = useState("");
  const [priceNow, setPriceNow] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (DEV_MODE) {
      setPromos([
        { id:1, title:"Beras 10kg", category:"Makanan", platform:"kedai", state:"Kedah", price_before:38, price_now:33, url:"#", is_active:true, created_at:new Date().toISOString() },
        { id:2, title:"Rice Cooker", category:"Elektrik", platform:"shopee", state:null, price_before:129, price_now:89, url:"#", is_active:true, created_at:new Date(Date.now()-86400000).toISOString() },
        { id:3, title:"Promo Raya Bundle", category:"Bundle", platform:"event", state:"Selangor", price_before:199, price_now:149, url:"#", is_active:true, created_at:new Date(Date.now()-3600*1000).toISOString() },
      ]);
      return;
    }
    fetchCategories();
    fetchPromos();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("name").order("name");
    if (!error && data) setCategories(data.map(d=>d.name));
  }

  async function fetchPromos() {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (!error && data) setPromos(data);
  }

  const filtered = useMemo(() => {
    let arr = [...promos];
    if (fCat !== "Semua") arr = arr.filter(p => p.category === fCat);
    if (fPlat !== "Semua") arr = arr.filter(p => p.platform === fPlat);
    if (fState !== "Semua") arr = arr.filter(p => (p.state || "") === fState);
    if (q) {
      const qq = q.toLowerCase();
      arr = arr.filter(p => (p.title||"").toLowerCase().includes(qq) || (p.description||"").toLowerCase().includes(qq));
    }
    if (sort === "Murah") arr.sort((a,b)=> (a.price_now||999999)-(b.price_now||999999));
    else if (sort === "Diskaun") arr.sort((a,b)=> ((a.price_before||0)-(a.price_now||0)) < ((b.price_before||0)-(b.price_now||0)) ? 1 : -1 );
    else arr.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
    return arr;
  }, [promos,fCat,fPlat,fState,q,sort]);

  async function addPromo(e){
    e.preventDefault();
    if (DEV_MODE) {
      setPromos(prev=>[
        { id: Math.random(), title, category, platform, state: state||null, price_before: parseFloat(priceBefore||0), price_now: parseFloat(priceNow||0), url, is_active:true, created_at:new Date().toISOString() },
        ...prev
      ]);
      resetForm();
      setToast({open:true, title:"Berjaya", message:"Promosi dummy ditambah (DEV_MODE)", variant:"success"});
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { alert("Sila login."); return; }
    const { error } = await supabase.from("promotions").insert([{
      title,
      category,
      platform,
      state: state || null,
      price_before: priceBefore ? parseFloat(priceBefore) : null,
      price_now: priceNow ? parseFloat(priceNow) : null,
      url: url || null,
      created_by: user.id
    }]);
    if (error) {
      console.error(error.message);
      setToast({open:true, title:"Gagal", message:error.message, variant:"error"});
    } else {
      resetForm();
      setToast({open:true, title:"Berjaya", message:"Promosi ditambah", variant:"success"});
      fetchPromos();
    }
  }

  function resetForm(){
    setTitle(""); setCategory("Lain-lain"); setPlatform("manual");
    setState(""); setPriceBefore(""); setPriceNow(""); setUrl("");
  }

  async function subscribeCategory(){
    if (DEV_MODE) { setToast({open:true,title:"Subscribe",message:"(DEV_MODE) Berjaya subscribe kategori",variant:"success"}); return; }
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { alert("Sila login."); return; }
    const { error } = await supabase.from("user_promo_subscriptions").insert([{
      user_id: user.id,
      category: fCat === "Semua" ? null : fCat,
      platform: fPlat === "Semua" ? null : fPlat,
      state: fState === "Semua" ? null : fState,
      price_threshold: null
    }]);
    if (error) setToast({open:true,title:"Gagal",message:error.message,variant:"error"});
    else setToast({open:true,title:"Berjaya",message:"Langgan promosi ikut filter semasa",variant:"success"});
  }

  return (
    <section className="section">
      <div className="container grid md:grid-cols-3 gap-8">
        {/* Kanan: Senarai + Filter */}
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <h1 className="h1">Senarai Promosi</h1>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={subscribeCategory}>Langgan Alert</button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="mt-4 grid md:grid-cols-4 gap-3">
              <select value={fCat} onChange={e=>setFCat(e.target.value)} className="border rounded-xl p-3">
                <option>Semua</option>
                {categories.map(c=><option key={c}>{c}</option>)}
              </select>
              <select value={fPlat} onChange={e=>setFPlat(e.target.value)} className="border rounded-xl p-3">
                <option>Semua</option>
                {PLATFORMS.map(p=><option key={p}>{p}</option>)}
              </select>
              <select value={fState} onChange={e=>setFState(e.target.value)} className="border rounded-xl p-3">
                <option>Semua</option>
                {STATES.map(s=><option key={s}>{s}</option>)}
              </select>
              <select value={sort} onChange={e=>setSort(e.target.value)} className="border rounded-xl p-3">
                <option>Terbaru</option>
                <option>Murah</option>
                <option>Diskaun</option>
              </select>
            </div>

            {/* Search */}
            <div className="mt-3">
              <input className="border rounded-xl p-3 w-full" placeholder="Cari promosi..." value={q} onChange={e=>setQ(e.target.value)} />
            </div>
          </div>

          {/* List */}
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {filtered.length === 0 ? (
              <div className="card"><p className="p-muted">Belum ada promosi ikut filter.</p></div>
            ) : filtered.map(p=>(
              <a key={p.id} href={p.url || "#"} target="_blank" rel="noreferrer" className="card hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-lg">{p.title}</h3>
                  <span className="badge">{p.platform}</span>
                </div>
                <p className="p-muted mt-1">{p.category || "Lain-lain"} {p.state ? `• ${p.state}` : ""}</p>
                <div className="mt-3 flex items-baseline gap-3">
                  {p.price_now != null && <div className="text-2xl font-extrabold">RM {Number(p.price_now).toFixed(2)}</div>}
                  {p.price_before != null && <div className="line-through text-slate-400">RM {Number(p.price_before).toFixed(2)}</div>}
                </div>
                {p.starts_at && <p className="text-xs text-slate-500 mt-2">Mula: {new Date(p.starts_at).toLocaleString("ms-MY")}</p>}
                {p.ends_at && <p className="text-xs text-slate-500">Tamat: {new Date(p.ends_at).toLocaleString("ms-MY")}</p>}
              </a>
            ))}
          </div>
        </div>

        {/* Kiri: Tambah Promosi Manual */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Tambah Promosi Manual</h2>
          <form onSubmit={addPromo} className="space-y-3">
            <input className="border rounded-xl p-3 w-full" placeholder="Tajuk promosi" value={title} onChange={e=>setTitle(e.target.value)} required />
            <select className="border rounded-xl p-3 w-full" value={category} onChange={e=>setCategory(e.target.value)}>
              {categories.map(c=><option key={c}>{c}</option>)}
            </select>
            <select className="border rounded-xl p-3 w-full" value={platform} onChange={e=>setPlatform(e.target.value)}>
              {PLATFORMS.map(p=><option key={p}>{p}</option>)}
            </select>
            <select className="border rounded-xl p-3 w-full" value={state} onChange={e=>setState(e.target.value)}>
              <option value="">Seluruh negara</option>
              {STATES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded-xl p-3 w-full" type="number" step="0.01" placeholder="Harga sebelum (opsyenal)" value={priceBefore} onChange={e=>setPriceBefore(e.target.value)} />
              <input className="border rounded-xl p-3 w-full" type="number" step="0.01" placeholder="Harga sekarang" value={priceNow} onChange={e=>setPriceNow(e.target.value)} />
            </div>
            <input className="border rounded-xl p-3 w-full" placeholder="URL produk (opsyenal)" value={url} onChange={e=>setUrl(e.target.value)} />
            <button className="btn btn-primary w-full">Simpan</button>
          </form>
        </div>
      </div>

      <Toast open={toast.open} title={toast.title} message={toast.message} variant={toast.variant} onClose={()=>setToast({open:false})} />
    </section>
  );
}
