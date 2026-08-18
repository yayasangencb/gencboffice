-- Modul Rapat Database Migration for GEN-CB Office

-- 1. Profiles Table (Pengurus & Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'PENGURUS', -- 'ADMIN' or 'PENGURUS'
  position TEXT DEFAULT 'Anggota',
  bidang TEXT DEFAULT '',
  divisi TEXT DEFAULT '',
  kepanitiaan TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  login_password TEXT DEFAULT 'gencb123',
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Meetings Table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Rapat Pengurus',
  description TEXT DEFAULT '',
  agenda TEXT DEFAULT '',
  meeting_date DATE NOT NULL,
  day_name TEXT DEFAULT '',
  start_time TEXT NOT NULL,
  end_time TEXT DEFAULT '',
  attendance_open_at TEXT DEFAULT '',
  on_time_until TEXT DEFAULT '',
  attendance_close_at TEXT DEFAULT '',
  location TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  leader_name TEXT DEFAULT '',
  pic_name TEXT DEFAULT '',
  notulis_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Akan Datang', -- 'Akan Datang', 'Sedang Berlangsung', 'Selesai', 'Dibatalkan'
  is_closed BOOLEAN NOT NULL DEFAULT false,
  proposed_by_name TEXT DEFAULT '',
  proposed_by_id TEXT DEFAULT '',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Meeting Participants Table
CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  qr_token TEXT NOT NULL UNIQUE,
  invitation_status TEXT NOT NULL DEFAULT 'WAJIB HADIR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Belum Hadir', -- 'HADIR', 'TERLAMBAT', 'IZIN', 'ALFA', 'Belum Hadir'
  check_in_time TIMESTAMPTZ,
  scanned_by TEXT DEFAULT '',
  is_manual BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- 5. Attendance Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  changed_by_name TEXT NOT NULL,
  prev_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason_type TEXT NOT NULL, -- 'Sakit', 'Ada kegiatan keluarga', 'Pekerjaan', 'Kuliah', 'Kegiatan lain', 'Lainnya'
  notes TEXT DEFAULT '',
  proof_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'IZIN MENUNGGU PERSETUJUAN', -- 'IZIN MENUNGGU PERSETUJUAN', 'DISETUJUI', 'DITOLAK'
  reviewed_by TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Meeting Minutes (Notulen) Table
CREATE TABLE IF NOT EXISTS public.meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE UNIQUE,
  topics TEXT DEFAULT '',
  problems TEXT DEFAULT '',
  suggestions TEXT DEFAULT '',
  decisions_summary TEXT DEFAULT '',
  conclusions TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  updated_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Meeting Decisions Table
CREATE TABLE IF NOT EXISTS public.meeting_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  decision_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  pic_id UUID REFERENCES public.profiles(id),
  pic_name TEXT DEFAULT '',
  deadline DATE,
  status TEXT DEFAULT 'Belum Dikerjakan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Meeting Tasks (Action Items) Table
CREATE TABLE IF NOT EXISTS public.meeting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT DEFAULT '',
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'Belum Selesai', -- 'Belum Selesai', 'Proses', 'Selesai'
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Meeting Files Table
CREATE TABLE IF NOT EXISTS public.meeting_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'pdf', 'word', 'spreadsheet', 'other'
  file_size INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'reminder',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_meeting ON public.attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_meeting ON public.leave_requests(meeting_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.meeting_tasks(user_id);

-- RLS & Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "public profiles write" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public meetings all" ON public.meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public participants all" ON public.meeting_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public attendance all" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public logs all" ON public.attendance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public leave all" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public minutes all" ON public.meeting_minutes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public decisions all" ON public.meeting_decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public tasks all" ON public.meeting_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public files all" ON public.meeting_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public notifications all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime for attendance table
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
