import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    navigate({ to: isAuthenticated ? "/dashboard" : "/login", replace: true });
  }, [ready, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <img src={LOGO_URL} alt="GEN-CB" className="h-20 w-20 object-contain animate-pulse" />
        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}
