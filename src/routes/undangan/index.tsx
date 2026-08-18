import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatIdDate } from "@/lib/brand";
import type { Meeting, AttendanceRow } from "@/lib/rapat.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  MapPin,
  FileText,
  Loader2,
  ChevronRight,
  QrCode,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/undangan/")({
  head: () => ({ meta: [{ title: "Undangan Rapat Saya — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <UndanganListPage />
    </RequireAuth>
  ),
});

function UndanganListPage() {
  const { user } = useAuth();

  const { data: myMeetings, isLoading } = useQuery({
    queryKey: ["my_undangan", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // 1. Fetch user's participant records
      const { data: parts, error: pErr } = await supabase
        .from("meeting_participants")
        .select("meeting_id, qr_token, invitation_status")
        .eq("user_id", user.id);

      if (pErr) throw pErr;
      if (!parts || parts.length === 0) return [];

      const meetingIds = parts.map((p) => p.meeting_id);

      // 2. Fetch meetings
      const { data: meetings, error: mErr } = await supabase
        .from("meetings")
        .select("*")
        .in("id", meetingIds)
        .order("meeting_date", { ascending: false });

      if (mErr) throw mErr;

      // 3. Fetch attendance statuses
      const { data: attList } = await supabase
        .from("attendance")
        .select("meeting_id, status")
        .eq("user_id", user.id);

      const attMap: Record<string, string> = {};
      (attList || []).forEach((a) => {
        attMap[a.meeting_id] = a.status;
      });

      return (meetings || []).map((m) => ({
        meeting: m as Meeting,
        attStatus: attMap[m.id] || "Belum Hadir",
      }));
    },
    enabled: !!user?.id,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" /> Undangan Rapat Saya
        </h1>
        <p className="text-sm text-muted-foreground">
          Daftar rapat resmi GEN-CB yang mengundang Anda sebagai peserta wajib hadir.
        </p>
      </div>

      {isLoading ? (
        <div className="p-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !myMeetings || myMeetings.length === 0 ? (
        <Card border-dashed className="p-12 text-center text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Anda belum memiliki undangan rapat aktif saat ini.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myMeetings.map(({ meeting: m, attStatus }) => (
            <Card key={m.id} className="hover:shadow-md transition flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs font-semibold text-primary">
                    {m.category}
                  </Badge>
                  <Badge variant="default" className="text-xs bg-emerald-600">
                    WAJIB HADIR
                  </Badge>
                </div>
                <CardTitle className="text-lg font-black tracking-tight mt-1 line-clamp-2">
                  {m.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span>{m.day_name ? m.day_name + ", " : ""}{formatIdDate(m.meeting_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>{m.start_time}{m.end_time ? " - " + m.end_time : ""} WIB</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{m.location || "Lokasi belum diatur"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Status Kehadiran</span>
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
                      className="text-xs font-bold"
                    >
                      {attStatus}
                    </Badge>
                  </div>
                  <Button asChild size="sm" className="gap-1 shadow-xs">
                    <Link to="/undangan/$id" params={{ id: m.id }}>
                      Lihat Undangan & QR <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
