import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "checking" | "authed" | "anon";

// Client-side replacement for the old `_authenticated` route's `beforeLoad`
// guard: check the Supabase session before rendering protected content, and
// bounce to /auth if there isn't one. Renders nothing while checking, same
// as the old guard blocking the route from rendering until it resolved.
export function RequireAuth({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setStatus(data.session ? "authed" : "anon");
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "checking") return null;
  if (status === "anon") return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
