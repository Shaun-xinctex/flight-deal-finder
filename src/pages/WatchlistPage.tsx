import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Seo } from "@/components/seo";
import { useAuth } from "@/hooks/use-auth";

// Flight Price Notifier M1/M2 backend (API Gateway -> Lambda -> DynamoDB / ECPay).
// Public HTTP API endpoint - no credentials, safe to ship in the client bundle.
const API_BASE = "https://wogic6sc77.execute-api.us-east-1.amazonaws.com";

type PlanKey = "tokyo" | "seoul";

const PLANS: Record
  PlanKey,
  { label: string; labelZh: string; origin: string; destination: string; hint: number }
> = {
  tokyo: { label: "Taipei → Tokyo", labelZh: "台北 ✈ 東京", origin: "TPE", destination: "TYO", hint: 9325 },
  seoul: { label: "Taipei → Seoul", labelZh: "台北 ✈ 首爾", origin: "TPE", destination: "SEL", hint: 5989 },
};

// M2 adds subscription_status + current_period_end to each row. Rows created
// before M2 (M1 legacy rows) have neither field — treat that as pending_payment
// so the user is prompted to pay rather than wrongly shown as subscribed.
type SubscriptionStatus = "pending_payment" | "active" | "cancelled" | "expired";

type Subscription = {
  email: string;
  route: string;
  plan_name: PlanKey;
  target_price: number;
  currency: string;
  updated_at: string;
  subscription_status?: SubscriptionStatus;
  current_period_end?: string;
};

function formatNT(n: number) {
  return `NT$${n.toLocaleString("en-US")}`;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
}

// M1→M2 migration: a row with no subscription_status at all is a pre-paywall
// row. Surface it as "未完成付款" (not the old M1 "已訂閱") so the user
// self-migrates by paying, instead of silently losing service.
function effectiveStatus(sub?: Subscription): SubscriptionStatus | null {
  if (!sub) return null;
  return sub.subscription_status ?? "pending_payment";
}

export default function WatchlistPage() {
  const { user } = useAuth();
  const email = user?.email ?? "";

  const [subs, setSubs] = useState<Record<string, Subscription>>({});
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<Record<PlanKey, string>>({ tokyo: "", seoul: "" });
  const [pending, setPending] = useState<PlanKey | null>(null);
  const [cancelling, setCancelling] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/subscriptions?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data: { items?: Subscription[] }) => {
        if (cancelled) return;
        const byRoute: Record<string, Subscription> = {};
        for (const item of data.items ?? []) byRoute[item.route] = item;
        setSubs(byRoute);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your subscriptions 無法載入訂閱狀態");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  // Handles both first-time subscribe, "完成付款" (retry a pending order),
  // "重新訂閱" (re-subscribe after expired), and in-place target-price
  // updates for active/cancelled rows. The backend decides which of those
  // this call is by what it returns:
  //   - text/html  -> an ECPay auto-submit checkout form. Hand the whole
  //                   page to it so its own <script> can auto-POST to ECPay.
  //   - application/json -> an in-place update, no payment needed.
  async function subscribe(plan: PlanKey) {
    if (!email) return;
    setError(null);
    const route = `${PLANS[plan].origin}-${PLANS[plan].destination}`;
    const existing = subs[route];
    const raw = targets[plan].replace(/[^0-9]/g, "");
    const price = raw ? parseInt(raw, 10) : existing?.target_price;
    if (!price || price <= 0) {
      setError("Enter a target price 請輸入目標價");
      return;
    }
    setPending(plan);
    try {
      const res = await fetch(`${API_BASE}/subscribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, plan_name: plan, target_price: price }),
      });
      if (!res.ok) throw new Error("Request failed");

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        // Unpaid / expired / brand-new subscription: ECPay wants to see this
        // form auto-submitted from the top-level page, not fetched in the
        // background, so replace the document with it.
        const html = await res.text();
        document.open();
        document.write(html);
        document.close();
        return;
      }

      // application/json: already active or cancelled-in-grace — the
      // target price was updated in place, no payment involved.
      await res.json();
      setSubs((s) => ({
        ...s,
        [route]: {
          ...(s[route] ?? { email, route, plan_name: plan, currency: "TWD", updated_at: new Date().toISOString() }),
          target_price: price,
          updated_at: new Date().toISOString(),
        },
      }));
      setTargets((t) => ({ ...t, [plan]: "" }));
    } catch {
      setError("Something went wrong, please try again 發生錯誤，請再試一次");
    } finally {
      setPending(null);
    }
  }

  // Cancels future renewals via ECPay. The row moves to "cancelled" (a
  // grace period), NOT "expired" — the user keeps getting price alerts
  // until current_period_end, which the backend returns and preserves.
  async function cancelSubscription(plan: PlanKey) {
    if (!email) return;
    const route = `${PLANS[plan].origin}-${PLANS[plan].destination}`;
    setError(null);
    setCancelling(plan);
    try {
      const res = await fetch(`${API_BASE}/cancel`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, route }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data: { status?: string; current_period_end?: string } = await res.json();
      setSubs((s) => {
        const existing = s[route];
        if (!existing) return s;
        return {
          ...s,
          [route]: {
            ...existing,
            subscription_status: "cancelled",
            current_period_end: data.current_period_end ?? existing.current_period_end,
          },
        };
      });
    } catch {
      setError("Couldn't cancel, please try again 取消失敗，請再試一次");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="relative min-h-screen bg-cream text-ink">
      <Seo
        title="Your watchlist 我的清單 — Flight Price Notifier"
        description="Track Tokyo and Seoul fares from Taipei and get emailed the moment they hit your target."
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 85% at 50% -12%, rgba(240,162,75,0.4), rgba(216,96,100,0.18) 46%, rgba(246,231,211,0) 74%)",
        }}
      />
      <div className="relative">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <div>
            <h1 className="font-display text-4xl font-semibold">
              Your watchlist <span className="text-ink/40">我的清單</span>
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              Set a target price for Tokyo or Seoul — we'll email you the moment it's hit.
              設定目標價，降價到位就寄信通知。
            </p>
          </div>

          {error && <p className="mt-4 text-sm text-rose">{error}</p>}

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {(Object.keys(PLANS) as PlanKey[]).map((planKey) => {
              const plan = PLANS[planKey];
              const route = `${plan.origin}-${plan.destination}`;
              const sub = subs[route];
              const status = effectiveStatus(sub);

              const badge = (() => {
                switch (status) {
                  case "active":
                    return { text: "已訂閱（有效）Active", cls: "bg-brand/15 text-brand ring-brand/30" };
                  case "pending_payment":
                    return { text: "未完成付款 Pending payment", cls: "bg-amber/20 text-wine ring-amber/40" };
                  case "cancelled":
                    return {
                      text: `已取消 · 有效至 ${formatDate(sub?.current_period_end)}`,
                      cls: "bg-cream text-ink/60 ring-wine/10",
                    };
                  case "expired":
                    return { text: "已結束 Expired", cls: "bg-rose/15 text-rose ring-rose/30" };
                  default:
                    return { text: "未訂閱", cls: "bg-cream text-ink/55 ring-wine/10" };
                }
              })();

              const submitLabel = (() => {
                if (pending === planKey) return "…";
                switch (status) {
                  case "pending_payment":
                    return "完成付款 Complete payment";
                  case "expired":
                    return "重新訂閱 Re-subscribe";
                  case "active":
                  case "cancelled":
                    return "更新目標價 Update target";
                  default:
                    return "開始追蹤 Start tracking";
                }
              })();

              return (
                <div
                  key={planKey}
                  className="rounded-2xl bg-white/60 p-5 ring-1 ring-white/60 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-display text-lg font-semibold">{plan.labelZh}</div>
                      <div className="text-[11px] text-ink/50">{plan.label}</div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-right text-[11px] font-semibold ring-1 ${badge.cls}`}
                    >
                      {badge.text}
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] text-ink/45">
                    Current cheapest around {formatNT(plan.hint)} 目前約 {formatNT(plan.hint)}
                  </p>

                  {sub && (
                    <p className="mt-2 text-sm text-ink/70">
                      Your target 你的目標：
                      <span className="font-mono font-semibold text-wine">
                        {formatNT(sub.target_price)}
                      </span>
                    </p>
                  )}

                  <form
                    className="mt-4 space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      subscribe(planKey);
                    }}
                  >
                    <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50">
                      {sub ? "New target 更新目標價" : "Target price 目標價 (TWD)"}
                      <input
                        value={targets[planKey]}
                        onChange={(e) =>
                          setTargets((t) => ({ ...t, [planKey]: e.target.value }))
                        }
                        inputMode="numeric"
                        placeholder={
                          sub
                            ? `NT$ ${sub.target_price.toLocaleString("en-US")}`
                            : `NT$ ${plan.hint.toLocaleString("en-US")}`
                        }
                        className="mt-1 w-full rounded-lg bg-cream/70 px-3 py-2 font-mono text-sm ring-1 ring-wine/10 outline-none focus:ring-brand"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={pending === planKey || loading}
                      className="w-full rounded-[10px] bg-brand px-4 py-2.5 text-sm font-semibold text-wine ring-1 ring-brand disabled:opacity-60"
                    >
                      {submitLabel}
                    </button>
                  </form>

                  {status === "active" && (
                    <button
                      type="button"
                      onClick={() => cancelSubscription(planKey)}
                      disabled={cancelling === planKey}
                      className="mt-2 w-full rounded-[10px] bg-transparent px-4 py-2 text-xs font-medium text-rose ring-1 ring-rose/30 disabled:opacity-60"
                    >
                      {cancelling === planKey ? "…" : "取消訂閱 Cancel subscription"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl bg-white/60 p-5 ring-1 ring-white/60 backdrop-blur-md">
            <div className="text-sm font-semibold">Notifications 通知</div>
            <div className="mt-2 text-[11px] text-ink/45">
              Alerts go to <span className="font-medium text-ink/70">{email}</span>. Checked
              every 30 minutes — no spam, duplicates are automatically deduped. Cancelling keeps
              alerts going until your current paid period ends.
              每 30 分鐘檢查一次，重複不會收到多封信；取消訂閱後仍會通知到目前付費週期結束。
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
