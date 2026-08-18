import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { FileText, Image as ImageIcon, Archive, Settings, ArrowRight, CalendarDays, QrCode, CheckSquare } from "lucide-react";
import { LOGO_URL } from "@/lib/brand";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

const cards = [
  {
    to: "/rapat",
    title: "Modul Rapat GEN-CB",
    desc: "Kelola agenda rapat, pembuatan flyer otomatis, dan notulen.",
    icon: CalendarDays,
    tone: "brand" as const,
    emoji: "📅",
  },
  {
    to: "/undangan",
    title: "Undangan Rapat Saya",
    desc: "Lihat undangan rapat wajib hadir & dapatkan QR Code unik Anda.",
    icon: FileText,
    tone: "accent" as const,
    emoji: "🎟️",
  },
  {
    to: "/scan-qr",
    title: "Scan QR Kehadiran",
    desc: "Admin Camera QR Scanner presensi rapat real-time.",
    icon: QrCode,
    tone: "brand" as const,
    emoji: "📷",
  },
  {
    to: "/tugas",
    title: "Tugas Saya (Action Items)",
    desc: "Daftar tindak lanjut & tugas dari hasil keputusan rapat.",
    icon: CheckSquare,
    tone: "muted" as const,
    emoji: "✅",
  },
  {
    to: "/surat",
    title: "Generator Surat",
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
    emoji: "🖼",
  },
  {
    to: "/arsip",
    title: "Arsip Surat",
    desc: "Semua surat & flayer yang pernah dibuat tersimpan di sini.",
    icon: Archive,
    tone: "muted" as const,
    emoji: "📂",
  },
  {
    to: "/pengaturan",
    title: "Pengaturan Organisasi",
    desc: "Data organisasi, logo, dan tanda tangan digital.",
    icon: Settings,
    tone: "muted" as const,
    emoji: "⚙",
  },
];

function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-primary-foreground"
        style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-brand)" }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <img src={LOGO_URL} alt="GEN-CB" className="h-20 w-20 object-contain drop-shadow-xl" />
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">Selamat datang di</div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">GEN-CB Office</h1>
            <p className="mt-2 max-w-xl opacity-90">
              Ruang kerja digital Yayasan Generasi Cerdas Beraksi — semua kebutuhan
              surat dan flayer resmi dalam satu tempat.
            </p>
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

      <section className="mt-8 grid gap-5 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div
                  className="grid h-14 w-14 place-items-center rounded-xl text-2xl"
                  style={{
                    background:
                      c.tone === "brand"
                        ? "var(--gradient-brand)"
                        : c.tone === "accent"
                          ? "var(--gradient-accent)"
                          : "oklch(0.94 0.02 250)",
                    color:
                      c.tone === "muted" ? "var(--brand-blue)" : "white",
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-3xl opacity-70">{c.emoji}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                Buka <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}