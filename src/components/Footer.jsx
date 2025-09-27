import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container py-8 text-sm text-slate-600 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} QuickTools B40. Semua hak cipta terpelihara.</p>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-slate-900">Privasi</a>
          <a href="#" className="hover:text-slate-900">Terma</a>
          <a href="#" className="hover:text-slate-900">Sokongan</a>
        </div>
      </div>
    </footer>
  );
}
