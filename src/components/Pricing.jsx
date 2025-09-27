import React from "react";

export default function Pricing({ plans = [] }) {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center mb-10">
          <span className="badge">Harga mampu milik</span>
          <h2 className="h1 mt-3">Pelan harga yang tak menyakit hati</h2>
          <p className="p-muted mt-3">Start free dulu, upgrade bila perlu. Jangan dok kalut.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <div key={i} className={`card ${p.highlight ? "ring-2 ring-brand" : ""}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold">{p.name}</h3>
                {p.highlight && <span className="badge">Pilihan Ramai</span>}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold">
                  RM{p.price}
                  <span className="text-base font-medium text-slate-500">/{p.cycle}</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {p.features.map((f, idx) => <li key={idx}>• {f}</li>)}
              </ul>
              <button className="btn btn-primary w-full mt-6">Mula Sekarang</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
