import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteHeader } from "@/components/site-header";
import { Seo } from "@/components/seo";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/watchlist");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("確認信已寄出!Check your email to confirm your account, then sign in.");
        } else {
          navigate("/watchlist");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Please try again. 登入失敗,請再試一次。");
      return;
    }
    if (result.redirected) return;
    navigate("/watchlist");
  }

  return (
    <div className="relative min-h-screen bg-cream text-ink">
      <Seo
        title="Sign in — Flight Price Notifier 機票降價通知"
        description="Sign in to track flight prices from Taipei and get emailed when fares drop to your target price."
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 85% at 50% -12%, rgba(240,162,75,0.5), rgba(216,96,100,0.22) 46%, rgba(246,231,211,0) 74%)",
        }}
      />
      <div className="relative">
        <SiteHeader />
        <main className="mx-auto flex max-w-6xl items-center justify-center px-6 py-16">
          <div className="w-full max-w-md rounded-3xl bg-white/55 p-8 shadow-[0_30px_60px_-30px_rgba(59,36,26,0.5)] ring-1 ring-white/60 backdrop-blur-xl">
            <h1 className="font-display text-3xl font-semibold">
              {mode === "signin" ? "Welcome back 歡迎回來" : "Create account 建立帳號"}
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              Sign in to watch fares from Taipei. 登入後即可追蹤台北出發的票價。
            </p>

            <button
              onClick={handleGoogle}
              className="mt-6 w-full rounded-[10px] bg-white/70 px-4 py-2.5 text-sm font-semibold ring-1 ring-wine/15 hover:bg-white"
            >
              Continue with Google · 使用 Google 登入
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.15em] text-ink/40">
              <span className="h-px flex-1 bg-wine/10" />
              or 或
              <span className="h-px flex-1 bg-wine/10" />
            </div>

            <form onSubmit={handleEmail} className="space-y-3">
              <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50">
                Email 信箱
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-cream/70 px-3 py-2 font-mono text-sm ring-1 ring-wine/10 outline-none focus:ring-brand"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50">
                Password 密碼
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-cream/70 px-3 py-2 font-mono text-sm ring-1 ring-wine/10 outline-none focus:ring-brand"
                  placeholder="••••••••"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-[10px] bg-brand px-4 py-2.5 text-sm font-semibold text-wine ring-1 ring-brand disabled:opacity-60"
              >
                {busy
                  ? "…"
                  : mode === "signin"
                    ? "Sign in / 登入"
                    : "Sign up / 註冊"}
              </button>
            </form>

            {message && (
              <p className="mt-4 rounded-lg bg-brand/15 px-3 py-2 text-sm text-wine ring-1 ring-brand/30">
                {message}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-lg bg-rose/15 px-3 py-2 text-sm text-rose ring-1 ring-rose/30">
                {error}
              </p>
            )}

            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setMessage(null);
              }}
              className="mt-5 w-full text-center text-sm text-ink/60 hover:text-ink"
            >
              {mode === "signin"
                ? "No account yet? Sign up 還沒有帳號?註冊"
                : "Already have an account? Sign in 已有帳號?登入"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
