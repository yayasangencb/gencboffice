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
  XCircle,
  Clock,
  History,
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

type RecentScanLog = {
  id: string;
  name: string;
  position: string;
  status: AttendanceStatus;
  meetingTitle: string;
  scanTimeStr: string;
  isDuplicate: boolean;
};

// Play audio beep sound on successful scan
function playScanSound(isDuplicate = false) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isDuplicate) {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 warning tone
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 tone
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {}
}

function AdminScanQrPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("ALL");
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastScannedToken, setLastScannedToken] = useState<string>("");
  const [recentLogs, setRecentLogs] = useState<RecentScanLog[]>([]);
  const [processing, setProcessing] = useState(false);

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

  // Process Instant Auto Check-In by Token
  const processTokenInstant = useCallback(
    async (token: string) => {
      const cleanToken = token.trim();
      if (!cleanToken || processing) return;

      setProcessing(true);
      try {
        // 1. Fetch Participant Record by Token
        const { data: part, error: pErr } = await supabase
          .from("meeting_participants")
          .select("*")
          .eq("qr_token", cleanToken)
          .maybeSingle();

        if (pErr || !part) {
          playScanSound(true);
          toast.error("❌ QR Code tidak terdaftar di sistem", { duration: 2500 });
          setLastScannedToken(cleanToken);
          setProcessing(false);
          return;
        }

        // 2. Fetch Meeting details
        const { data: mData } = await supabase
          .from("meetings")
          .select("*")
          .eq("id", part.meeting_id)
          .single();

        if (!mData) {
          toast.error("❌ Data rapat tidak ditemukan", { duration: 2500 });
          setProcessing(false);
          return;
        }

        if (mData.is_closed) {
          playScanSound(true);
          toast.error("❌ Rapat ini sudah ditutup. Presensi dikunci.", { duration: 2500 });
          setProcessing(false);
          return;
        }

        // 3. Fetch User profile
        const { data: uData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", part.user_id)
          .single();

        if (!uData) {
          toast.error("❌ Data pengurus tidak ditemukan", { duration: 2500 });
          setProcessing(false);
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
        const scanTimeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB";

        // If ALREADY CHECKED IN (HADIR or TERLAMBAT)
        if (att && (att.status === "HADIR" || att.status === "TERLAMBAT")) {
          playScanSound(true);
          if (navigator.vibrate) navigator.vibrate([150, 50, 150]);

          const checkInFormatted = att.check_in_time
            ? new Date(att.check_in_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB"
            : scanTimeStr;

          // SweetAlert style warning toast
          toast.warning(`⚠️ ${uData.full_name} Sudah Pernah Absensi!`, {
            description: `Status sebelumnya: ${att.status} (${checkInFormatted}) | Rapat: ${mData.title}`,
            duration: 3500,
          });

          setRecentLogs((prev) => [
            {
              id: Math.random().toString(),
              name: uData.full_name,
              position: uData.position || "Pengurus",
              status: att.status as AttendanceStatus,
              meetingTitle: mData.title,
              scanTimeStr: checkInFormatted,
              isDuplicate: true,
            },
            ...prev.slice(0, 4),
          ]);

          setLastScannedToken(cleanToken);
          setProcessing(false);
          return;
        }

        // If NEW INSTANT CHECK-IN
        const calcStatus = calculateAttendanceStatus(now, mData as Meeting);

        const { error: saveErr } = await supabase
          .from("attendance")
          .upsert(
            {
              meeting_id: part.meeting_id,
              user_id: part.user_id,
              status: calcStatus,
              check_in_time: now.toISOString(),
              scanned_by: user?.full_name || "Admin",
              is_manual: false,
            },
            { onConflict: "meeting_id,user_id" }
          );

        if (saveErr) throw saveErr;

        playScanSound(false);
        if (navigator.vibrate) navigator.vibrate([100]);

        // SweetAlert style success toast
        toast.success(`🟢 Presensi Berhasil: ${uData.full_name}`, {
          description: `Status: ${calcStatus} (${scanTimeStr}) | Rapat: ${mData.title}`,
          duration: 3500,
        });

        setRecentLogs((prev) => [
          {
            id: Math.random().toString(),
            name: uData.full_name,
            position: uData.position || "Pengurus",
            status: calcStatus,
            meetingTitle: mData.title,
            scanTimeStr,
            isDuplicate: false,
          },
          ...prev.slice(0, 4),
        ]);

        setLastScannedToken(cleanToken);
        setManualToken("");
        queryClient.invalidateQueries({ queryKey: ["attendance", part.meeting_id] });
      } catch (err) {
        toast.error("Gagal mencatat presensi: " + (err as Error).message);
      } finally {
        // Auto reset lock after 1.5 seconds for continuous scanning
        setTimeout(() => {
          setProcessing(false);
        }, 1500);
      }
    },
    [user?.full_name, processing, queryClient]
  );

  // Real-time Canvas Frame Scan Loop
  const tickScanLoop = useCallback(() => {
    if (!scanning || processing) {
      animFrameIdRef.current = requestAnimationFrame(tickScanLoop);
      return;
    }

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
          processTokenInstant(code.data);
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tickScanLoop);
  }, [scanning, processing, lastScannedToken, processTokenInstant]);

  useEffect(() => {
    if (scanning) {
      animFrameIdRef.current = requestAnimationFrame(tickScanLoop);
    }
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [scanning, tickScanLoop]);

  // Start Camera
  const startCamera = async () => {
    try {
      setScanning(true);
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
            <QrCode className="h-7 w-7 text-primary" /> Instant Auto Camera QR Scanner
          </h1>
          <p className="text-sm text-muted-foreground">
            Arahkan kamera ke QR Code peserta. Presensi otomatis tercatat instan tanpa perlu klik konfirmasi.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Camera Box */}
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" /> Camera Auto-Scanner
              </span>
              {scanning && (
                <Badge variant="default" className="animate-pulse bg-emerald-600 text-[10px]">
                  Kamera Aktif & Memindai
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Mendeteksi QR Code 30 FPS dan langsung menyimpan status HADIR ke database.
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

        {/* Live Logs & Manual Input */}
        <div className="space-y-4">
          {/* Recent Scans Live Feed */}
          <Card className="shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <History className="h-4 w-4 text-primary" /> Riwayat Presensi Instan (Terakhir)
              </CardTitle>
              {processing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                  <QrCode className="h-8 w-8 mx-auto mb-1 opacity-40" />
                  Belum ada QR Code yang di-scan pada sesi ini.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 animate-in fade-in ${
                      log.isDuplicate ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-foreground">{log.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{log.position} · {log.meetingTitle}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={log.isDuplicate ? "secondary" : "default"} className="text-[10px] font-bold">
                        {log.isDuplicate ? "SUDAH ABSEN" : log.status}
                      </Badge>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{log.scanTimeStr}</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

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
                onClick={() => processTokenInstant(manualToken)}
                disabled={!manualToken.trim() || processing}
                className="w-full"
                size="sm"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Verifikasi & Presensi Instan"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
