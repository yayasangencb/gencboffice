import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatIdDate } from "@/lib/brand";
import { generateQrToken } from "@/lib/rapat";
import type { Meeting } from "@/lib/rapat.types";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  Search,
  Loader2,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/rapat/")({
  head: () => ({ meta: [{ title: "Daftar Rapat — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <DaftarRapatPage />
    </RequireAuth>
  ),
});

function DaftarRapatPage() {
  const { role, user, allProfiles } = useAuth();
  const isAdmin = role === "ADMIN";
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const { data: meetings, isLoading, refetch } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return data as Meeting[];
    },
  });

  const { data: participantsCount } = useQuery({
    queryKey: ["meeting_participants_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_participants")
        .select("meeting_id");
      if (error) return {};
      const counts: Record<string, number> = {};
      data.forEach((p) => {
        counts[p.meeting_id] = (counts[p.meeting_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Admin Proposal Approvals
  const handleApproveProposal = async (m: Meeting) => {
    try {
      // 1. Update status to 'Akan Datang'
      await supabase
        .from("meetings")
        .update({ status: "Akan Datang" })
        .eq("id", m.id);

      // 2. Generate QR Tokens for all active profiles
      const activeProfiles = (allProfiles || []).filter((p) => p.is_active);
      const participantRows = activeProfiles.map((p) => ({
        meeting_id: m.id,
        user_id: p.id,
        qr_token: generateQrToken(m.id, p.id),
        invitation_status: "WAJIB HADIR",
      }));

      await supabase.from("meeting_participants").insert(participantRows);

      const attendanceRows = activeProfiles.map((p) => ({
        meeting_id: m.id,
        user_id: p.id,
        status: "Belum Hadir",
      }));
      await supabase.from("attendance").insert(attendanceRows);

      // 3. Broadcast notification to all pengurus
      const notifRows = activeProfiles.map((p) => ({
        user_id: p.id,
        meeting_id: m.id,
        title: "Undangan Rapat Resmi Baru",
        message: `Rapat "${m.title}" telah disetujui Admin GEN-CB dan dijadwalkan pada ${m.meeting_date}.`,
        type: "invitation",
      }));
      await supabase.from("notifications").insert(notifRows);

      toast.success(`Rapat "${m.title}" berhasil disetujui! Otomatis masuk ke Kalender GEN-CB.`);
      refetch();
    } catch (e) {
      toast.error("Gagal menyetujui pengajuan rapat: " + (e as Error).message);
    }
  };

  const handleRejectProposal = async (m: Meeting) => {
    try {
      await supabase
        .from("meetings")
        .update({ status: "DITOLAK" })
        .eq("id", m.id);
      toast.info(`Pengajuan rapat "${m.title}" ditolak.`);
      refetch();
    } catch (e) {
      toast.error("Gagal menolak pengajuan rapat");
    }
  };

  const pendingProposals = useMemo(() => {
    return (meetings || []).filter((m) => m.status === "MENUNGGU PERSETUJUAN");
  }, [meetings]);

  const filtered = useMemo(() => {
    const rows = meetings ?? [];
    return rows.filter((m) => {
      if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && m.category !== categoryFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          m.title.toLowerCase().includes(s) ||
          (m.location || "").toLowerCase().includes(s) ||
          (m.category || "").toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [meetings, q, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const rows = meetings ?? [];
    return {
      total: rows.length,
      upcoming: rows.filter((r) => r.status === "Akan Datang").length,
      ongoing: rows.filter((r) => r.status === "Sedang Berlangsung").length,
      completed: rows.filter((r) => r.status === "Selesai").length,
      cancelled: rows.filter((r) => r.status === "Dibatalkan").length,
    };
  }, [meetings]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" /> Modul Rapat GEN-CB
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola agenda rapat internal, presensi QR Code, notulen, hingga rekap kehadiran.
          </p>
        </div>
        {isAdmin && (
          <Button asChild className="shadow-md">
            <Link to="/rapat/baru">
              <Plus className="h-4 w-4 mr-1.5" /> Buat Rapat Baru
            </Link>
          </Button>
        )}
      </div>

      {/* Admin Proposal Approval Banner */}
      {isAdmin && pendingProposals.length > 0 && (
        <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Pengajuan Rapat Dari Pengurus ({pendingProposals.length} Menunggu Persetujuan)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingProposals.map((m) => (
              <div key={m.id} className="p-3 bg-card rounded-lg border flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm">{m.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Pengaju: <span className="font-semibold text-foreground">{m.proposed_by_name || "Pengurus"}</span> · Tanggal: {m.meeting_date} {m.start_time} WIB
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={() => handleApproveProposal(m)}>
                    Setujui Rapat
                  </Button>
                  <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => handleRejectProposal(m)}>
                    Tolak
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Rapat</p>
              <p className="text-2xl font-black">{stats.total}</p>
            </div>
            <CalendarDays className="h-8 w-8 text-primary/40" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Akan Datang</p>
              <p className="text-2xl font-black text-blue-600">{stats.upcoming}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500/40" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Selesai</p>
              <p className="text-2xl font-black text-emerald-600">{stats.completed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dibatalkan</p>
              <p className="text-2xl font-black text-destructive">{stats.cancelled}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-destructive/40" />
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari judul rapat, lokasi..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status Rapat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="Akan Datang">Akan Datang</SelectItem>
              <SelectItem value="Sedang Berlangsung">Sedang Berlangsung</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
              <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Kategori Rapat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              <SelectItem value="Rapat Pengurus">Rapat Pengurus</SelectItem>
              <SelectItem value="Rapat Divisi">Rapat Divisi</SelectItem>
              <SelectItem value="Rapat Panitia">Rapat Panitia</SelectItem>
              <SelectItem value="Rapat Evaluasi">Rapat Evaluasi</SelectItem>
              <SelectItem value="Rapat Program Kerja">Rapat Program Kerja</SelectItem>
              <SelectItem value="Rapat Persiapan Kegiatan">Rapat Persiapan Kegiatan</SelectItem>
              <SelectItem value="Rapat Khusus">Rapat Khusus</SelectItem>
              <SelectItem value="Lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Meeting Cards List */}
      {isLoading ? (
        <div className="p-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Belum ada rapat yang sesuai dengan filter.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((m) => {
            const count = participantsCount?.[m.id] || 0;

            const badgeVariant =
              m.status === "Akan Datang"
                ? "default"
                : m.status === "Sedang Berlangsung"
                ? "secondary"
                : m.status === "Selesai"
                ? "outline"
                : "destructive";

            return (
              <Card key={m.id} className="hover:shadow-md transition flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[11px] font-semibold text-primary">
                      {m.category}
                    </Badge>
                    <Badge variant={badgeVariant} className="text-xs">
                      {m.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-black tracking-tight mt-1 line-clamp-2">
                    {m.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      <span>{m.day_name ? m.day_name + ", " : ""}{formatIdDate(m.meeting_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{m.start_time}{m.end_time ? " - " + m.end_time : ""} WIB</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 truncate">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{m.location || "Lokasi belum diatur"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-semibold text-foreground">{count}</span> Peserta Diundang
                    </div>
                    <Button size="sm" asChild variant="ghost" className="h-8 px-2.5 text-primary">
                      <Link to="/rapat/$id" params={{ id: m.id }}>
                        Buka Workspace <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
