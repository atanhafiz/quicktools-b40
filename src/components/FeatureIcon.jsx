import React from "react";

export default function FeatureIcon({ icon, title, desc }) {
  return (
    <div className="card h-full">
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-xl bg-brand.light text-brand p-3">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="p-muted mt-1">{desc}</p>
        </div>
      </div>
    </div>
  );
}
