import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Meeting, AttendanceRow, Profile } from "@/lib/rapat.types";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  CalendarDays,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

export const Route = createFileRoute("/laporan-rapat")({
  head: () => ({ meta: [{ title: "Laporan Bulanan & Tahunan — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <LaporanRapatPage />
    </RequireAuth>
  ),
});

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function LaporanRapatPage() {
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["laporan_meetings"],
    queryFn: async () => {
      const { data } = await supabase.from("meetings").select("*");
      return (data || []) as Meeting[];
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ["laporan_attendance"],
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("*");
      return (data || []) as AttendanceRow[];
    },
  });

  const { data: profilesMap } = useQuery({
    queryKey: ["laporan_profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      const map: Record<string, Profile> = {};
      (data || []).forEach((p) => {
        map[p.id] = p as Profile;
      });
      return map;
    },
  });

  const filteredMeetings = useMemo(() => {
    const list = meetings || [];
    return list.filter((m) => {
      if (!m.meeting_date) return false;
      const d = new Date(m.meeting_date);
      if (d.getFullYear().toString() !== selectedYear) return false;
      if (selectedMonth !== "ALL") {
        const monthIdx = (d.getMonth() + 1).toString();
        if (monthIdx !== selectedMonth) return false;
      }
      return true;
    });
  }, [meetings, selectedYear, selectedMonth]);

  const meetingIdsSet = useMemo(() => new Set(filteredMeetings.map((m) => m.id)), [filteredMeetings]);

  const filteredAttendance = useMemo(() => {
    const list = attendance || [];
    return list.filter((a) => meetingIdsSet.has(a.meeting_id));
  }, [attendance, meetingIdsSet]);

  const stats = useMemo(() => {
    const mCount = filteredMeetings.length;
    const totalAtt = filteredAttendance.length;
    const hadir = filteredAttendance.filter((a) => a.status === "HADIR").length;
    const terlambat = filteredAttendance.filter((a) => a.status === "TERLAMBAT").length;
    const izin = filteredAttendance.filter((a) => a.status === "IZIN").length;
    const alfa = filteredAttendance.filter((a) => a.status === "ALFA").length;

    const avgRate = totalAtt > 0 ? Math.round(((hadir + terlambat) / totalAtt) * 100) : 0;

    // Active members ranking
    const userCountMap: Record<string, number> = {};
    filteredAttendance.forEach((a) => {
      if (a.status === "HADIR" || a.status === "TERLAMBAT") {
        userCountMap[a.user_id] = (userCountMap[a.user_id] || 0) + 1;
      }
    });

    const ranking = Object.entries(userCountMap)
      .map(([uId, count]) => ({
        user: profilesMap?.[uId],
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { mCount, totalAtt, hadir, terlambat, izin, alfa, avgRate, ranking };
  }, [filteredMeetings, filteredAttendance, profilesMap]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" /> Laporan Analitik Rapat
          </h1>
          <p className="text-sm text-muted-foreground">
            Rekap bulanan dan tahunan rapat, tingkat kehadiran rata-rata, serta pengurus paling aktif.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Bulan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Bulan</SelectItem>
              {MONTHS.map((m, idx) => (
                <SelectItem key={m} value={String(idx + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Tahun" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-bold">Jumlah Rapat</div>
            <div className="text-3xl font-black text-primary mt-1">{stats.mCount}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Periode Terpilih</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-bold">Rata-Rata Kehadiran</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">{stats.avgRate}%</div>
            <div className="text-[11px] text-muted-foreground mt-1">Hadir & Terlambat</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-bold">Total Izin</div>
            <div className="text-3xl font-black text-blue-600 mt-1">{stats.izin}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Pengajuan Disetujui</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-bold">Total Alfa</div>
            <div className="text-3xl font-black text-rose-600 mt-1">{stats.alfa}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Tanpa Keterangan</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Active Members Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Pengurus Paling Aktif (Top 5)
            </CardTitle>
            <CardDescription>Pengurus dengan jumlah kehadiran rapat terbanyak.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.ranking.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Belum ada data kehadiran.</div>
              ) : (
                stats.ranking.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-700 font-black flex items-center justify-center text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{item.user?.full_name || "Pengurus"}</div>
                        <div className="text-xs text-muted-foreground">{item.user?.position} · {item.user?.bidang}</div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-emerald-600">
                      {item.count} Rapat Hadir
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Breakdown Presensi Kehadiran</CardTitle>
            <CardDescription>Distribusi seluruh status absensi peserta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span>🟢 Hadir Tepat Waktu</span>
                <span>{stats.hadir}</span>
              </div>
              <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${stats.totalAtt ? (stats.hadir / stats.totalAtt) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span>🟡 Terlambat</span>
                <span>{stats.terlambat}</span>
              </div>
              <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${stats.totalAtt ? (stats.terlambat / stats.totalAtt) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span>🔵 Izin</span>
                <span>{stats.izin}</span>
              </div>
              <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${stats.totalAtt ? (stats.izin / stats.totalAtt) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span>🔴 Alfa</span>
                <span>{stats.alfa}</span>
              </div>
              <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full" style={{ width: `${stats.totalAtt ? (stats.alfa / stats.totalAtt) * 100 : 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
