import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LogOut,
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Archive,
  Settings,
  Menu,
  X,
  CalendarDays,
  QrCode,
  Users,
  BarChart3,
  CheckSquare,
  History,
  ShieldCheck,
  User,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { logout, user, role, allProfiles, switchProfile } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const isAdmin = role === "ADMIN";

  const mainNav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/rapat", label: "Modul Rapat", icon: CalendarDays },
    { to: "/undangan", label: "Undangan Rapat", icon: FileText },
    ...(isAdmin ? [{ to: "/scan-qr", label: "Scan QR", icon: QrCode }] : []),
    { to: "/tugas", label: "Tugas Saya", icon: CheckSquare },
    { to: "/riwayat-kehadiran", label: "Riwayat", icon: History },
  ];

  const toolsNav = [
    { to: "/surat", label: "Generator Surat", icon: FileText },
    { to: "/flayer", label: "Generator Flayer", icon: ImageIcon },
    { to: "/arsip", label: "Arsip Surat", icon: Archive },
    ...(isAdmin
      ? [
          { to: "/pengurus", label: "Pengurus", icon: Users },
          { to: "/laporan-rapat", label: "Laporan", icon: BarChart3 },
          { to: "/pengaturan", label: "Pengaturan", icon: Settings },
        ]
      : []),
  ];

  const allNav = [...mainNav, ...toolsNav];

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

          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <img src={LOGO_URL} alt="GEN-CB" className="h-9 w-9 object-contain" />
            <div className="leading-tight hidden sm:block">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                GEN-CB
              </div>
              <div className="text-sm font-black tracking-tight text-primary">
                OFFICE
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="ml-4 hidden lg:flex items-center gap-1 overflow-x-auto">
            {allNav.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.to || (n.to !== "/dashboard" && pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/75 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {n.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Role Switcher */}
          <div className="ml-auto flex items-center gap-2">
            {/* Dev Role Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-2.5 gap-2 border-primary/30">
                  <div className="flex items-center gap-1.5 text-left">
                    <User className="h-4 w-4 text-primary" />
                    <div className="hidden md:block max-w-[130px] truncate text-xs font-semibold">
                      {user?.full_name || "Akun User"}
                    </div>
                  </div>
                  <Badge
                    variant={isAdmin ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0 h-4 font-mono font-bold"
                  >
                    {role}
                  </Badge>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Akun Aktif saat ini
                </DropdownMenuLabel>
                <div className="p-2 bg-muted/50 rounded-md mb-2">
                  <div className="font-bold text-sm truncate">{user?.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.position} · {user?.bidang}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-primary">
                    <ShieldCheck className="h-3 w-3" /> Role: {user?.role}
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Ganti Akun & Role (Demo Mode)
                </DropdownMenuLabel>
                {allProfiles.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => {
                      switchProfile(p.id);
                      toast.success(`Akun diganti: ${p.full_name} (${p.role})`);
                    }}
                    className={`flex items-center justify-between cursor-pointer text-xs ${
                      user?.id === p.id ? "bg-primary/10 font-bold" : ""
                    }`}
                  >
                    <div className="truncate">
                      <div>{p.full_name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.position}</div>
                    </div>
                    <Badge variant={p.role === "ADMIN" ? "default" : "outline"} className="text-[9px] px-1">
                      {p.role}
                    </Badge>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 cursor-pointer"
                  onClick={() => {
                    logout();
                    toast.success("Berhasil logout");
                    navigate({ to: "/login" });
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Keluar / Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Nav */}
        {open && (
          <div className="lg:hidden border-t bg-card px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
            <div className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-1">Menu Utama</div>
            {allNav.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.to || (n.to !== "/dashboard" && pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                    active ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>
      <main className="pb-12">{children}</main>
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
      queueMicrotask(() => navigate({ to: "/login", search: { redirect: pathname } as never }));
    }
    return null;
  }

  return <AppShell>{children}</AppShell>;
}