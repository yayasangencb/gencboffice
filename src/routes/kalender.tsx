import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatIdDate } from "@/lib/brand";
import type { Meeting } from "@/lib/rapat.types";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Loader2,
  Users,
  Sparkles,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/kalender")({
  head: () => ({ meta: [{ title: "Kalender Acara GEN-CB — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <KalenderPage />
    </RequireAuth>
  ),
});

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function KalenderPage() {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // Default Aug 2026 or today
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["calendar_meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .neq("status", "DITOLAK")
        .neq("status", "Dibatalkan")
        .order("meeting_date", { ascending: true });
      if (error) throw error;
      return (data || []) as Meeting[];
    },
  });

  // Map meetings by date (YYYY-MM-DD)
  const meetingsByDateMap = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    (meetings || []).forEach((m) => {
      if (!m.meeting_date) return;
      if (!map[m.meeting_date]) map[m.meeting_date] = [];
      map[m.meeting_date].push(m);
    });
    return map;
  }, [meetings]);

  // Calendar Grid Calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedDateEvents = useMemo(() => {
    if (!selectedDateStr) return [];
    return meetingsByDateMap[selectedDateStr] || [];
  }, [selectedDateStr, meetingsByDateMap]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" /> Kalender Acara GEN-CB
          </h1>
          <p className="text-sm text-muted-foreground">
            Jadwal kegiatan rapat dan acara resmi Yayasan Generasi Cerdas Beraksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Button asChild className="shadow-md">
              <Link to="/rapat/baru">
                <Plus className="h-4 w-4 mr-1.5" /> Buat Rapat (Admin)
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-primary text-primary shadow-xs">
              <Link to="/rapat/pengajuan">
                <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" /> Ajukan Pembuatan Rapat
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar Grid Container */}
        <Card className="md:col-span-2 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl font-bold">
              {MONTH_NAMES[month]} {year}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hari Ini
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Days Header */}
            <div className="grid grid-cols-7 text-center font-bold text-xs text-muted-foreground uppercase border-b pb-2">
              {DAY_NAMES.map((d) => (
                <div key={d} className={d === "Min" ? "text-rose-500" : ""}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            {isLoading ? (
              <div className="p-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty cells before month start */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-16 p-1 rounded-lg bg-muted/20" />
                ))}

                {/* Days of current month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const monthStr = String(month + 1).padStart(2, "0");
                  const dayStr = String(dayNum).padStart(2, "0");
                  const dateStr = `${year}-${monthStr}-${dayStr}`;

                  const eventsOnDay = meetingsByDateMap[dateStr] || [];
                  const hasEvents = eventsOnDay.length > 0;
                  const isSelected = selectedDateStr === dateStr;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`min-h-20 p-1.5 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/40 font-bold"
                          : hasEvents
                          ? "border-primary/40 bg-card hover:bg-primary/5"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${hasEvents ? "text-primary" : ""}`}>{dayNum}</span>
                        {hasEvents && (
                          <Badge variant="default" className="text-[9px] px-1 py-0 h-4 bg-primary">
                            {eventsOnDay.length}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 mt-1">
                        {eventsOnDay.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className="truncate text-[10px] p-1 rounded bg-primary/10 font-medium text-primary leading-tight"
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {eventsOnDay.length > 2 && (
                          <div className="text-[9px] text-muted-foreground font-semibold">
                            +{eventsOnDay.length - 2} lagi
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Events Sidebar */}
        <Card className="shadow-xs flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Detail Acara Tanggal
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-primary">
              {selectedDateStr ? formatIdDate(selectedDateStr) : "Pilih tanggal pada kalender untuk melihat acara"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 flex-1 overflow-y-auto">
            {!selectedDateStr ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Klik salah satu tanggal pada kalender di samping untuk melihat daftar rapat/acara resmi.
              </div>
            ) : selectedDateEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Tidak ada agenda rapat GEN-CB pada tanggal ini.
              </div>
            ) : (
              selectedDateEvents.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl border bg-card/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] text-primary">
                      {ev.category}
                    </Badge>
                    <Badge variant={ev.status === "Akan Datang" ? "default" : "secondary"} className="text-[10px]">
                      {ev.status}
                    </Badge>
                  </div>
                  <div className="font-bold text-sm leading-tight text-foreground">{ev.title}</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{ev.start_time}{ev.end_time ? " - " + ev.end_time : ""} WIB</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{ev.location || "Lokasi belum diatur"}</span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="secondary" className="w-full text-xs h-7 mt-1">
                    <Link to="/undangan/$id" params={{ id: ev.id }}>
                      Lihat Undangan & QR
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
