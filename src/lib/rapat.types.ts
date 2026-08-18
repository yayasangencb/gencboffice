export type UserRole = "ADMIN" | "PENGURUS";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  whatsapp?: string | null;
  role: UserRole;
  position?: string | null;
  bidang?: string | null;
  divisi?: string | null;
  kepanitiaan?: string | null;
  photo_url?: string | null;
  is_active: boolean;
  joined_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MeetingCategory =
  | "Rapat Pengurus"
  | "Rapat Divisi"
  | "Rapat Panitia"
  | "Rapat Evaluasi"
  | "Rapat Program Kerja"
  | "Rapat Persiapan Kegiatan"
  | "Rapat Khusus"
  | "Lainnya";

export type MeetingStatus =
  | "Akan Datang"
  | "Sedang Berlangsung"
  | "Selesai"
  | "Dibatalkan";

export type Meeting = {
  id: string;
  title: string;
  category: MeetingCategory | string;
  description?: string | null;
  agenda?: string | null;
  meeting_date: string;
  day_name?: string | null;
  start_time: string;
  end_time?: string | null;
  attendance_open_at?: string | null;
  on_time_until?: string | null;
  attendance_close_at?: string | null;
  location?: string | null;
  tagline?: string | null;
  leader_name?: string | null;
  pic_name?: string | null;
  notulis_name?: string | null;
  status: MeetingStatus | string;
  is_closed: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AttendanceStatus =
  | "HADIR"
  | "TERLAMBAT"
  | "IZIN"
  | "ALFA"
  | "Belum Hadir";

export type AttendanceRow = {
  id: string;
  meeting_id: string;
  user_id: string;
  user?: Profile;
  status: AttendanceStatus;
  check_in_time?: string | null;
  scanned_by?: string | null;
  is_manual?: boolean;
  notes?: string | null;
  qr_token?: string;
  invitation_status?: string;
  created_at?: string;
};

export type LeaveRequest = {
  id: string;
  meeting_id: string;
  user_id: string;
  user?: Profile;
  reason_type: string;
  notes?: string | null;
  proof_url?: string | null;
  status: "IZIN MENUNGGU PERSETUJUAN" | "DISETUJUI" | "DITOLAK";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
};

export type MeetingMinutes = {
  id: string;
  meeting_id: string;
  topics?: string | null;
  problems?: string | null;
  suggestions?: string | null;
  decisions_summary?: string | null;
  conclusions?: string | null;
  notes?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MeetingDecision = {
  id: string;
  meeting_id: string;
  decision_number: number;
  title: string;
  pic_id?: string | null;
  pic_name?: string | null;
  deadline?: string | null;
  status?: "Belum Dikerjakan" | "Proses" | "Selesai" | string | null;
  created_at?: string;
};

export type MeetingTask = {
  id: string;
  meeting_id: string;
  title: string;
  user_id?: string | null;
  user_name?: string | null;
  deadline?: string | null;
  status: "Belum Selesai" | "Proses" | "Selesai" | string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MeetingFile = {
  id: string;
  meeting_id: string;
  file_name: string;
  file_url: string;
  file_type: "image" | "pdf" | "word" | "spreadsheet" | "other" | string;
  file_size?: number | null;
  created_at?: string;
};

export type AttendanceLog = {
  id: string;
  meeting_id: string;
  user_id: string;
  changed_by_name: string;
  prev_status: string;
  new_status: string;
  reason: string;
  created_at: string;
};
