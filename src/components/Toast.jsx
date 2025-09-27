import React, { useEffect } from "react";

export default function Toast({ open, onClose, title, message, variant = "success", duration = 4000 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const bg = variant === "success" ? "bg-green-600" : variant === "warning" ? "bg-amber-600" : "bg-slate-800";

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`text-white rounded-xl shadow-lg px-4 py-3 min-w-[260px] ${bg}`}>
        <div className="font-semibold">{title}</div>
        {message && <div className="text-sm opacity-90 mt-1">{message}</div>}
      </div>
    </div>
  );
}
