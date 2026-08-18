import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ChevronLeft, Loader2, CalendarDays, Clock, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rapat/pengajuan")({
  head: () => ({ meta: [{ title: "Pengajuan Rapat Baru — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <PengajuanRapatPage />
    </RequireAuth>
  ),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function PengajuanRapatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Rapat Pengurus");
  const [description, setDescription] = useState("");
  const [agenda, setAgenda] = useState("");
  const [meetingDate, setMeetingDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:30");
  const [location, setLocation] = useState("Aula Desa Sasak Panjang");
  const [tagline, setTagline] = useState("Bersama merencanakan kegiatan, bersama mewujudkan prestasi.");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Judul usulan rapat wajib diisi");
    if (!meetingDate || !startTime) return toast.error("Tanggal dan jam mulai wajib diisi");

    setSubmitting(true);
    try {
      // 1. Insert Meeting Proposal with status 'MENUNGGU PERSETUJUAN'
      const dayName = new Date(meetingDate).toLocaleDateString("id-ID", { weekday: "long" });

      const { data: newMeeting, error: mErr } = await supabase
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
          attendance_open_at: "08:30",
          on_time_until: "09:15",
          attendance_close_at: "10:00",
          location,
          tagline,
          pic_name: user?.full_name || "Pengurus",
          status: "MENUNGGU PERSETUJUAN",
          is_closed: false,
        })
        .select("*")
        .single();

      if (mErr) throw mErr;

      // 2. Notify Admin GEN-CB
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "ADMIN");

      if (adminProfiles && adminProfiles.length > 0) {
        const notifRows = adminProfiles.map((adm) => ({
          user_id: adm.id,
          meeting_id: newMeeting.id,
          title: "Pengajuan Rapat Baru",
          message: `${user?.full_name || "Pengurus"} mengajukan rapat: "${title}" untuk tanggal ${meetingDate}.`,
          type: "approval",
        }));
        await supabase.from("notifications").insert(notifRows);
      }

      toast.success("Usulan rapat berhasil dikirim! Menunggu persetujuan Admin GEN-CB.");
      navigate({ to: "/kalender" });
    } catch (err) {
      toast.error("Gagal mengirim pengajuan rapat: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/kalender">
          <ChevronLeft className="h-4 w-4 mr-1" /> Kembali ke Kalender
        </Link>
      </Button>

      <Card className="border-2 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" /> Pengajuan Pembuatan Rapat Baru
          </CardTitle>
          <CardDescription>
            Isi usulan agenda rapat internal GEN-CB. Pengajuan Anda akan ditinjau dan disetujui oleh Admin GEN-CB.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Judul / Nama Usulan Rapat <span className="text-destructive">*</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Persiapan Pentas Seni GEN-CB"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
                <Label>Usulan Tanggal <span className="text-destructive">*</span></Label>
                <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Jam Mulai</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Jam Selesai (Perkiraan)</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Usulan Lokasi Rapat</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Aula Desa Sasak Panjang" />
            </div>

            <div className="space-y-1.5">
              <Label>Kutipan / Tagline (Untuk Flayer)</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Kata motivasi atau perencana rapat" />
            </div>

            <div className="space-y-1.5">
              <Label>Latar Belakang / Deskripsi Pembahasan</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Jelaskan alasan perlunya mengadakan rapat ini..." />
            </div>

            <div className="space-y-1.5">
              <Label>Rencana Agenda</Label>
              <Textarea rows={3} value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="1. Pembukaan&#10;2. Pembahasan Utama&#10;3. Penutup" />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/kalender" })}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[160px]">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                Kirim Pengajuan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
