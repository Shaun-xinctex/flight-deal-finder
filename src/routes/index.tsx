import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flight Price Notifier 機票降價通知 — Taipei fare alerts" },
      {
        name: "description",
        content:
          "設定航線與目標價,機票降價就通知你。Set a route and a target price — we email you when the fare drops from Taipei.",
      },
      { property: "og:title", content: "Flight Price Notifier 機票降價通知" },
      {
        property: "og:description",
        content:
          "Set a route and a target price — we email you when the fare drops. 設定航線與目標價,機票降價就通知你。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const POPULAR_ROUTES = [
  { code: "KIX", name: "Osaka 大阪", price: "NT$5,200", change: "−41%", bars: [70, 60, 52, 38, 24] },
  { code: "HND", name: "Tokyo Haneda 東京", price: "NT$6,150", change: "−22%", bars: [80, 72, 64, 58, 48] },
  { code: "CEB", name: "Cebu 宿霧", price: "NT$4,300", change: "−35%", bars: [66, 58, 60, 42, 28] },
];

const STEPS = [
  {
    n: "01",
    title: "Pick a route 選航線",
    body: "Pick any airport you want to fly to — we track the whole network from Taipei.",
  },
  {
    n: "02",
    title: "Set a target 設目標價",
    body: "Set the fare you would happily pay, like NT$5,000. That's the whole ask.",
  },
  {
    n: "03",
    title: "Get the ping 收到通知",
    body: "The instant it dips under, you get one clean email. No noise, no pressure.",
  },
];

function LandingPage() {
  const { user } = useAuth();
  const ctaTo = user ? "/watchlist" : "/auth";

  return (
    <div className="relative min-h-screen bg-cream text-ink">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 85% at 50% -12%, rgba(240,162,75,0.5), rgba(216,96,100,0.22) 46%, rgba(246,231,211,0) 74%)",
        }}
      />
      <div className="relative">
        <SiteHeader />

        {/* HERO */}
        <section>
          <div className="mx-auto max-w-6xl px-6 pt-16 pb-14">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="max-w-[46ch]">
                <div className="animate-rise inline-flex items-center gap-2 rounded-full bg-white/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-wine/70 ring-1 ring-wine/10">
                  <span className="animate-tick size-1.5 rounded-full bg-brand" /> Live fares ·
                  即時票價
                </div>
                <h1
                  className="animate-rise mt-6 font-display text-6xl leading-none font-semibold tracking-tight text-balance xl:text-7xl"
                  style={{ animationDelay: "0.05s" }}
                >
                  Flight Price
                  <br />
                  Notifier
                </h1>
                <p
                  className="animate-rise mt-6 font-display text-3xl font-medium text-wine"
                  style={{ animationDelay: "0.1s" }}
                >
                  設定航線與目標價,
                  <br />
                  機票降價就通知你。
                </p>
                <p
                  className="animate-rise mt-4 max-w-[42ch] text-base text-pretty text-ink/65"
                  style={{ animationDelay: "0.15s" }}
                >
                  Set a route and a target price — we email you when the fare drops. No refresh, no
                  guesswork, just the moment it dips under your budget.
                </p>
                <div
                  className="animate-rise mt-8 flex flex-wrap items-center gap-3"
                  style={{ animationDelay: "0.2s" }}
                >
                  <Link
                    to={ctaTo}
                    className="rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-wine ring-1 ring-brand shadow-[0_10px_30px_-12px_rgba(224,122,42,0.7)]"
                  >
                    Start watching 開始追蹤
                  </Link>
                  <span className="text-xs text-ink/50">Free · 免費 · No card required</span>
                </div>
              </div>

              {/* fare alert card */}
              <div className="animate-rise relative" style={{ animationDelay: "0.1s" }}>
                <div className="absolute -inset-4 -z-10 rounded-[28px] bg-gradient-to-br from-brand/30 to-rose/20 blur-2xl" />
                <div className="rounded-3xl bg-white/55 p-6 shadow-[0_30px_60px_-30px_rgba(59,36,26,0.5)] ring-1 ring-white/60 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-wine/60">
                      Fare alert · 票價提醒
                    </span>
                    <span className="font-mono text-[11px] text-ink/40">2026-09-06 09:21</span>
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <div className="font-mono text-2xl font-bold tracking-tight">
                        TPE <span className="text-ink/30">→</span> KIX
                      </div>
                      <div className="mt-1 text-[12px] text-ink/55">
                        Taipei 台北 → Osaka Kansai 大阪
                      </div>
                    </div>
                    <span className="animate-pulsehit inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[12px] font-semibold text-brand ring-1 ring-brand/30">
                      <span className="size-1.5 rounded-full bg-brand" /> Target hit 達標
                    </span>
                  </div>
                  <div className="mt-6 flex items-end gap-4">
                    <div className="leading-none">
                      <div className="font-mono text-lg text-ink/40 line-through">NT$8,900</div>
                      <div className="text-[11px] text-ink/40">was 原價</div>
                    </div>
                    <div className="leading-none">
                      <div className="font-mono text-5xl font-bold text-wine">NT$5,200</div>
                      <div className="mt-1 text-[11px] text-ink/50">lowest 最低價</div>
                    </div>
                  </div>
                  <div className="relative mt-5 h-14 overflow-hidden rounded-[10px] bg-cream/70 ring-1 ring-wine/10">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(224,122,42,0), rgba(224,122,42,0.18) 70%, rgba(216,96,100,0.55))",
                      }}
                    />
                    <div
                      className="animate-sheen absolute top-0 bottom-0 w-px"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
                      }}
                    />
                    <div className="relative flex h-full items-end gap-1 px-3 pb-2">
                      {[64, 58, 55, 47, 40, 34, 22].map((h, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${h}%`,
                            backgroundColor: `oklch(0.68 0.16 55 / ${0.4 + i * 0.1})`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[12px]">
                    <span className="text-ink/55">
                      Dropped{" "}
                      <span className="font-mono font-bold text-rose">−41%</span> · under your
                      NT$5,500 target
                    </span>
                    <span className="font-semibold text-brand">View email 查看</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="border-t border-wine/10 bg-white/30">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="max-w-[40ch]">
              <h2 className="font-display text-3xl font-semibold text-balance">
                How it works <span className="text-ink/40">運作方式</span>
              </h2>
              <p className="mt-2 text-sm text-ink/60">
                Three calm steps. We do the watching, you do the packing.
              </p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="rounded-2xl bg-white/55 p-6 ring-1 ring-white/60 backdrop-blur-md"
                >
                  <div className="font-mono text-sm text-brand">{s.n}</div>
                  <div className="mt-3 font-display text-lg font-semibold">{s.title}</div>
                  <p className="mt-2 text-sm text-pretty text-ink/60">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR ROUTES */}
        <section id="routes" className="border-t border-wine/10">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="max-w-[40ch]">
              <h2 className="font-display text-3xl font-semibold text-balance">
                Popular from Taipei <span className="text-ink/40">熱門航線</span>
              </h2>
              <p className="mt-2 text-sm text-ink/60">
                Sample fares we're watching right now from TPE.
              </p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {POPULAR_ROUTES.map((r) => (
                <div key={r.code} className="rounded-2xl bg-cream/70 p-5 ring-1 ring-wine/10">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold tracking-tight">
                      TPE → {r.code}
                    </span>
                    <span className="text-[11px] text-ink/45">{r.name}</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div className="font-mono text-2xl font-bold text-wine">{r.price}</div>
                    <span className="font-mono text-xs font-bold text-rose">{r.change}</span>
                  </div>
                  <div className="mt-3 flex h-8 items-end gap-1">
                    {r.bars.map((h, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          backgroundColor: `oklch(0.68 0.16 55 / ${0.35 + i * 0.14})`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="border-t border-wine/10">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div
              className="rounded-3xl bg-white/50 p-10 text-center ring-1 ring-white/60 backdrop-blur-xl"
              style={{
                backgroundImage:
                  "radial-gradient(120% 120% at 50% 0%, rgba(240,162,75,0.28), rgba(216,96,100,0.14) 60%, rgba(255,255,255,0))",
              }}
            >
              <h2 className="font-display text-4xl leading-tight font-semibold tracking-tight text-balance">
                Stop refreshing. 別再刷票價了。
              </h2>
              <p className="mx-auto mt-3 max-w-[44ch] text-base text-pretty text-ink/65">
                Set your routes and target once. We'll ping you the second a fare dips under your
                budget.
              </p>
              <Link
                to={ctaTo}
                className="mt-7 inline-block rounded-[10px] bg-wine px-6 py-3 text-sm font-semibold text-cream ring-1 ring-wine hover:bg-wine/90"
              >
                Sign in / 登入
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-wine/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-[12px] text-ink/45">
            <span>Flight Price Notifier 機票降價通知</span>
            <span>Departing Taipei 台北出發 · 2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
