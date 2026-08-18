import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Meeting, AttendanceRow } from "@/lib/rapat.types";
import { formatIdDate } from "@/lib/brand";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/riwayat-kehadiran")({
  head: () => ({ meta: [{ title: "Riwayat Kehadiran — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <RiwayatKehadiranPage />
    </RequireAuth>
  ),
});

function RiwayatKehadiranPage() {
  const { user } = useAuth();

  const { data: myAttendance, isLoading } = useQuery({
    queryKey: ["my_history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: attList, error: aErr } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id);

      if (aErr || !attList || attList.length === 0) return [];

      const meetingIds = attList.map((a) => a.meeting_id);
      const { data: meetings } = await supabase
        .from("meetings")
        .select("*")
        .in("id", meetingIds)
        .order("meeting_date", { ascending: false });

      const mMap: Record<string, Meeting> = {};
      (meetings || []).forEach((m) => {
        mMap[m.id] = m as Meeting;
      });

      return attList.map((a) => ({
        att: a as AttendanceRow,
        meeting: mMap[a.meeting_id],
      }));
    },
    enabled: !!user?.id,
  });

  const stats = useMemo(() => {
    const list = myAttendance || [];
    const total = list.length;
    const hadir = list.filter((item) => item.att.status === "HADIR").length;
    const terlambat = list.filter((item) => item.att.status === "TERLAMBAT").length;
    const izin = list.filter((item) => item.att.status === "IZIN").length;
    const alfa = list.filter((item) => item.att.status === "ALFA").length;
    const percent = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 100;

    return { total, hadir, terlambat, izin, alfa, percent };
  }, [myAttendance]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <History className="h-7 w-7 text-primary" /> Riwayat Kehadiran Saya
        </h1>
        <p className="text-sm text-muted-foreground">
          Statistik kehadiran personal dan histori partisipasi dalam rapat organisasi.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Card className="bg-primary/10 border-primary/30 col-span-2 sm:col-span-1">
          <CardContent className="p-3 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Persentase</div>
            <div className="text-2xl font-black text-primary">{stats.percent}%</div>
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
      </div>

      {/* History Table */}
      {isLoading ? (
        <div className="p-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !myAttendance || myAttendance.length === 0 ? (
        <Card border-dashed className="p-12 text-center text-muted-foreground">
          <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Belum ada riwayat kehadiran rapat.
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Histori Rapat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">No</th>
                    <th className="p-3">Nama Rapat</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Waktu Presensi</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myAttendance.map((item, idx) => (
                    <tr key={item.att.id} className="hover:bg-muted/40 transition">
                      <td className="p-3 font-semibold">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-sm text-foreground">{item.meeting?.title || "Rapat Internal"}</div>
                        <div className="text-[11px] text-muted-foreground">{item.meeting?.category}</div>
                      </td>
                      <td className="p-3">
                        {item.meeting?.meeting_date ? formatIdDate(item.meeting.meeting_date) : "—"}
                      </td>
                      <td className="p-3 font-mono">
                        {item.att.check_in_time
                          ? new Date(item.att.check_in_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
                          : "—"}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            item.att.status === "HADIR"
                              ? "default"
                              : item.att.status === "TERLAMBAT"
                              ? "secondary"
                              : item.att.status === "IZIN"
                              ? "outline"
                              : item.att.status === "ALFA"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[10px] font-bold"
                        >
                          {item.att.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
