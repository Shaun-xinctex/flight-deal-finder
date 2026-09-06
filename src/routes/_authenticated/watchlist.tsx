import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/watchlist")({
  head: () => ({
    meta: [
      { title: "Your watchlist 我的清單 — Flight Price Notifier" },
      {
        name: "description",
        content: "The routes you're tracking from Taipei and their target prices.",
      },
    ],
  }),
  component: WatchlistPage,
});

type Watch = {
  id: string;
  origin: string;
  destination_code: string;
  destination_name: string;
  destination_zh: string | null;
  target_price: number;
  current_lowest: number | null;
  previous_price: number | null;
  status: string;
  notify_on_drop: boolean;
  created_at: string;
};

const POPULAR_DESTINATIONS = [
  { code: "KIX", name: "Osaka Kansai", zh: "大阪" },
  { code: "HND", name: "Tokyo Haneda", zh: "東京" },
  { code: "NRT", name: "Tokyo Narita", zh: "東京成田" },
  { code: "ICN", name: "Seoul Incheon", zh: "首爾" },
  { code: "BKK", name: "Bangkok", zh: "曼谷" },
  { code: "SIN", name: "Singapore", zh: "新加坡" },
  { code: "CEB", name: "Cebu", zh: "宿霧" },
  { code: "OKA", name: "Okinawa", zh: "沖繩" },
  { code: "FUK", name: "Fukuoka", zh: "福岡" },
  { code: "MNL", name: "Manila", zh: "馬尼拉" },
];

// Plausible sample fares (NT$) shown until a live fare feed is connected.
const SAMPLE_FARES: Record<string, number> = {
  KIX: 5200, HND: 6150, NRT: 5980, ICN: 4100, BKK: 4280,
  SIN: 3850, CEB: 4300, OKA: 4600, FUK: 5400, MNL: 4900,
};

function formatNT(n: number) {
  return `NT$${n.toLocaleString("en-US")}`;
}

function WatchlistPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [destCode, setDestCode] = useState(POPULAR_DESTINATIONS[0]?.code ?? "KIX");
  const [target, setTarget] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: watches, isLoading } = useQuery({
    queryKey: ["fare_watches", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fare_watches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Watch[];
    },
  });

  const addWatch = useMutation({
    mutationFn: async () => {
      const price = parseInt(target.replace(/[^0-9]/g, ""), 10);
      if (!price || price <= 0) throw new Error("Enter a target price 請輸入目標價");
      const dest = POPULAR_DESTINATIONS.find((d) => d.code === destCode);
      if (!dest) throw new Error("Pick a destination 請選擇目的地");
      const sample = SAMPLE_FARES[dest.code] ?? Math.round(3000 + Math.random() * 5000);
      const { error } = await supabase.from("fare_watches").insert({
        user_id: user!.id,
        origin: "TPE",
        destination_code: dest.code,
        destination_name: dest.name,
        destination_zh: dest.zh,
        target_price: price,
        current_lowest: sample,
        previous_price: Math.round(sample * 1.35),
        status: sample <= price ? "hit" : "watching",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTarget("");
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["fare_watches"] });
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Failed to add"),
  });

  const removeWatch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fare_watches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fare_watches"] }),
  });

  const toggleNotify = useMutation({
    mutationFn: async (w: Watch) => {
      const { error } = await supabase
        .from("fare_watches")
        .update({ notify_on_drop: !w.notify_on_drop })
        .eq("id", w.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fare_watches"] }),
  });

  return (
    <div className="relative min-h-screen bg-cream text-ink">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 85% at 50% -12%, rgba(240,162,75,0.4), rgba(216,96,100,0.18) 46%, rgba(246,231,211,0) 74%)",
        }}
      />
      <div className="relative">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display text-4xl font-semibold">
                Your watchlist <span className="text-ink/40">我的清單</span>
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                Routes you're tracking from Taipei. 降價到目標價就寄信給你。
              </p>
            </div>
            {watches && watches.length > 0 && (
              <span className="hidden items-center gap-2 text-xs text-ink/50 sm:inline-flex">
                <span className="size-1.5 rounded-full bg-brand" /> {watches.length} route
                {watches.length > 1 ? "s" : ""} active
              </span>
            )}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* list */}
            <div className="space-y-4">
              {isLoading && (
                <div className="rounded-xl bg-white/60 p-8 text-center text-sm text-ink/50 ring-1 ring-white/60 backdrop-blur-md">
                  Loading 載入中…
                </div>
              )}
              {!isLoading && (!watches || watches.length === 0) && (
                <div className="rounded-xl bg-white/60 p-8 text-center ring-1 ring-white/60 backdrop-blur-md">
                  <div className="font-display text-xl font-semibold">
                    No watches yet 還沒有追蹤的航線
                  </div>
                  <p className="mt-2 text-sm text-ink/60">
                    Add your first route on the right — we'll email you when the fare drops to your
                    target. 從右邊新增第一條航線吧。
                  </p>
                </div>
              )}
              {watches?.map((w) => {
                const hit =
                  w.status === "hit" ||
                  (w.current_lowest != null && w.current_lowest <= w.target_price);
                return (
                  <div
                    key={w.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl bg-white/60 p-4 ring-1 ring-white/60 backdrop-blur-md"
                  >
                    <div>
                      <div className="font-mono text-sm font-bold tracking-tight">
                        {w.origin} → {w.destination_code}
                      </div>
                      <div className="text-[11px] text-ink/50">
                        {w.destination_name}
                        {w.destination_zh ? ` ${w.destination_zh}` : ""}
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      {w.previous_price != null && (
                        <div className="font-mono text-sm text-ink/40 line-through">
                          {w.previous_price.toLocaleString("en-US")}
                        </div>
                      )}
                      <div className="font-mono text-sm font-bold text-wine">
                        {w.current_lowest != null
                          ? w.current_lowest.toLocaleString("en-US")
                          : "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-[0.1em] text-ink/45">
                        Target 目標
                      </div>
                      <div className="font-mono text-sm text-ink/70">
                        {w.target_price.toLocaleString("en-US")}
                      </div>
                    </div>
                    {hit ? (
                      <span className="animate-pulsehit rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-semibold text-brand ring-1 ring-brand/30">
                        Hit 達標
                      </span>
                    ) : (
                      <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-ink/55 ring-1 ring-wine/10">
                        Watching 追蹤中
                      </span>
                    )}
                    <button
                      onClick={() => removeWatch.mutate(w.id)}
                      className="text-[11px] text-ink/40 underline hover:text-rose"
                    >
                      Remove 移除
                    </button>
                  </div>
                );
              })}
            </div>

            {/* add + settings */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-white/60 p-5 ring-1 ring-white/60 backdrop-blur-md">
                <div className="text-sm font-semibold">Add a watch 新增追蹤</div>
                <form
                  className="mt-4 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addWatch.mutate();
                  }}
                >
                  <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50">
                    Destination 目的地
                    <select
                      value={destCode}
                      onChange={(e) => setDestCode(e.target.value)}
                      className="mt-1 w-full rounded-lg bg-cream/70 px-3 py-2 font-mono text-sm ring-1 ring-wine/10 outline-none focus:ring-brand"
                    >
                      {POPULAR_DESTINATIONS.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} · {d.name} {d.zh}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50">
                    Target price 目標價
                    <input
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      inputMode="numeric"
                      placeholder="NT$ 5,000"
                      className="mt-1 w-full rounded-lg bg-cream/70 px-3 py-2 font-mono text-sm ring-1 ring-wine/10 outline-none focus:ring-brand"
                    />
                  </label>
                  {formError && <p className="text-xs text-rose">{formError}</p>}
                  <button
                    type="submit"
                    disabled={addWatch.isPending}
                    className="w-full rounded-[10px] bg-brand px-4 py-2.5 text-sm font-semibold text-wine ring-1 ring-brand disabled:opacity-60"
                  >
                    Start watching 追蹤
                  </button>
                  <p className="text-[11px] text-ink/45">
                    Sample fares shown until live pricing is connected. 目前顯示範例票價。
                  </p>
                </form>
              </div>

              <div className="rounded-2xl bg-white/60 p-5 ring-1 ring-white/60 backdrop-blur-md">
                <div className="text-sm font-semibold">Notifications 通知</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-ink/70">Email on drop 降價即寄</span>
                  <button
                    aria-label="toggle email on drop"
                    onClick={() => watches?.[0] && toggleNotify.mutate(watches[0])}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                      watches?.[0]?.notify_on_drop ? "bg-brand" : "bg-wine/20"
                    }`}
                  >
                    <span
                      className={`size-3.5 rounded-full bg-white ${
                        watches?.[0]?.notify_on_drop ? "ml-4" : "ml-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="mt-4 text-[11px] text-ink/45">
                  Alerts go to <span className="font-medium text-ink/70">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
