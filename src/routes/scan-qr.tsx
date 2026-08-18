import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { calculateAttendanceStatus } from "@/lib/rapat";
import type { Meeting, Profile, AttendanceStatus } from "@/lib/rapat.types";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  Search,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/scan-qr")({
  head: () => ({ meta: [{ title: "Scan QR Kehadiran — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <AdminScanQrPage />
    </RequireAuth>
  ),
});

type ScanResult = {
  participantId: string;
  meetingId: string;
  userId: string;
  user: Profile;
  meeting: Meeting;
  qrToken: string;
  existingStatus?: string;
  existingCheckIn?: string;
  calculatedStatus: AttendanceStatus;
  scanTime: Date;
};

function AdminScanQrPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("ALL");
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Video element ref for camera preview
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch Active Meetings
  const { data: activeMeetings } = useQuery({
    queryKey: ["active_meetings_scan"],
    queryFn: async () => {
      const { data } = await supabase
        .from("meetings")
        .select("*")
        .order("meeting_date", { ascending: false });
      return (data || []) as Meeting[];
    },
  });

  // Start Camera
  const startCamera = async () => {
    try {
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      toast.error("Tidak dapat mengakses kamera: " + (e as Error).message);
      setScanning(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Process Token Lookup (from camera scan or manual text input)
  const processTokenLookup = async (token: string) => {
    if (!token.trim()) return;

    try {
      // 1. Fetch Participant Record by Token
      const { data: part, error: pErr } = await supabase
        .from("meeting_participants")
        .select("*")
        .eq("qr_token", token.trim())
        .maybeSingle();

      if (pErr || !part) {
        return toast.error("QR Code tidak valid atau tidak terdaftar di sistem");
      }

      // 2. Fetch Meeting details
      const { data: mData } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", part.meeting_id)
        .single();

      if (!mData) return toast.error("Data rapat tidak ditemukan");

      if (mData.is_closed) {
        return toast.error("Rapat ini sudah ditutup. Registrasi kehadiran dikunci.");
      }

      // 3. Fetch User profile
      const { data: uData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", part.user_id)
        .single();

      if (!uData) return toast.error("Data pengurus tidak ditemukan");

      // 4. Check existing attendance record
      const { data: att } = await supabase
        .from("attendance")
        .select("*")
        .eq("meeting_id", part.meeting_id)
        .eq("user_id", part.user_id)
        .maybeSingle();

      const now = new Date();
      const calcStatus = calculateAttendanceStatus(now, mData as Meeting);

      const result: ScanResult = {
        participantId: part.id,
        meetingId: part.meeting_id,
        userId: part.user_id,
        user: uData as Profile,
        meeting: mData as Meeting,
        qrToken: part.qr_token,
        existingStatus: att?.status,
        existingCheckIn: att?.check_in_time ?? undefined,
        calculatedStatus: calcStatus,
        scanTime: now,
      };

      setScanResult(result);
    } catch (err) {
      toast.error("Gagal melakukan verifikasi QR: " + (err as Error).message);
    }
  };

  // Confirm Attendance
  const handleConfirmAttendance = async () => {
    if (!scanResult) return;
    setConfirming(true);

    try {
      const { error } = await supabase
        .from("attendance")
        .upsert({
          meeting_id: scanResult.meetingId,
          user_id: scanResult.userId,
          status: scanResult.calculatedStatus,
          check_in_time: scanResult.scanTime.toISOString(),
          scanned_by: user?.full_name || "Admin",
          is_manual: false,
        }, { onConflict: "meeting_id,user_id" });

      if (error) throw error;

      toast.success(`✅ Kehadiran ${scanResult.user.full_name} (${scanResult.calculatedStatus}) Berhasil Dicatat!`);
      setScanResult(null);
      setManualToken("");
      queryClient.invalidateQueries({ queryKey: ["attendance", scanResult.meetingId] });
    } catch (e) {
      toast.error("Gagal mengonfirmasi absensi: " + (e as Error).message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/rapat">
            <ChevronLeft className="h-4 w-4 mr-1" /> Modul Rapat
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <QrCode className="h-7 w-7 text-primary" /> Admin Camera QR Scanner
          </h1>
          <p className="text-sm text-muted-foreground">
            Arahkan kamera HP ke QR Code peserta untuk mencatat presensi kehadiran secara cepat.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Box */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Camera Scanner</span>
              {scanning && <Badge variant="default" className="animate-pulse bg-emerald-600 text-[10px]">Kamera Aktif</Badge>}
            </CardTitle>
            <CardDescription className="text-xs">
              Optimasi penuh untuk layar HP & Desktop dengan validasi instan server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center border-2 border-primary/30">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline />
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black/80 space-y-3">
                  <QrCode className="h-12 w-12 text-primary opacity-60" />
                  <p className="text-xs text-muted-foreground">Klik tombol di bawah untuk mengaktifkan Kamera HP.</p>
                  <Button onClick={startCamera} className="gap-2">
                    <Camera className="h-4 w-4" /> Buka Kamera HP
                  </Button>
                </div>
              )}
              {scanning && (
                <div className="absolute inset-0 border-2 border-primary/60 m-8 rounded-lg pointer-events-none animate-pulse flex items-center justify-center">
                  <div className="w-full h-0.5 bg-primary/80 animate-bounce" />
                </div>
              )}
            </div>

            {scanning && (
              <Button variant="outline" size="sm" onClick={stopCamera} className="w-full text-xs">
                Matikan Kamera
              </Button>
            )}

            {/* Manual Token Fallback */}
            <div className="border-t pt-4 space-y-2">
              <Label className="text-xs font-bold">Input Token Manual (Cari / Tempel Token QR):</Label>
              <div className="flex gap-2">
                <Input
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Contoh: GEN-CB-QR-..."
                  className="text-xs font-mono"
                  onKeyDown={(e) => e.key === "Enter" && processTokenLookup(manualToken)}
                />
                <Button size="sm" onClick={() => processTokenLookup(manualToken)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scan Verification Result Panel */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> Hasil Verifikasi QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!scanResult ? (
              <div className="h-64 border border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <QrCode className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-xs">Scan QR Code peserta atau masukkan token manual untuk menampilkan info peserta di sini.</p>
              </div>
            ) : scanResult.existingStatus && (scanResult.existingStatus === "HADIR" || scanResult.existingStatus === "TERLAMBAT") ? (
              /* Already Scanned Warning */
              <div className="p-4 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <AlertTriangle className="h-5 w-5" /> ⚠️ Peserta Sudah Melakukan Absensi
                </div>

                <div className="space-y-1.5 text-xs text-foreground">
                  <div>Nama: <span className="font-bold">{scanResult.user.full_name}</span></div>
                  <div>Jabatan: <span className="font-semibold">{scanResult.user.position}</span></div>
                  <div>Rapat: <span className="font-semibold">{scanResult.meeting.title}</span></div>
                  <div>Waktu Masuk: <span className="font-mono">{scanResult.existingCheckIn ? new Date(scanResult.existingCheckIn).toLocaleTimeString("id-ID") : "-"} WIB</span></div>
                  <div>Status Terdaftar: <Badge variant="secondary">{scanResult.existingStatus}</Badge></div>
                </div>

                <Button variant="outline" size="sm" onClick={() => setScanResult(null)} className="w-full text-xs mt-2">
                  Scan Peserta Lain
                </Button>
              </div>
            ) : (
              /* Valid New Scan Confirmation */
              <div className="p-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" /> ✅ QR Valid — Siap Konfirmasi
                </div>

                <div className="space-y-2 text-xs border-y border-emerald-500/20 py-3">
                  <div><span className="text-muted-foreground">Nama Peserta:</span> <div className="font-black text-sm text-foreground">{scanResult.user.full_name}</div></div>
                  <div><span className="text-muted-foreground">Jabatan / Divisi:</span> <div className="font-semibold text-foreground">{scanResult.user.position} · {scanResult.user.divisi || scanResult.user.bidang || "Pengurus"}</div></div>
                  <div><span className="text-muted-foreground">Rapat:</span> <div className="font-semibold text-foreground">{scanResult.meeting.title}</div></div>
                  <div><span className="text-muted-foreground">Waktu Scan:</span> <div className="font-mono text-foreground font-bold">{scanResult.scanTime.toLocaleTimeString("id-ID")} WIB</div></div>
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-muted-foreground">Status Otomatis:</span>
                    <Badge variant={scanResult.calculatedStatus === "HADIR" ? "default" : "secondary"} className="text-xs font-bold px-2 py-0.5">
                      {scanResult.calculatedStatus}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setScanResult(null)} className="w-1/3 text-xs">
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmAttendance}
                    disabled={confirming}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Konfirmasi Kehadiran
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
