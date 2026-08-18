import { formatIdDate } from "@/lib/brand";
import type { Meeting, AttendanceRow, AttendanceStatus } from "@/lib/rapat.types";
import type { Organization } from "@/lib/org";

export function generateQrToken(meetingId: string, userId: string): string {
  const mShort = meetingId.replace(/-/g, "").slice(0, 8);
  const uShort = userId.replace(/-/g, "").slice(0, 8);
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `GEN-CB-QR-${mShort}-${uShort}-${rand}`;
}

export function calculateAttendanceStatus(
  scanDate: Date,
  meeting: Meeting
): AttendanceStatus {
  if (!meeting.on_time_until) return "HADIR";

  const meetingDateStr = meeting.meeting_date; // YYYY-MM-DD
  const onTimeStr = `${meetingDateStr}T${meeting.on_time_until}:00`;
  const onTimeDate = new Date(onTimeStr);

  if (isNaN(onTimeDate.getTime())) return "HADIR";

  if (scanDate.getTime() <= onTimeDate.getTime()) {
    return "HADIR";
  }

  if (meeting.attendance_close_at) {
    const closeStr = `${meetingDateStr}T${meeting.attendance_close_at}:00`;
    const closeDate = new Date(closeStr);
    if (!isNaN(closeDate.getTime()) && scanDate.getTime() > closeDate.getTime()) {
      return "ALFA";
    }
  }

  return "TERLAMBAT";
}

export async function exportRekapPdf(
  meeting: Meeting,
  participants: AttendanceRow[],
  org: Organization
) {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageW = pdf.internal.pageSize.getWidth();
  let y = 15;

  // Header / Kop text
  pdf.setFont("times", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(0, 43, 127); // Deep Blue #002B7F
  pdf.text(`YAYASAN ${org.name.toUpperCase()}`, pageW / 2, y, { align: "center" });
  y += 6;

  pdf.setFont("times", "italic");
  pdf.setFontSize(10);
  pdf.setTextColor(255, 122, 0); // Orange #FF7A00
  pdf.text('"Generasi Cerdas Beraksi"', pageW / 2, y, { align: "center" });
  y += 5;

  pdf.setFont("times", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  const contactText = [org.address, org.phone && `Telp: ${org.phone}`, org.email].filter(Boolean).join(" · ");
  pdf.text(contactText, pageW / 2, y, { align: "center" });
  y += 6;

  // Double Line
  pdf.setDrawColor(0, 43, 127);
  pdf.setLineWidth(0.8);
  pdf.line(15, y, pageW - 15, y);
  y += 1.5;
  pdf.setLineWidth(0.3);
  pdf.line(15, y, pageW - 15, y);
  y += 10;

  // Title
  pdf.setFont("times", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text("REKAP KEHADIRAN RAPAT", pageW / 2, y, { align: "center" });
  y += 8;

  // Meeting Details Table
  pdf.setFont("times", "normal");
  pdf.setFontSize(10);
  const leftX = 15;

  const details = [
    ["Nama Rapat", `: ${meeting.title}`],
    ["Kategori", `: ${meeting.category}`],
    ["Hari / Tanggal", `: ${meeting.day_name ? meeting.day_name + ", " : ""}${formatIdDate(meeting.meeting_date)}`],
    ["Waktu", `: ${meeting.start_time}${meeting.end_time ? " - " + meeting.end_time : ""} WIB`],
    ["Lokasi", `: ${meeting.location || "-"}`],
    ["Pimpinan Rapat", `: ${meeting.leader_name || "-"}`],
  ];

  details.forEach(([k, v]) => {
    pdf.setFont("times", "bold");
    pdf.text(k, leftX, y);
    pdf.setFont("times", "normal");
    pdf.text(v, leftX + 35, y);
    y += 5;
  });

  y += 5;

  // Table Header
  const colWidths = [12, 60, 45, 28, 35];
  const headers = ["No", "Nama Pengurus", "Jabatan / Divisi", "Jam Hadir", "Status"];

  pdf.setFillColor(0, 43, 127);
  pdf.rect(leftX, y, colWidths.reduce((a, b) => a + b, 0), 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("times", "bold");

  let curX = leftX;
  headers.forEach((h, idx) => {
    pdf.text(h, curX + 2, y + 5.5);
    curX += colWidths[idx];
  });

  y += 8;
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("times", "normal");

  participants.forEach((p, idx) => {
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    const bg = idx % 2 === 0 ? 255 : 247;
    pdf.setFillColor(bg, bg, bg);
    pdf.rect(leftX, y, colWidths.reduce((a, b) => a + b, 0), 7, "F");

    let x = leftX;
    pdf.text(String(idx + 1), x + 2, y + 5);
    x += colWidths[0];

    pdf.text((p.user?.full_name || "-").slice(0, 30), x + 2, y + 5);
    x += colWidths[1];

    pdf.text(([p.user?.position, p.user?.divisi].filter(Boolean).join(" - ") || "-").slice(0, 22), x + 2, y + 5);
    x += colWidths[2];

    const checkInText = p.check_in_time
      ? new Date(p.check_in_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "-";
    pdf.text(checkInText, x + 2, y + 5);
    x += colWidths[3];

    pdf.setFont("times", "bold");
    if (p.status === "HADIR") pdf.setTextColor(0, 150, 0);
    else if (p.status === "TERLAMBAT") pdf.setTextColor(200, 140, 0);
    else if (p.status === "IZIN") pdf.setTextColor(0, 100, 220);
    else if (p.status === "ALFA") pdf.setTextColor(200, 0, 0);
    else pdf.setTextColor(120, 120, 120);

    pdf.text(p.status, x + 2, y + 5);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("times", "normal");

    y += 7;
  });

  y += 15;
  if (y > 230) {
    pdf.addPage();
    y = 30;
  }

  // Signatures Section
  const dateFormatted = formatIdDate(new Date());
  pdf.setFont("times", "normal");
  pdf.setFontSize(10);
  pdf.text(`Bogor, ${dateFormatted}`, pageW - 60, y, { align: "center" });
  y += 6;

  const sigColW = 80;
  pdf.text("Mengetahui,", pageW / 4, y, { align: "center" });
  pdf.text("Notulis / Penanggung Jawab,", (pageW * 3) / 4, y, { align: "center" });
  y += 5;

  pdf.text("Ketua GEN-CB,", pageW / 4, y, { align: "center" });
  pdf.text(meeting.leader_name || "Pimpinan Rapat,", (pageW * 3) / 4, y, { align: "center" });
  y += 25;

  pdf.setFont("times", "bold");
  pdf.text(org.ketua_name || "(....................................)", pageW / 4, y, { align: "center" });
  pdf.text(meeting.notulis_name || "(....................................)", (pageW * 3) / 4, y, { align: "center" });

  pdf.save(`rekap-rapat-${meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
}

export function exportRekapExcel(meeting: Meeting, participants: AttendanceRow[]) {
  const headers = ["No", "Nama Pengurus", "Email", "No WhatsApp", "Jabatan", "Bidang", "Divisi", "Jam Hadir", "Status Kehadiran", "Catatan/Alasan"];

  const rows = participants.map((p, idx) => [
    idx + 1,
    `"${p.user?.full_name || ""}"`,
    `"${p.user?.email || ""}"`,
    `"${p.user?.whatsapp || ""}"`,
    `"${p.user?.position || ""}"`,
    `"${p.user?.bidang || ""}"`,
    `"${p.user?.divisi || ""}"`,
    p.check_in_time ? `"${new Date(p.check_in_time).toLocaleTimeString("id-ID")}"` : '"-"',
    `"${p.status}"`,
    `"${(p.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "\uFEFF" + // UTF-8 BOM for Excel
    `"REKAP KEHADIRAN RAPAT - ${meeting.title.replace(/"/g, '""')}"\n` +
    `"Tanggal: ${meeting.meeting_date} | Lokasi: ${meeting.location || "-"}"\n\n` +
    headers.join(",") +
    "\n" +
    rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = `rekap-rapat-${meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
