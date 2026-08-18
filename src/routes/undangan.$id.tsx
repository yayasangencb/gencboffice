import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatIdDate, LOGO_URL } from "@/lib/brand";
import type { Meeting, AttendanceRow, LeaveRequest } from "@/lib/rapat.types";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  QrCode as QrIcon,
  Loader2,
  ChevronLeft,
  FileCheck2,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/undangan/$id")({
  head: () => ({ meta: [{ title: "Detail Undangan & QR Code — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <DetailUndanganPage />
    </RequireAuth>
  ),
});

function DetailUndanganPage() {
  const { id: meetingId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveReasonType, setLeaveReasonType] = useState("Sakit");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Fetch Meeting Data
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

  // Fetch Participant QR Token & Attendance
  const { data: participantData, isLoading: loadingParticipant } = useQuery({
    queryKey: ["participant_detail", meetingId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: part } = await supabase
        .from("meeting_participants")
        .select("qr_token")
        .eq("meeting_id", meetingId)
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: att } = await supabase
        .from("attendance")
        .select("status, check_in_time")
        .eq("meeting_id", meetingId)
        .eq("user_id", user.id)
        .maybeSingle();

      return {
        qrToken: part?.qr_token,
        status: att?.status || "Belum Hadir",
        checkInTime: att?.check_in_time,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch Existing Leave Request
  const { data: existingLeave, refetch: refetchLeave } = useQuery({
    queryKey: ["my_leave", meetingId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("meeting_id", meetingId)
        .eq("user_id", user.id)
        .maybeSingle();
      return (data || null) as LeaveRequest | null;
    },
    enabled: !!user?.id,
  });

  // Generate QR Code Image
  useEffect(() => {
    if (participantData?.qrToken) {
      QRCode.toDataURL(participantData.qrToken, { width: 300, margin: 2 }, (err, url) => {
        if (!err && url) setQrDataUrl(url);
      });
    }
  }, [participantData?.qrToken]);

  // Submit Leave Request
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmittingLeave(true);
    try {
      await supabase.from("leave_requests").insert({
        meeting_id: meetingId,
        user_id: user.id,
        reason_type: leaveReasonType,
        notes: leaveNotes,
        status: "IZIN MENUNGGU PERSETUJUAN",
      });

      toast.success("Pengajuan izin berhasil dikirim ke Admin!");
      setLeaveOpen(false);
      refetchLeave();
      queryClient.invalidateQueries({ queryKey: ["participant_detail", meetingId, user.id] });
    } catch (err) {
      toast.error("Gagal mengirim pengajuan izin");
    } finally {
      setSubmittingLeave(false);
    }
  };

  if (loadingMeeting || loadingParticipant || !meeting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const attStatus = participantData?.status || "Belum Hadir";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/undangan">
          <ChevronLeft className="h-4 w-4 mr-1" /> Kembali ke Undangan Saya
        </Link>
      </Button>

      <Card className="overflow-hidden border-2 shadow-lg">
        {/* Header Header Brand */}
        <div className="bg-gradient-to-r from-[#002B7F] via-[#0047B3] to-[#00A3FF] p-6 text-white text-center relative">
          <img src={LOGO_URL} alt="GEN-CB" className="h-16 w-16 mx-auto mb-2 object-contain bg-white/10 rounded-full p-2 backdrop-blur" />
          <h2 className="text-xl font-black uppercase tracking-wider">UNDANGAN RAPAT RESMI</h2>
          <p className="text-xs text-white/80">YAYASAN GENERASI CERDAS BERAKSI (GEN-CB)</p>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Status Badge Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/60 border">
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Status Kehadiran Anda</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    attStatus === "HADIR"
                      ? "default"
                      : attStatus === "TERLAMBAT"
                      ? "secondary"
                      : attStatus === "IZIN"
                      ? "outline"
                      : attStatus === "ALFA"
                      ? "destructive"
                      : "ghost"
                  }
                  className="text-sm font-bold px-3 py-1"
                >
                  {attStatus}
                </Badge>
                {existingLeave && (
                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                    {existingLeave.status}
                  </Badge>
                )}
              </div>
            </div>

            {attStatus === "Belum Hadir" && !existingLeave && (
              <Button variant="outline" size="sm" onClick={() => setLeaveOpen(true)}>
                <FileCheck2 className="h-4 w-4 mr-1.5 text-blue-600" /> Ajukan Izin
              </Button>
            )}
          </div>

          {/* Meeting Info */}
          <div className="space-y-3 border-b pb-6">
            <div>
              <Badge variant="outline" className="text-xs font-semibold text-primary mb-1">
                {meeting.category}
              </Badge>
              <h1 className="text-2xl font-black tracking-tight">{meeting.title}</h1>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                <span>{meeting.day_name ? meeting.day_name + ", " : ""}{formatIdDate(meeting.meeting_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>{meeting.start_time}{meeting.end_time ? " - " + meeting.end_time : ""} WIB</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>{meeting.location || "Lokasi belum diatur"}</span>
              </div>
            </div>

            {meeting.agenda && (
              <div className="mt-3 p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <div className="font-bold text-foreground">Agenda Rapat:</div>
                <div className="whitespace-pre-wrap text-muted-foreground">{meeting.agenda}</div>
              </div>
            )}
          </div>

          {/* User Info & Unique QR Code */}
          <div className="text-center space-y-4 pt-2">
            <div>
              <div className="text-xs text-muted-foreground">Undangan Terbit Untuk:</div>
              <div className="text-lg font-black text-foreground">{user?.full_name}</div>
              <div className="text-xs text-muted-foreground">{user?.position} · {user?.divisi || user?.bidang || "Pengurus"}</div>
            </div>

            {/* QR Code Container */}
            <div className="p-6 bg-white border-2 border-primary/20 rounded-2xl inline-block shadow-md max-w-[260px]">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code Absensi" className="w-full h-auto mx-auto" />
              ) : (
                <div className="h-48 w-48 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              )}
              <div className="text-[10px] font-mono text-muted-foreground mt-2 break-all">
                {participantData?.qrToken}
              </div>
            </div>

            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/20">
              💡 <strong>Petunjuk:</strong> Tunjukkan QR Code ini kepada Admin pada saat registrasi kehadiran di lokasi rapat. Status Anda akan tercatat otomatis secara presisi.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal Ajukan Izin */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan Izin Tidak Hadir Rapat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLeave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Alasan Izin</Label>
              <Select value={leaveReasonType} onValueChange={setLeaveReasonType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sakit">Sakit</SelectItem>
                  <SelectItem value="Ada kegiatan keluarga">Ada Kegiatan Keluarga</SelectItem>
                  <SelectItem value="Pekerjaan">Pekerjaan / Dinas</SelectItem>
                  <SelectItem value="Kuliah">Kuliah / Ujian</SelectItem>
                  <SelectItem value="Kegiatan lain">Kegiatan Lain</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Keterangan Tambahan</Label>
              <Textarea
                rows={3}
                value={leaveNotes}
                onChange={(e) => setLeaveNotes(e.target.value)}
                placeholder="Jelaskan alasan detail ketidakhadiran..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLeaveOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submittingLeave}>
                {submittingLeave ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                Kirim Pengajuan Izin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
