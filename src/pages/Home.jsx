import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="section">
        <div className="container grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="badge">Fokus B40</span>
            <h1 className="h1 mt-3">Tool ringan, harga kecik, hasil padu.</h1>
            <p className="p-muted mt-4">
              Tiga solusi cepat untuk mudahkan hidup & tambah peluang rezeki. 
              Pilih satu, try free, kalau best baru bayar. Senang cerita.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link className="btn btn-primary" to="/budget-tracker">
                👉 Budget Tracker
              </Link>
              <Link className="btn btn-outline" to="/harga-alert">
                📉 Harga Alert
              </Link>
              <Link className="btn btn-outline" to="/kedai-express">
                🛒 Kedai Express
              </Link>
            </div>
          </div>
          <div className="card">
            <img
              src="https://images.unsplash.com/photo-1553729784-e91953dec042?q=80&w=1200&auto=format&fit=crop"
              alt="Ilustrasi kewangan"
              className="rounded-xl"
            />
            <p className="text-xs text-slate-500 mt-2">
              *Gambar hiasan ja. Fokus kita: cepat, murah, jadi.
            </p>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="section bg-white">
        <div className="container grid md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-bold text-lg">Kenapa QuickTools?</h3>
            <p className="p-muted mt-2">
              Mobile-first, ringan, tak semak. Feature cukup makan tapi power.
            </p>
          </div>
          <div className="card">
            <h3 className="font-bold text-lg">Harga Mampu</h3>
            <p className="p-muted mt-2">
              Model freemium: free dulu, RM3–RM10 sebulan baru tambah feature pro.
            </p>
          </div>
          <div className="card">
            <h3 className="font-bold text-lg">Bahasa Rakyat</h3>
            <p className="p-muted mt-2">
              BM simple, direct. Emoji sikit-sikit kasi rasa mesra 😄
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
