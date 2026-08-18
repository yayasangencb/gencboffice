import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateQrToken } from "@/lib/rapat";
import type { Profile } from "@/lib/rapat.types";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Loader2,
  Sparkles,
  CheckSquare,
  Square,
  ChevronLeft,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rapat/baru")({
  head: () => ({ meta: [{ title: "Buat Rapat Baru — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <BuatRapatPage />
    </RequireAuth>
  ),
});

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function BuatRapatPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Rapat Pengurus");
  const [description, setDescription] = useState("");
  const [agenda, setAgenda] = useState("");
  const [meetingDate, setMeetingDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:30");
  const [attendanceOpen, setAttendanceOpen] = useState("08:30");
  const [onTimeUntil, setOnTimeUntil] = useState("09:15");
  const [attendanceClose, setAttendanceClose] = useState("10:00");
  const [location, setLocation] = useState("Aula Desa Sasak Panjang");
  const [tagline, setTagline] = useState("Bersama merencanakan kegiatan, bersama mewujudkan prestasi.");
  const [picName, setPicName] = useState("");
  const [leaderName, setLeaderName] = useState("Edi Mulyadi");
  const [notulisName, setNotulisName] = useState("Muhammad Raditya Anwar");
  const [submitting, setSubmitting] = useState(false);

  // Participant selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bidangFilter, setBidangFilter] = useState("ALL");
  const [divisiFilter, setDivisiFilter] = useState("ALL");

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const dayName = useMemo(() => {
    if (!meetingDate) return "Sabtu";
    const d = new Date(meetingDate);
    if (isNaN(d.getTime())) return "Sabtu";
    return DAYS[d.getDay()];
  }, [meetingDate]);

  const uniqueBidang = useMemo(() => {
    const set = new Set<string>();
    (profiles || []).forEach((p) => {
      if (p.bidang) set.add(p.bidang);
    });
    return Array.from(set);
  }, [profiles]);

  const uniqueDivisi = useMemo(() => {
    const set = new Set<string>();
    (profiles || []).forEach((p) => {
      if (p.divisi) set.add(p.divisi);
    });
    return Array.from(set);
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const list = profiles || [];
    return list.filter((p) => {
      if (bidangFilter !== "ALL" && p.bidang !== bidangFilter) return false;
      if (divisiFilter !== "ALL" && p.divisi !== divisiFilter) return false;
      return true;
    });
  }, [profiles, bidangFilter, divisiFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = (profiles || []).map((p) => p.id);
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectBidang = (bName: string) => {
    const targetIds = (profiles || []).filter((p) => p.bidang === bName).map((p) => p.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...targetIds])));
    toast.info(`Anggota ${bName} otomatis terpilih sebagai peserta`);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Judul rapat wajib diisi");
    if (!meetingDate || !startTime) return toast.error("Tanggal dan jam mulai wajib diisi");
    if (selectedUserIds.length === 0) return toast.error("Pilih minimal 1 peserta rapat");

    setSubmitting(true);
    try {
      // 1. Insert Meeting Record
      const { data: meeting, error: mErr } = await supabase
        .from("meetings")
        .insert({
          title,
          category,
          description,
          agenda,
          meeting_date: meetingDate,
          day_name: dayName,
          start_time: startTime,
          end_time: endTime,
          attendance_open_at: attendanceOpen,
          on_time_until: onTimeUntil,
          attendance_close_at: attendanceClose,
          location,
          tagline,
          pic_name: picName,
          leader_name: leaderName,
          notulis_name: notulisName,
          status: "Akan Datang",
          is_closed: false,
        })
        .select("*")
        .single();

      if (mErr) throw mErr;
      const meetingId = meeting.id;

      // 2. Generate Unique Participant QR Tokens & Insert Participants
      const participantRows = selectedUserIds.map((userId) => ({
        meeting_id: meetingId,
        user_id: userId,
        qr_token: generateQrToken(meetingId, userId),
        invitation_status: "WAJIB HADIR",
      }));

      const { error: pErr } = await supabase
        .from("meeting_participants")
        .insert(participantRows);
      if (pErr) throw pErr;

      // 3. Create Initial Attendance Rows (Default 'Belum Hadir')
      const attendanceRows = selectedUserIds.map((userId) => ({
        meeting_id: meetingId,
        user_id: userId,
        status: "Belum Hadir",
      }));

      await supabase.from("attendance").insert(attendanceRows);

      toast.success("Rapat baru berhasil dibuat dengan QR Code peserta unik!");
      navigate({ to: "/rapat/$id", params: { id: meetingId } });
    } catch (err) {
      toast.error("Gagal membuat rapat: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const isAllSelected = (profiles || []).length > 0 && selectedUserIds.length === (profiles || []).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/rapat">
            <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" /> Buat Rapat Baru
          </h1>
          <p className="text-sm text-muted-foreground">
            Isi formulir rapat internal GEN-CB dan tentukan peserta serta batas absensi.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Rapat */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Informasi Utama Rapat
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nama / Judul Rapat <span className="text-destructive">*</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Pembahasan Lomba Tenis Meja"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kategori Rapat</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
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
            </div>

            <div className="space-y-1.5">
              <Label>Hari (Otomatis)</Label>
              <Input value={dayName} disabled className="bg-muted font-bold" />
            </div>

            <div className="space-y-1.5">
              <Label>Tanggal Rapat <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Jam Mulai</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Jam Selesai</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Lokasi Rapat</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Aula Desa Sasak Panjang"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Kutipan / Tagline (Untuk Flayer)</Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Bersama merencanakan kegiatan, bersama mewujudkan prestasi."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Deskripsi / Pembahasan</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ringkasan latar belakang atau pembahasan rapat..."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Agenda Rapat</Label>
              <Textarea
                rows={3}
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="1. Pembukaan&#10;2. Laporan Divisi&#10;3. Pembahasan Anggaran&#10;4. Penutup"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Pimpinan Rapat</Label>
              <Input value={leaderName} onChange={(e) => setLeaderName(e.target.value)} placeholder="Nama Pimpinan" />
            </div>

            <div className="space-y-1.5">
              <Label>Notulis Rapat</Label>
              <Input value={notulisName} onChange={(e) => setNotulisName(e.target.value)} placeholder="Nama Notulis" />
            </div>
          </CardContent>
        </Card>

        {/* Batas Absensi (Attendance Windows) */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Pengaturan Batas Absensi (Waktu Scan)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  1. Absensi Dibuka
                </Label>
                <Input type="time" value={attendanceOpen} onChange={(e) => setAttendanceOpen(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Scan sebelum jam ini belum dapat diproses.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  2. Batas Hadir Normal (On-Time)
                </Label>
                <Input type="time" value={onTimeUntil} onChange={(e) => setOnTimeUntil(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Scan hingga jam ini tercatat 🟢 HADIR.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-rose-700 dark:text-rose-400">
                  3. Batas Absensi (Tutup)
                </Label>
                <Input type="time" value={attendanceClose} onChange={(e) => setAttendanceClose(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Scan sesudah jam ini dianggap 🔴 ALFA.</p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1 font-mono text-muted-foreground">
              <div className="font-bold text-foreground">Sistem Aturan Otomatis:</div>
              <div>• Scan <span className="text-emerald-600 font-bold">{attendanceOpen} – {onTimeUntil}</span> ➔ 🟢 HADIR</div>
              <div>• Scan <span className="text-amber-600 font-bold">{onTimeUntil} – {attendanceClose}</span> ➔ 🟡 TERLAMBAT</div>
              <div>• Belum scan setelah <span className="text-rose-600 font-bold">{attendanceClose}</span> & tanpa Izin ➔ 🔴 ALFA</div>
            </div>
          </CardContent>
        </Card>

        {/* Pilih Peserta Rapat */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Pilih Peserta Rapat ({selectedUserIds.length} Terpilih)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Setiap peserta terpilih akan mendapatkan QR Code unik pribadi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(!isAllSelected)}
              >
                {isAllSelected ? <CheckSquare className="h-4 w-4 mr-1 text-primary" /> : <Square className="h-4 w-4 mr-1" />}
                {isAllSelected ? "Batalkan Semua" : "Pilih Semua"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Bidang Selectors */}
            {uniqueBidang.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Pilih Cepat Berdasarkan Bidang:</Label>
                <div className="flex flex-wrap gap-2">
                  {uniqueBidang.map((bName) => (
                    <Button
                      key={bName}
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleSelectBidang(bName)}
                    >
                      + {bName}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t">
              <Select value={bidangFilter} onValueChange={setBidangFilter}>
                <SelectTrigger><SelectValue placeholder="Filter Bidang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Bidang</SelectItem>
                  {uniqueBidang.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={divisiFilter} onValueChange={setDivisiFilter}>
                <SelectTrigger><SelectValue placeholder="Filter Divisi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Divisi</SelectItem>
                  {uniqueDivisi.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Checkbox List */}
            {loadingProfiles ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 max-h-80 overflow-y-auto pr-1">
                {filteredProfiles.map((p) => {
                  const selected = selectedUserIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition ${
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleUser(p.id)}
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="font-bold text-foreground truncate">{p.full_name}</div>
                        <div className="text-muted-foreground truncate">
                          {p.position} · {p.bidang || p.divisi || "Pengurus"}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/rapat" })}>
            Batal
          </Button>
          <Button type="submit" disabled={submitting} className="min-w-[180px]">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Simpan & Buat Rapat
          </Button>
        </div>
      </form>
    </div>
  );
}
