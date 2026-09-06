import { Routes, Route } from "react-router-dom";
import { RootErrorBoundary } from "@/components/root-error-boundary";
import { RequireAuth } from "@/components/require-auth";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import WatchlistPage from "@/pages/WatchlistPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <RootErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/watchlist"
          element={
            <RequireAuth>
              <WatchlistPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RootErrorBoundary>
  );
}
