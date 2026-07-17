import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, LayoutDashboard, FileText, Image as ImageIcon, Archive, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/surat", label: "Generator Surat", icon: FileText },
  { to: "/flayer", label: "Generator Flayer", icon: ImageIcon },
  { to: "/arsip", label: "Arsip", icon: Archive },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 md:hidden hover:bg-muted"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="GEN-CB" className="h-10 w-10 object-contain" />
            <div className="leading-tight">
              <div className="text-xs font-medium text-muted-foreground">GEN-CB</div>
              <div className="text-sm font-black tracking-tight text-primary">
                OFFICE
              </div>
            </div>
          </Link>
          <nav className="ml-6 hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                toast.success("Berhasil logout");
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t bg-card px-4 py-2">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      queueMicrotask(() => navigate({ to: "/login", search: { redirect: pathname } as never }));
    }
    return null;
  }
  return <AppShell>{children}</AppShell>;
}