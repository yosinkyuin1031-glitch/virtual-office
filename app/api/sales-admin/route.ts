import { NextResponse } from "next/server";

const ADMIN_API = "https://clinic-saas-lp.vercel.app/api/admin";
const ADMIN_STRIPE_API = "https://clinic-saas-lp.vercel.app/api/admin-stripe";
const APP_CATALOG_API = "https://clinic-saas-lp.vercel.app/api/app-catalog";
const ADMIN_PASSWORD = "clinic-admin-2026";

export async function GET() {
  try {
    const [accountsRes, stripeRes, catalogRes] = await Promise.all([
      fetch(`${ADMIN_API}?password=${ADMIN_PASSWORD}`, {
        headers: { "x-admin-password": ADMIN_PASSWORD },
        next: { revalidate: 60 },
      }),
      fetch(ADMIN_STRIPE_API, {
        headers: { "x-admin-password": ADMIN_PASSWORD },
        next: { revalidate: 60 },
      }),
      fetch(`${APP_CATALOG_API}?password=${ADMIN_PASSWORD}`, {
        headers: { "x-admin-password": ADMIN_PASSWORD },
        next: { revalidate: 300 },
      }),
    ]);

    const accountsData = accountsRes.ok ? await accountsRes.json() : { accounts: [] };
    const stripeData = stripeRes.ok ? await stripeRes.json() : null;
    const catalogData = catalogRes.ok ? await catalogRes.json() : null;

    return NextResponse.json({
      accounts: accountsData.accounts || [],
      stripe: stripeData,
      catalog: catalogData,
    });
  } catch (e) {
    console.error("Sales admin proxy error:", e);
    return NextResponse.json({ error: "データ取得エラー" }, { status: 500 });
  }
}
