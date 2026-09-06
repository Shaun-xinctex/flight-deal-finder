import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <header className="border-b border-wine/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-wine font-mono text-sm font-bold text-amber">
              F↯
            </div>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-semibold">
                Flight Price Notifier
              </div>
              <div className="text-[11px] text-ink/50">機票降價通知</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] text-ink/70 md:flex">
            <a href="/#how-it-works" className="hover:text-ink">
              How it works
            </a>
            <a href="/#routes" className="hover:text-ink">
              Routes 航線
            </a>
            <Link to="/watchlist" className="hover:text-ink">
              Watchlist 清單
            </Link>
          </nav>
          {!loading &&
            (user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/watchlist"
                  className="rounded-[10px] bg-wine px-4 py-2 text-sm font-semibold text-cream ring-1 ring-wine hover:bg-wine/90"
                >
                  我的清單 Watchlist
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-[10px] px-3 py-2 text-sm font-medium text-ink/60 hover:text-ink"
                >
                  登出
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="rounded-[10px] bg-wine px-4 py-2 text-sm font-semibold text-cream ring-1 ring-wine hover:bg-wine/90"
              >
                Sign in / 登入
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
