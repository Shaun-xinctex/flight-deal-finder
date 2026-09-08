import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Seo } from "@/components/seo";
import { useAuth } from "@/hooks/use-auth";

// Flight Price Notifier M1 backend (API Gateway -> Lambda -> DynamoDB).
// Public HTTP API endpoint - no credentials, safe to ship in the client bundle.
const API_BASE = "https://wogic6sc77.execute-api.us-east-1.amazonaws.com";

type PlanKey = "tokyo" | "seoul";

const PLANS: Record<
  PlanKey,
  { label: string; labelZh: string; origin: string; destination: string; hint: number }
> = {
  tokyo: { label: "Taipei → Tokyo", labelZh: "台北 ✈ 東京", origin: "TPE", destination: "TYO", hint: 9325 },
  seoul: { label: "Taipei → Seoul", labelZh: "台北 ✈ 首爾", origin: "TPE", destination: "SEL", hint: 5989 },
};

type Subscription = {
  email: string;
  route: string;
  plan_name: PlanKey;
  target_price: number;
  currency: string;
  updated_at: string;
};

function formatNT(n: number) {
  return `NT$${n.toLocaleString("en-US")}`;
}

export default function WatchlistPage() {
  const { user } = useAuth();
  const email = user?.email ?? "";

  const [subs, setSubs] = useState<Record<string, Subscription>>({});
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<Record<PlanKey, string>>({ tokyo: "", seoul: "" });
  const [pending, setPending] = useState<PlanKey | null>(null);
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

  async function subscribe(plan: PlanKey) {
    if (!email) return;
    setError(null);
    const raw = targets[plan].replace(/[^0-9]/g, "");
    const price = parseInt(raw, 10);
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
      const route = `${PLANS[plan].origin}-${PLANS[plan].destination}`;
      setSubs((s) => ({
        ...s,
        [route]: {
          email,
          route,
          plan_name: plan,
          target_price: price,
          currency: "TWD",
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
              return (
                <div
                  key={planKey}
                  className="rounded-2xl bg-white/60 p-5 ring-1 ring-white/60 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-display text-lg font-semibold">{plan.labelZh}</div>
                      <div className="text-[11px] text-ink/50">{plan.label}</div>
                    </div>
                    {sub ? (
                      <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-semibold text-brand ring-1 ring-brand/30">
                        已訂閱 Subscribed
                      </span>
                    ) : (
                      <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-ink/55 ring-1 ring-wine/10">
                        未訂閱
                      </span>
                    )}
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
                        placeholder={`NT$ ${plan.hint.toLocaleString("en-US")}`}
                        className="mt-1 w-full rounded-lg bg-cream/70 px-3 py-2 font-mono text-sm ring-1 ring-wine/10 outline-none focus:ring-brand"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={pending === planKey || loading}
                      className="w-full rounded-[10px] bg-brand px-4 py-2.5 text-sm font-semibold text-wine ring-1 ring-brand disabled:opacity-60"
                    >
                      {pending === planKey
                        ? "…"
                        : sub
                          ? "更新目標價 Update target"
                          : "開始追蹤 Start tracking"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl bg-white/60 p-5 ring-1 ring-white/60 backdrop-blur-md">
            <div className="text-sm font-semibold">Notifications 通知</div>
            <div className="mt-2 text-[11px] text-ink/45">
              Alerts go to <span className="font-medium text-ink/70">{email}</span>. Checked
              every 30 minutes — no spam, duplicates are automatically deduped.
              每 30 分鐘檢查一次，重複不會收到多封信。
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
