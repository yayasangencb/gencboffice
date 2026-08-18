import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatIdDate, LOGO_URL } from "@/lib/brand";
import {
  exportRekapPdf,
  exportRekapExcel,
  calculateAttendanceStatus,
  generateQrToken,
} from "@/lib/rapat";
import type {
  Meeting,
  AttendanceRow,
  LeaveRequest,
  MeetingMinutes,
  MeetingDecision,
  MeetingTask,
  MeetingFile,
  AttendanceLog,
  Profile,
} from "@/lib/rapat.types";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Loader2,
  Sparkles,
  ChevronLeft,
  QrCode,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock3,
  Copy,
  Ban,
  Lock,
  Download,
  Upload,
  Plus,
  Edit,
  Save,
  Radio,
  FileCheck,
  History,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rapat/$id")({
  head: () => ({ meta: [{ title: "Workspace Rapat — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <MeetingWorkspacePage />
    </RequireAuth>
  ),
});

function MeetingWorkspacePage() {
  const { id: meetingId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const isAdmin = role === "ADMIN";

  const [activeTab, setActiveTab] = useState("overview");
  const [manualUserSearch, setManualUserSearch] = useState("");
  const [overrideUser, setOverrideUser] = useState<AttendanceRow | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>("HADIR");
  const [overrideReason, setOverrideReason] = useState("");

  // Clone Modal
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneDate, setCloneDate] = useState("");

  // Fetch Meeting
  const { data: meeting, isLoading: loadingMeeting } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", meetingId)
        .single();
      if (error) throw error;
      return data as Meeting;
    },
  });

  // Fetch Organization for PDF Kop
  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data } = await supabase.from("organization").select("*").single();
      return data || { name: "Yayasan Generasi Cerdas Beraksi", short_name: "GEN-CB" };
    },
  });

  // Fetch Profiles Map
  const { data: profilesMap } = useQuery({
    queryKey: ["profilesMap"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      const map: Record<string, Profile> = {};
      (data || []).forEach((p) => {
        map[p.id] = p as Profile;
      });
      return map;
    },
  });

  // Fetch Attendance & Participants
  const { data: attendanceList, refetch: refetchAttendance } = useQuery({
    queryKey: ["attendance", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("meeting_id", meetingId);
      if (error) throw error;
      return data as AttendanceRow[];
    },
  });

  // Fetch Participants (Tokens)
  const { data: participantTokens } = useQuery({
    queryKey: ["participants", meetingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("meeting_participants")
        .select("*")
        .eq("meeting_id", meetingId);
      return data || [];
    },
  });

  // Supabase Realtime Subscription for Live Attendance
  useEffect(() => {
    const channel = supabase
      .channel(`attendance-realtime-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          refetchAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, refetchAttendance]);

  // Combine Attendance + Profiles + Tokens
  const fullAttendanceRows: AttendanceRow[] = useMemo(() => {
    const rows = attendanceList || [];
    const tokens = participantTokens || [];
    const pMap = profilesMap || {};

    return rows.map((a) => {
      const tokenObj = tokens.find((t) => t.user_id === a.user_id);
      return {
        ...a,
        user: pMap[a.user_id],
        qr_token: tokenObj?.qr_token,
        invitation_status: tokenObj?.invitation_status || "WAJIB HADIR",
      };
    });
  }, [attendanceList, participantTokens, profilesMap]);

  // Attendance Stats
  const stats = useMemo(() => {
    const rows = fullAttendanceRows;
    return {
      total: rows.length,
      hadir: rows.filter((r) => r.status === "HADIR").length,
      terlambat: rows.filter((r) => r.status === "TERLAMBAT").length,
      izin: rows.filter((r) => r.status === "IZIN").length,
      alfa: rows.filter((r) => r.status === "ALFA").length,
      belumHadir: rows.filter((r) => r.status === "Belum Hadir").length,
    };
  }, [fullAttendanceRows]);

  // Fetch Leave Requests
  const { data: leaveRequests, refetch: refetchLeaves } = useQuery({
    queryKey: ["leave_requests", meetingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("meeting_id", meetingId);
      return (data || []) as LeaveRequest[];
    },
  });

  // Fetch Notulen / Minutes
  const { data: minutes, refetch: refetchMinutes } = useQuery({
    queryKey: ["meeting_minutes", meetingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("meeting_minutes")
        .select("*")
        .eq("meeting_id", meetingId)
        .maybeSingle();
      return (data || null) as MeetingMinutes | null;
    },
  });

  // Fetch Decisions
  const { data: decisions, refetch: refetchDecisions } = useQuery({
    queryKey: ["meeting_decisions", meetingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("meeting_decisions")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("decision_number");
      return (data || []) as MeetingDecision[];
    },
  });

  // Fetch Tasks
  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ["meeting_tasks", meetingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("meeting_tasks")
        .select("*")
        .eq("meeting_id", meetingId);
      return (data || []) as MeetingTask[];
    },
  });

  // Fetch Audit Logs
  const { data: auditLogs } = useQuery({
    queryKey: ["attendance_logs", meetingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: false });
      return (data || []) as AttendanceLog[];
    },
  });

  // Handle Status Override
  const handleManualOverride = async () => {
    if (!overrideUser) return;
    if (!overrideReason.trim()) return toast.error("Alasan perubahan status wajib diisi");

    try {
      const prevStatus = overrideUser.status;
      const newStatus = overrideStatus;

      // 1. Update Attendance Status
      const { error: aErr } = await supabase
        .from("attendance")
        .update({
          status: newStatus,
          is_manual: true,
          scanned_by: user?.full_name || "Admin",
          check_in_time: newStatus === "HADIR" || newStatus === "TERLAMBAT" ? new Date().toISOString() : null,
          notes: overrideReason,
        })
        .eq("id", overrideUser.id);

      if (aErr) throw aErr;

      // 2. Insert Audit Log
      await supabase.from("attendance_logs").insert({
        meeting_id: meetingId,
        user_id: overrideUser.user_id,
        changed_by_name: user?.full_name || "Admin",
        prev_status: prevStatus,
        new_status: newStatus,
        reason: overrideReason,
      });

      toast.success(`Status ${overrideUser.user?.full_name} berhasil diubah ke ${newStatus}`);
      setOverrideUser(null);
      setOverrideReason("");
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ["attendance_logs", meetingId] });
    } catch (e) {
      toast.error("Gagal mengubah status: " + (e as Error).message);
    }
  };

  // Leave Approval Handlers
  const handleReviewLeave = async (leaveId: string, userId: string, approved: boolean) => {
    try {
      const newLeaveStatus = approved ? "DISETUJUI" : "DITOLAK";
      const newAttendanceStatus = approved ? "IZIN" : "ALFA";

      await supabase
        .from("leave_requests")
        .update({
          status: newLeaveStatus,
          reviewed_by: user?.full_name || "Admin",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", leaveId);

      await supabase
        .from("attendance")
        .update({ status: newAttendanceStatus })
        .eq("meeting_id", meetingId)
        .eq("user_id", userId);

      toast.success(`Izin berhasil ${approved ? "Disetujui (Status IZIN)" : "Ditolak (Status ALFA)"}`);
      refetchLeaves();
      refetchAttendance();
    } catch (e) {
      toast.error("Gagal memproses izin: " + (e as Error).message);
    }
  };

  // Clone Meeting Handler
  const handleCloneMeeting = async () => {
    if (!meeting || !cloneDate) return toast.error("Pilih tanggal rapat baru");

    try {
      // 1. Insert new meeting
      const { data: newMeeting, error: mErr } = await supabase
        .from("meetings")
        .insert({
          title: meeting.title,
          category: meeting.category,
          description: meeting.description,
          agenda: meeting.agenda,
          meeting_date: cloneDate,
          day_name: new Date(cloneDate).toLocaleDateString("id-ID", { weekday: "long" }),
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          attendance_open_at: meeting.attendance_open_at,
          on_time_until: meeting.on_time_until,
          attendance_close_at: meeting.attendance_close_at,
          location: meeting.location,
          tagline: meeting.tagline,
          pic_name: meeting.pic_name,
          leader_name: meeting.leader_name,
          notulis_name: meeting.notulis_name,
          status: "Akan Datang",
        })
        .select("*")
        .single();

      if (mErr) throw mErr;

      // 2. Clone participants & generate new QR tokens
      const existingUserIds = fullAttendanceRows.map((r) => r.user_id);
      if (existingUserIds.length > 0) {
        const participantRows = existingUserIds.map((uId) => ({
          meeting_id: newMeeting.id,
          user_id: uId,
          qr_token: generateQrToken(newMeeting.id, uId),
          invitation_status: "WAJIB HADIR",
        }));
        await supabase.from("meeting_participants").insert(participantRows);

        const attendanceRows = existingUserIds.map((uId) => ({
          meeting_id: newMeeting.id,
          user_id: uId,
          status: "Belum Hadir",
        }));
        await supabase.from("attendance").insert(attendanceRows);
      }

      toast.success("Rapat berhasil diduplikasi!");
      setCloneOpen(false);
      navigate({ to: "/rapat/$id", params: { id: newMeeting.id } });
    } catch (e) {
      toast.error("Gagal duplikasi rapat: " + (e as Error).message);
    }
  };

  // Close Meeting
  const handleToggleCloseMeeting = async () => {
    if (!meeting) return;
    try {
      const nextIsClosed = !meeting.is_closed;
      await supabase
        .from("meetings")
        .update({
          is_closed: nextIsClosed,
          status: nextIsClosed ? "Selesai" : "Akan Datang",
        })
        .eq("id", meetingId);

      toast.success(nextIsClosed ? "Rapat ditutup (QR Scan dikunci)" : "Rapat dibuka kembali");
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
    } catch (e) {
      toast.error("Gagal mengubah status rapat");
    }
  };

  if (loadingMeeting || !meeting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header Info */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/rapat">
              <ChevronLeft className="h-4 w-4 mr-1" /> Kembali ke Daftar Rapat
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold text-primary">
              {meeting.category}
            </Badge>
            <Badge
              variant={
                meeting.status === "Akan Datang"
                  ? "default"
                  : meeting.status === "Sedang Berlangsung"
                  ? "secondary"
                  : meeting.status === "Selesai"
                  ? "outline"
                  : "destructive"
              }
              className="text-xs"
            >
              {meeting.status}
            </Badge>
            {meeting.is_closed && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" /> Dikunci</Badge>}
          </div>
          <h1 className="text-3xl font-black tracking-tight mt-1">{meeting.title}</h1>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4 text-primary" /> {meeting.day_name ? meeting.day_name + ", " : ""}{formatIdDate(meeting.meeting_date)}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {meeting.start_time}{meeting.end_time ? " - " + meeting.end_time : ""} WIB</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" /> {meeting.location || "-"}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="gap-1.5 border-primary/40 text-primary">
            <Link to="/flayer" search={{ meetingId }}>
              <Sparkles className="h-4 w-4 text-amber-500" /> Generate Flayer
            </Link>
          </Button>
          {isAdmin && (
            <>
              <Button asChild variant="default" className="gap-1.5 shadow-sm">
                <Link to="/scan-qr">
                  <QrCode className="h-4 w-4" /> Scan QR Kehadiran
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCloneOpen(true)}
                title="Duplikasi Rapat"
              >
                <Copy className="h-4 w-4 mr-1" /> Clone Rapat
              </Button>
              <Button
                variant={meeting.is_closed ? "outline" : "secondary"}
                size="sm"
                onClick={handleToggleCloseMeeting}
              >
                <Lock className="h-4 w-4 mr-1" />
                {meeting.is_closed ? "Buka Rapat" : "Tutup Rapat"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        <Card className="bg-card">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Total Undangan</div>
            <div className="text-2xl font-black">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Hadir</div>
            <div className="text-2xl font-black text-emerald-600">{stats.hadir}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Terlambat</div>
            <div className="text-2xl font-black text-amber-600">{stats.terlambat}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Izin</div>
            <div className="text-2xl font-black text-blue-600">{stats.izin}</div>
          </CardContent>
        </Card>
        <Card className="bg-rose-500/10 border-rose-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Alfa</div>
            <div className="text-2xl font-black text-rose-600">{stats.alfa}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Belum Hadir</div>
            <div className="text-2xl font-black">{stats.belumHadir}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex overflow-x-auto w-full justify-start h-auto p-1 bg-muted">
          <TabsTrigger value="overview" className="text-xs py-2 px-3">Overview & Peserta</TabsTrigger>
          <TabsTrigger value="live" className="text-xs py-2 px-3 flex items-center gap-1">
            <Radio className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> Live Kehadiran
          </TabsTrigger>
          <TabsTrigger value="izin" className="text-xs py-2 px-3">
            Persetujuan Izin ({leaveRequests?.filter((l) => l.status === "IZIN MENUNGGU PERSETUJUAN").length || 0})
          </TabsTrigger>
          <TabsTrigger value="notulen" className="text-xs py-2 px-3">Notulen Rapat</TabsTrigger>
          <TabsTrigger value="keputusan" className="text-xs py-2 px-3">Keputusan & Action Items</TabsTrigger>
          <TabsTrigger value="rekap" className="text-xs py-2 px-3">Rekap & Export</TabsTrigger>
          {isAdmin && <TabsTrigger value="audit" className="text-xs py-2 px-3">Audit Log</TabsTrigger>}
        </TabsList>

        {/* Tab 1: Overview & Peserta */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Daftar Peserta & Status Kehadiran</CardTitle>
                <CardDescription>
                  Waktu scan dan penentu status (🟢 Hadir, 🟡 Terlambat, 🔵 Izin, 🔴 Alfa).
                </CardDescription>
              </div>
              <Input
                value={manualUserSearch}
                onChange={(e) => setManualUserSearch(e.target.value)}
                placeholder="Cari nama peserta..."
                className="w-56 h-8 text-xs"
              />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Pengurus</th>
                      <th className="p-3">Jabatan / Divisi</th>
                      <th className="p-3">Jam Scan</th>
                      <th className="p-3">Status</th>
                      {isAdmin && <th className="p-3 text-right">Aksi Manual</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fullAttendanceRows
                      .filter((r) =>
                        manualUserSearch
                          ? (r.user?.full_name || "").toLowerCase().includes(manualUserSearch.toLowerCase())
                          : true
                      )
                      .map((r, idx) => (
                        <tr key={r.id} className="hover:bg-muted/40 transition">
                          <td className="p-3 font-semibold">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-foreground">{r.user?.full_name || "—"}</div>
                            <div className="text-[10px] text-muted-foreground">{r.user?.email}</div>
                          </td>
                          <td className="p-3">{r.user?.position} · {r.user?.divisi || r.user?.bidang || "Pengurus"}</td>
                          <td className="p-3 font-mono">
                            {r.check_in_time
                              ? new Date(r.check_in_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
                              : "—"}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                r.status === "HADIR"
                                  ? "default"
                                  : r.status === "TERLAMBAT"
                                  ? "secondary"
                                  : r.status === "IZIN"
                                  ? "outline"
                                  : r.status === "ALFA"
                                  ? "destructive"
                                  : "ghost"
                              }
                              className="text-[10px] font-bold"
                            >
                              {r.status}
                            </Badge>
                            {r.is_manual && <span className="ml-1.5 text-[9px] text-muted-foreground font-mono">(Manual)</span>}
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px]"
                                onClick={() => {
                                  setOverrideUser(r);
                                  setOverrideStatus(r.status);
                                }}
                              >
                                Ubah Status
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Live Kehadiran */}
        <TabsContent value="live">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Radio className="h-4 w-4 text-rose-500 animate-pulse" /> Live Kehadiran Realtime Feed
                </CardTitle>
                <CardDescription>
                  Tampilan kehadiran terkini yang ter-update otomatis dari hasil scan QR Code.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {stats.hadir + stats.terlambat} / {stats.total} Masuk
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fullAttendanceRows
                  .filter((r) => r.status === "HADIR" || r.status === "TERLAMBAT")
                  .sort((a, b) => new Date(b.check_in_time || 0).getTime() - new Date(a.check_in_time || 0).getTime())
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card/60 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {r.user?.full_name?.[0] || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{r.user?.full_name}</div>
                          <div className="text-xs text-muted-foreground">{r.user?.position}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={r.status === "HADIR" ? "default" : "secondary"}>{r.status}</Badge>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString("id-ID") : ""}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Persetujuan Izin */}
        <TabsContent value="izin">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Daftar Pengajuan Izin Peserta</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveRequests?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">Tidak ada pengajuan izin.</div>
              ) : (
                <div className="space-y-3">
                  {leaveRequests?.map((l) => {
                    const applicant = profilesMap?.[l.user_id];
                    return (
                      <div key={l.id} className="p-4 rounded-lg border flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-sm">{applicant?.full_name || "Pengurus"}</div>
                          <div className="text-xs text-muted-foreground">Alasan: <span className="font-semibold text-foreground">{l.reason_type}</span></div>
                          {l.notes && <div className="text-xs italic mt-1 text-muted-foreground">"{l.notes}"</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={l.status === "DISETUJUI" ? "default" : l.status === "DITOLAK" ? "destructive" : "outline"}>
                            {l.status}
                          </Badge>
                          {isAdmin && l.status === "IZIN MENUNGGU PERSETUJUAN" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleReviewLeave(l.id, l.user_id, true)}
                              >
                                Terima Izin
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8"
                                onClick={() => handleReviewLeave(l.id, l.user_id, false)}
                              >
                                Tolak Izin
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Notulen Rapat */}
        <TabsContent value="notulen">
          <NotulenWorkspace meetingId={meetingId} initialMinutes={minutes} onSave={refetchMinutes} />
        </TabsContent>

        {/* Tab 5: Keputusan & Action Items */}
        <TabsContent value="keputusan">
          <DecisionsWorkspace meetingId={meetingId} profiles={profilesMap} />
        </TabsContent>

        {/* Tab 6: Rekap & Export */}
        <TabsContent value="rekap">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Ekspor Rekap Kehadiran Rapat</CardTitle>
              <CardDescription>
                Unduh rekap resmi lengkap dengan Kop Surat GEN-CB dan kolom tanda tangan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                onClick={() => exportRekapPdf(meeting, fullAttendanceRows, org)}
                className="gap-2 bg-primary"
              >
                <FileText className="h-4 w-4" /> Download Rekap PDF (Kop GEN-CB)
              </Button>
              <Button
                variant="outline"
                onClick={() => exportRekapExcel(meeting, fullAttendanceRows)}
                className="gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                <FileSpreadsheet className="h-4 w-4" /> Download Excel / CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.print()}
                className="gap-2"
              >
                <Printer className="h-4 w-4" /> Cetak Halaman (Print)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Audit Log */}
        {isAdmin && (
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Audit Log Perubahan Kehadiran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditLogs?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">Belum ada catatan perubahan manual.</div>
                  ) : (
                    auditLogs?.map((log) => (
                      <div key={log.id} className="p-3 border rounded-md text-xs space-y-0.5">
                        <div className="flex items-center justify-between font-bold">
                          <span>Admin: {log.changed_by_name}</span>
                          <span className="text-muted-foreground font-mono">{new Date(log.created_at).toLocaleString("id-ID")}</span>
                        </div>
                        <div>
                          Status diubah dari <Badge variant="outline">{log.prev_status}</Badge> ➔ <Badge>{log.new_status}</Badge>
                        </div>
                        <div className="text-muted-foreground italic">Alasan: "{log.reason}"</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Override Modal */}
        {overrideUser && (
          <Dialog open={!!overrideUser} onOpenChange={() => setOverrideUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ubah Status Kehadiran Manual</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2 text-xs">
                <div>Pengurus: <span className="font-bold">{overrideUser.user?.full_name}</span></div>
                <div className="space-y-1">
                  <Label>Pilih Status Baru</Label>
                  <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HADIR">🟢 HADIR</SelectItem>
                      <SelectItem value="TERLAMBAT">🟡 TERLAMBAT</SelectItem>
                      <SelectItem value="IZIN">🔵 IZIN</SelectItem>
                      <SelectItem value="ALFA">🔴 ALFA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Alasan Perubahan (Audit Log Wajib) <span className="text-destructive">*</span></Label>
                  <Input
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Contoh: Konfirmasi via WA / Lupa bawa HP"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOverrideUser(null)}>Batal</Button>
                <Button onClick={handleManualOverride}>Simpan Perubahan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Clone Modal */}
        <Dialog open={cloneOpen} onOpenChange={setCloneOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Duplikasi / Clone Rapat</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <p>Seluruh judul, agenda, lokasi, dan daftar peserta akan diduplikasi ke rapat baru.</p>
              <div className="space-y-1">
                <Label>Pilih Tanggal Rapat Baru</Label>
                <Input type="date" value={cloneDate} onChange={(e) => setCloneDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloneOpen(false)}>Batal</Button>
              <Button onClick={handleCloneMeeting}>Proses Duplikasi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}

// Subcomponents for Notulen & Decisions
function NotulenWorkspace({
  meetingId,
  initialMinutes,
  onSave,
}: {
  meetingId: string;
  initialMinutes: MeetingMinutes | null;
  onSave: () => void;
}) {
  const { user } = useAuth();
  const [topics, setTopics] = useState(initialMinutes?.topics || "");
  const [problems, setProblems] = useState(initialMinutes?.problems || "");
  const [suggestions, setSuggestions] = useState(initialMinutes?.suggestions || "");
  const [conclusions, setConclusions] = useState(initialMinutes?.conclusions || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialMinutes) {
      setTopics(initialMinutes.topics || "");
      setProblems(initialMinutes.problems || "");
      setSuggestions(initialMinutes.suggestions || "");
      setConclusions(initialMinutes.conclusions || "");
    }
  }, [initialMinutes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (initialMinutes) {
        await supabase
          .from("meeting_minutes")
          .update({
            topics,
            problems,
            suggestions,
            conclusions,
            updated_by: user?.full_name || "Admin",
          })
          .eq("id", initialMinutes.id);
      } else {
        await supabase.from("meeting_minutes").insert({
          meeting_id: meetingId,
          topics,
          problems,
          suggestions,
          conclusions,
          updated_by: user?.full_name || "Admin",
        });
      }
      toast.success("Notulen rapat berhasil disimpan!");
      onSave();
    } catch (e) {
      toast.error("Gagal menyimpan notulen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold">Pencatatan Notulen Rapat</CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Simpan Notulen
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">1. Pokok Pembahasan</Label>
          <Textarea rows={3} value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Topik pembahasan utama..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">2. Permasalahan & Tantangan</Label>
          <Textarea rows={3} value={problems} onChange={(e) => setProblems(e.target.value)} placeholder="Permasalahan yang diangkat..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">3. Pendapat / Saran Peserta</Label>
          <Textarea rows={3} value={suggestions} onChange={(e) => setSuggestions(e.target.value)} placeholder="Masukan dan usulan dari peserta rapat..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">4. Kesimpulan Akhir</Label>
          <Textarea rows={3} value={conclusions} onChange={(e) => setConclusions(e.target.value)} placeholder="Kesimpulan resmi rapat..." />
        </div>
      </CardContent>
    </Card>
  );
}

function DecisionsWorkspace({
  meetingId,
  profiles,
}: {
  meetingId: string;
  profiles?: Record<string, Profile>;
}) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskUser, setTaskUser] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks, refetch } = useQuery({
    queryKey: ["meeting_tasks", meetingId],
    queryFn: async () => {
      const { data } = await supabase.from("meeting_tasks").select("*").eq("meeting_id", meetingId);
      return (data || []) as MeetingTask[];
    },
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setAddingTask(true);
    try {
      const p = profiles?.[taskUser];
      await supabase.from("meeting_tasks").insert({
        meeting_id: meetingId,
        title: taskTitle,
        user_id: taskUser || null,
        user_name: p?.full_name || "",
        deadline: taskDeadline || null,
        status: "Belum Selesai",
      });
      toast.success("Action item berhasil ditambahkan");
      setTaskTitle("");
      refetch();
    } catch (e) {
      toast.error("Gagal menambah tugas");
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Selesai" ? "Belum Selesai" : "Selesai";
    await supabase.from("meeting_tasks").update({ status: nextStatus }).eq("id", taskId);
    refetch();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Tambah Action Item / Tugas Hasil Keputusan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="grid gap-3 sm:grid-cols-4">
            <Input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Judul Tugas / Keputusan..."
              className="sm:col-span-2"
              required
            />
            <Select value={taskUser} onValueChange={setTaskUser}>
              <SelectTrigger><SelectValue placeholder="Pilih PIC" /></SelectTrigger>
              <SelectContent>
                {Object.values(profiles || {}).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={addingTask}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Tugas
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Daftar Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks?.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Belum ada action item.</div>
            ) : (
              tasks?.map((t) => (
                <div key={t.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant={t.status === "Selesai" ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => handleToggleTaskStatus(t.id, t.status)}
                    >
                      {t.status === "Selesai" ? "✓ Selesai" : "Tandai Selesai"}
                    </Button>
                    <div>
                      <div className={`text-sm font-bold ${t.status === "Selesai" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                      <div className="text-xs text-muted-foreground">PIC: <span className="font-semibold text-foreground">{t.user_name || "—"}</span></div>
                    </div>
                  </div>
                  <Badge variant={t.status === "Selesai" ? "default" : "secondary"}>{t.status}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
