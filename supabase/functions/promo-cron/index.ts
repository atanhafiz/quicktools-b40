import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "QuickTools B40 <alerts@example.com>";

type Promo = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  state: string | null;
  price_before: number | null;
  price_now: number | null;
  url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

type Sub = {
  id: number;
  user_id: string;
  category: string | null;
  platform: string | null;
  state: string | null;
  price_threshold: number | null;
};

function match(sub: Sub, p: Promo) {
  const catOk = !sub.category || sub.category === p.category;
  const platOk = !sub.platform || sub.platform === p.platform;
  const stateOk = !sub.state || sub.state === (p.state ?? null);
  const priceOk =
    sub.price_threshold == null ||
    (p.price_now != null && p.price_now <= sub.price_threshold);
  return catOk && platOk && stateOk && priceOk;
}

// 🟢 Email HTML template
function buildEmailHTML(promos: Promo[]) {
  const logoUrl = "https://i.imgur.com/3p5p2yW.png"; // tukar ke logo QuickTools boss
  const brand = { primary: "#1e90ff" };

  const items = promos.map(p => {
    const priceNow = p.price_now != null ? `RM${Number(p.price_now).toFixed(2)}` : "-";
    const priceBefore = p.price_before != null
      ? `<span style="color:#64748b;text-decoration:line-through;margin-left:8px;">RM${Number(p.price_before).toFixed(2)}</span>`
      : "";
    const cat = p.category ?? "Lain-lain";
    const loc = p.state ? ` • ${p.state}` : "";
    const btn = p.url
      ? `<a href="${p.url}" target="_blank"
           style="display:inline-block;background:${brand.primary};color:#fff;text-decoration:none;
                  padding:10px 14px;border-radius:10px;font-weight:600">Buka pautan</a>`
      : "";

    return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #e5e7eb">
          <div style="font-size:16px;font-weight:700;color:#0f172a">${p.title}</div>
          <div style="margin-top:6px;font-size:14px;color:#334155">
            <span style="color:#16a34a;font-weight:700">${priceNow}</span>${priceBefore}
            <span style="color:#64748b"> • ${cat}${loc}</span>
          </div>
          ${btn ? `<div style="margin-top:10px">${btn}</div>` : ""}
        </td>
      </tr>`;
  }).join("");

  return `
  <!doctype html>
  <html>
  <body style="margin:0;background:#f8fafc;">
    <table align="center" width="100%" style="padding:24px 0;background:#f8fafc;">
      <tr>
        <td>
          <table align="center" width="600" style="background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(2,6,23,0.06);overflow:hidden">
            <tr>
              <td style="background:${brand.primary};padding:20px 24px;color:#fff;font-weight:600;font-size:18px">
                <img src="${logoUrl}" alt="QuickTools" width="36" height="36" style="vertical-align:middle;border-radius:6px;margin-right:8px"/> 
                QuickTools B40
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px;font:800 20px Inter,Arial;color:#0f172a">
                Promosi untuk hang 🎯
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px">
                <table width="100%">${items}</table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;color:#94a3b8;font:12px Inter,Arial;border-top:1px solid #e5e7eb">
                Emel automatik QuickTools B40.<br/>
                Tip: kalau masuk tab Promotions/Spam, pindahkan ke Primary supaya senang jumpa next time.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// 🟢 Hantar emel via Resend
async function sendEmail(to: string, promos: Promo[]) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing");
    return { ok: false };
  }

  const subject = promos.length > 0
    ? `🎯 ${promos[0].title} turun harga – check sekarang!`
    : `🎯 Promosi menarik untuk anda`;

  const html = buildEmailHTML(promos);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    }),
  });

  const body = await res.text();
  console.log(">>> RESEND RESPONSE:", res.status, body);
  return { ok: res.ok };
}

// 🟢 Cron Handler
serve(async () => {
  console.log(">>> PROMO CRON START:", new Date().toISOString());
  const now = new Date().toISOString();

  const { data: promos } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gte.${now}`);

  console.log(">>> PROMOS FOUND:", promos?.length ?? 0);

  const { data: subs } = await supabase
    .from("user_promo_subscriptions")
    .select("*");

  const promosByUser = new Map<string, Promo[]>();
  for (const s of subs ?? []) {
    const matched = promos?.filter(p => match(s as Sub, p as Promo)) ?? [];
    if (matched.length > 0) {
      promosByUser.set(s.user_id, matched);
    }
  }
  console.log(">>> USERS TO NOTIFY:", promosByUser.size);

  // Fetch emails
  const userIds = Array.from(promosByUser.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,email")
    .in("id", userIds);

  const emailMap = new Map<string, string>();
  for (const pr of profiles ?? []) {
    if (pr.email) emailMap.set(pr.id, pr.email);
  }

  let sent = 0;
  for (const [uid, items] of promosByUser.entries()) {
    const to = emailMap.get(uid);
    if (!to) continue;
    const result = await sendEmail(to, items);
    if (result.ok) sent++;
  }
  console.log(`>>> EMAIL SENT: ${sent}/${promosByUser.size}`);

  console.log(">>> PROMO CRON DONE:", new Date().toISOString());
  return new Response("OK", { status: 200 });
});
