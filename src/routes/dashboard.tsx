import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LOGO_URL } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FileText,
  Image as ImageIcon,
  Archive,
  Settings,
  ArrowRight,
  CalendarDays,
  QrCode,
  CheckSquare,
  Sparkles,
  Users,
  BarChart3,
  History,
  Calendar as CalendarIcon,
  ShieldCheck,
  User,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function DashboardPage() {
  const { user, role } = useAuth();
  const isAdmin = role === "ADMIN";

  // Fetch quick stats
  const { data: meetingsCount } = useQuery({
    queryKey: ["dashboard_meetings_count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("meetings")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: myTasksCount } = useQuery({
    queryKey: ["dashboard_tasks_count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from("meeting_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "Selesai");
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: myInvitationsCount } = useQuery({
    queryKey: ["dashboard_invitations_count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from("meeting_participants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const rapatNav = [
    {
      to: "/kalender",
      title: "Kalender Acara GEN-CB",
      desc: "Penanggalan rapat & jadwal kegiatan resmi organisasi.",
      icon: CalendarIcon,
      tone: "brand" as const,
      emoji: "📆",
    },
    {
      to: "/rapat",
      title: "Modul Rapat GEN-CB",
      desc: "Kelola agenda rapat, flyer otomatis, notulensi, & rekap.",
      icon: CalendarDays,
      tone: "brand" as const,
      emoji: "📅",
    },
    {
      to: "/undangan",
      title: "Undangan Rapat Saya",
      desc: "Lihat daftar rapat wajib hadir & QR Code presensi Anda.",
      icon: FileText,
      tone: "accent" as const,
      emoji: "🎟️",
    },
    ...(!isAdmin
      ? [
          {
            to: "/rapat/pengajuan",
            title: "Pengajuan Rapat Baru",
            desc: "Pengurus dapat mengajukan usulan rapat ke Admin GEN-CB.",
            icon: Sparkles,
            tone: "accent" as const,
            emoji: "💡",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            to: "/scan-qr",
            title: "Scan QR Kehadiran",
            desc: "Admin Camera Scanner presensi rapat otomatis 30 FPS.",
            icon: QrCode,
            tone: "brand" as const,
            emoji: "📷",
          },
        ]
      : []),
    {
      to: "/tugas",
      title: "Tugas Saya (Action Items)",
      desc: "Daftar tindak lanjut & tugas dari hasil keputusan rapat.",
      icon: CheckSquare,
      tone: "muted" as const,
      emoji: "✅",
    },
    {
      to: "/riwayat-kehadiran",
      title: "Riwayat Kehadiran",
      desc: "Rekap data kehadiran & persentase partisipasi rapat Anda.",
      icon: History,
      tone: "muted" as const,
      emoji: "📊",
    },
  ];

  const docNav = [
    {
      to: "/surat",
      title: "Generator Surat Resmi",
      desc: "Buat surat resmi GEN-CB dengan penomoran & AI otomatis.",
      icon: FileText,
      tone: "brand" as const,
      emoji: "📄",
    },
    {
      to: "/flayer",
      title: "Generator Flayer Rapat",
      desc: "Desain flayer rapat & kegiatan dengan template GEN-CB.",
      icon: ImageIcon,
      tone: "accent" as const,
      emoji: "🖼️",
    },
    {
      to: "/arsip",
      title: "Arsip Surat & Flayer",
      desc: "Semua dokumen & flyer resmi tersimpan rapi di sini.",
      icon: Archive,
      tone: "muted" as const,
      emoji: "📂",
    },
  ];

  const adminNav = [
    {
      to: "/pengurus",
      title: "Manajemen Pengurus & Akun",
      desc: "Kelola akun pengurus, email, password, & jabatan.",
      icon: Users,
      tone: "brand" as const,
      emoji: "👥",
    },
    {
      to: "/laporan-rapat",
      title: "Laporan & Analitik",
      desc: "Analisis bulanan, tahunan, & peringkat kehadiran pengurus.",
      icon: BarChart3,
      tone: "accent" as const,
      emoji: "📈",
    },
    {
      to: "/pengaturan",
      title: "Pengaturan Organisasi",
      desc: "Kelola profil yayasan, logo, dan tanda tangan digital.",
      icon: Settings,
      tone: "muted" as const,
      emoji: "⚙️",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Welcome Hero Banner */}
      <section
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-primary-foreground shadow-lg"
        style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-brand)" }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img src={LOGO_URL} alt="GEN-CB" className="h-20 w-20 object-contain drop-shadow-xl bg-white/10 rounded-2xl p-2.5 backdrop-blur" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest opacity-80">Selamat datang,</span>
                <Badge variant={isAdmin ? "default" : "secondary"} className="text-[10px] font-bold">
                  {role}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{user?.full_name}</h1>
              <p className="text-sm opacity-90 mt-1">
                {user?.position || "Pengurus"} · {user?.bidang || user?.divisi || "Yayasan Generasi Cerdas Beraksi"}
              </p>
            </div>
          </div>

          {/* Stat Chips */}
          <div className="flex flex-wrap gap-2.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <div className="px-3.5 py-1.5 rounded-xl bg-white/10 text-center">
              <div className="text-[10px] uppercase font-bold opacity-80">Total Rapat</div>
              <div className="text-xl font-black">{meetingsCount || 0}</div>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/10 text-center">
              <div className="text-[10px] uppercase font-bold opacity-80">Undangan Saya</div>
              <div className="text-xl font-black">{myInvitationsCount || 0}</div>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/10 text-center">
              <div className="text-[10px] uppercase font-bold opacity-80">Tugas Aktif</div>
              <div className="text-xl font-black text-amber-300">{myTasksCount || 0}</div>
            </div>
          </div>
        </div>

        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--brand-orange)" }}
        />
        <div
          className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--brand-orange)" }}
        />
      </section>

      {/* SECTION 1: Modul Rapat & Kegiatan */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Modul Rapat & Kehadiran
            </h2>
            <p className="text-xs text-muted-foreground">
              Manajemen agenda rapat, presensi QR Code, notulensi, dan tugas tindak lanjut.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rapatNav.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.to}
                to={c.to}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-xl text-xl shadow-xs"
                      style={{
                        background:
                          c.tone === "brand"
                            ? "var(--gradient-brand)"
                            : c.tone === "accent"
                            ? "var(--gradient-accent)"
                            : "oklch(0.94 0.02 250)",
                        color: c.tone === "muted" ? "var(--brand-blue)" : "white",
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl">{c.emoji}</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold tracking-tight text-foreground">{c.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                  Buka Menu <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: Generator & Arsip Dokumen */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Generator Surat & Flayer
            </h2>
            <p className="text-xs text-muted-foreground">
              Pembuatan surat resmi ber-Kop GEN-CB, pembuatan flayer rapat, dan arsip dokumen.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {docNav.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.to}
                to={c.to}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-xl text-xl shadow-xs"
                      style={{
                        background:
                          c.tone === "brand"
                            ? "var(--gradient-brand)"
                            : c.tone === "accent"
                            ? "var(--gradient-accent)"
                            : "oklch(0.94 0.02 250)",
                        color: c.tone === "muted" ? "var(--brand-blue)" : "white",
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl">{c.emoji}</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold tracking-tight text-foreground">{c.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                  Buka Menu <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Administrasi Organisasi (Admin Only) */}
      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Administrasi & Pengaturan Organisasi
              </h2>
              <p className="text-xs text-muted-foreground">
                Fitur khusus Admin GEN-CB untuk mengelola akun pengurus, analitik, dan pengaturan sistem.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {adminNav.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.to}
                  to={c.to}
                  className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div
                        className="grid h-12 w-12 place-items-center rounded-xl text-xl shadow-xs"
                        style={{
                          background:
                            c.tone === "brand"
                              ? "var(--gradient-brand)"
                              : c.tone === "accent"
                              ? "var(--gradient-accent)"
                              : "oklch(0.94 0.02 250)",
                          color: c.tone === "muted" ? "var(--brand-blue)" : "white",
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-2xl">{c.emoji}</span>
                    </div>
                    <h3 className="mt-4 text-base font-bold tracking-tight text-foreground">{c.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                    Buka Menu <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}