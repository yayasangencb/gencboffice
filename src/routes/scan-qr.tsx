import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { calculateAttendanceStatus } from "@/lib/rapat";
import type { Meeting, Profile, AttendanceStatus } from "@/lib/rapat.types";
import { useState, useRef, useEffect, useCallback } from "react";
import jsQR from "jsqr";
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
  RefreshCw,
  Volume2,
  XCircle,
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

// Play audio beep sound on successful scan
function playScanSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 tone
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function AdminScanQrPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("ALL");
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [lastScannedToken, setLastScannedToken] = useState<string>("");

  // Camera & Canvas Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

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

  // Process Token Lookup (from camera scan or manual text input)
  const processTokenLookup = useCallback(
    async (token: string) => {
      const cleanToken = token.trim();
      if (!cleanToken) return;

      try {
        // 1. Fetch Participant Record by Token
        const { data: part, error: pErr } = await supabase
          .from("meeting_participants")
          .select("*")
          .eq("qr_token", cleanToken)
          .maybeSingle();

        if (pErr || !part) {
          toast.error("QR Code tidak terdaftar di sistem");
          return;
        }

        // 2. Fetch Meeting details
        const { data: mData } = await supabase
          .from("meetings")
          .select("*")
          .eq("id", part.meeting_id)
          .single();

        if (!mData) {
          toast.error("Data rapat tidak ditemukan");
          return;
        }

        if (mData.is_closed) {
          toast.error("Rapat ini sudah ditutup. Registrasi dikunci.");
          return;
        }

        // 3. Fetch User profile
        const { data: uData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", part.user_id)
          .single();

        if (!uData) {
          toast.error("Data pengurus tidak ditemukan");
          return;
        }

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

        playScanSound();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        setScanResult(result);
        setLastScannedToken(cleanToken);
      } catch (err) {
        toast.error("Verifikasi QR gagal: " + (err as Error).message);
      }
    },
    []
  );

  // Real-time Canvas Frame Scan Loop
  const tickScanLoop = useCallback(() => {
    if (!scanning || scanResult) return;

    const video = videoRef.current;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && code.data !== lastScannedToken) {
          processTokenLookup(code.data);
          return; // pause scan tick until processed
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tickScanLoop);
  }, [scanning, scanResult, lastScannedToken, processTokenLookup]);

  useEffect(() => {
    if (scanning && !scanResult) {
      animFrameIdRef.current = requestAnimationFrame(tickScanLoop);
    }
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [scanning, scanResult, tickScanLoop]);

  // Start Camera
  const startCamera = async () => {
    try {
      setScanning(true);
      setScanResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      toast.error("Kamera HP/Desktop tidak dapat diakses: " + (e as Error).message);
      setScanning(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
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

  // Reset for next scan
  const handleResetForNextScan = () => {
    setScanResult(null);
    setManualToken("");
    setLastScannedToken("");
    if (scanning) {
      animFrameIdRef.current = requestAnimationFrame(tickScanLoop);
    }
  };

  // Confirm Attendance
  const handleConfirmAttendance = async () => {
    if (!scanResult) return;
    setConfirming(true);

    try {
      const { error } = await supabase
        .from("attendance")
        .upsert(
          {
            meeting_id: scanResult.meetingId,
            user_id: scanResult.userId,
            status: scanResult.calculatedStatus,
            check_in_time: scanResult.scanTime.toISOString(),
            scanned_by: user?.full_name || "Admin",
            is_manual: false,
          },
          { onConflict: "meeting_id,user_id" }
        );

      if (error) throw error;

      toast.success(`✅ Kehadiran ${scanResult.user.full_name} (${scanResult.calculatedStatus}) Berhasil Dicatat!`);
      queryClient.invalidateQueries({ queryKey: ["attendance", scanResult.meetingId] });
      handleResetForNextScan();
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
            Arahkan kamera HP ke QR Code peserta untuk mencatat presensi secara otomatis dan presisi.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Box */}
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" /> Camera Scanner HP & Desktop
              </span>
              {scanning && <Badge variant="default" className="animate-pulse bg-emerald-600 text-[10px]">Kamera Aktif</Badge>}
            </CardTitle>
            <CardDescription className="text-xs">
              Mendeteksi QR Code secara otomatis 30 FPS dan mengirimkan sinyal bunyi bip.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center border-2 border-primary/30 shadow-inner">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />

              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black/80 space-y-3">
                  <QrCode className="h-14 w-14 text-primary opacity-80 animate-bounce" />
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Klik tombol di bawah ini untuk menyalakan Kamera HP/Desktop Admin.
                  </p>
                  <Button onClick={startCamera} className="gap-2 shadow-lg bg-primary">
                    <Camera className="h-4 w-4" /> Buka Kamera HP
                  </Button>
                </div>
              )}

              {scanning && (
                <div className="absolute inset-0 border-2 border-emerald-400 m-8 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-ping" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              {scanning ? (
                <Button variant="outline" size="sm" onClick={stopCamera} className="w-full text-destructive border-destructive/40">
                  <XCircle className="h-4 w-4 mr-1.5" /> Matikan Kamera
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={startCamera} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Hidupkan Ulang Kamera
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scan Result & Manual Input */}
        <div className="space-y-4">
          {/* Result Card */}
          {scanResult ? (
            <Card className="border-2 border-primary shadow-lg bg-card animate-in fade-in">
              <CardHeader className="bg-primary/5 pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-bold text-primary">
                    Hasil Scan QR
                  </Badge>
                  <Badge
                    variant={
                      scanResult.calculatedStatus === "HADIR"
                        ? "default"
                        : scanResult.calculatedStatus === "TERLAMBAT"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-xs font-bold"
                  >
                    {scanResult.calculatedStatus}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-black mt-1">
                  {scanResult.user.full_name}
                </CardTitle>
                <CardDescription className="text-xs font-medium text-foreground/80">
                  {scanResult.user.position} · {scanResult.user.bidang || scanResult.user.divisi || "Pengurus"}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-muted/60 space-y-1">
                  <div className="font-bold text-foreground truncate">{scanResult.meeting.title}</div>
                  <div className="text-muted-foreground flex justify-between">
                    <span>Waktu Scan:</span>
                    <span className="font-mono font-bold text-foreground">
                      {scanResult.scanTime.toLocaleTimeString("id-ID")} WIB
                    </span>
                  </div>
                </div>

                {scanResult.existingStatus && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">⚠️ Peserta Sudah Melakukan Absensi!</div>
                      <div>
                        Status sebelumnya: <span className="font-bold">{scanResult.existingStatus}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleResetForNextScan}
                  >
                    Batal / Scan Lagi
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleConfirmAttendance}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Konfirmasi Hadir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed p-6 text-center text-muted-foreground space-y-2">
              <QrCode className="h-10 w-10 mx-auto text-primary opacity-50" />
              <div className="font-bold text-sm text-foreground">Menunggu Scan QR...</div>
              <p className="text-xs">
                Arahkan QR Code peserta ke area kamera atau masukkan kode token secara manual di bawah.
              </p>
            </Card>
          )}

          {/* Manual Input Fallback */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Search className="h-4 w-4 text-primary" /> Input Manual Kode Token QR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label>Kode Token QR</Label>
                <Input
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Contoh: GEN-CB-QR-..."
                  className="font-mono text-xs"
                />
              </div>

              <Button
                onClick={() => processTokenLookup(manualToken)}
                disabled={!manualToken.trim()}
                className="w-full"
                size="sm"
              >
                Cari & Verifikasi Token
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
