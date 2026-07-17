# GEN-CB Office — Rencana Pembangunan

Aplikasi web internal Yayasan GEN-CB untuk membuat surat resmi dan flayer rapat, dengan arsip dan pengaturan organisasi.

## Ruang Lingkup Versi Awal (MVP)

Karena permintaan ini sangat besar, saya usulkan membangun dalam 2 fase agar Anda bisa memakainya lebih cepat. **Fase 1 adalah yang saya bangun di sesi pertama** — sisanya dilanjutkan setelah Fase 1 disetujui dan diuji.

### Fase 1 — Fondasi + Generator Surat (dibangun sekarang)
1. **Design system GEN-CB**
   - Warna: Deep Blue `#003B8F`, Orange `#FF7A00`, Putih
   - Font modern, dukungan Light/Dark mode
   - Layout responsive (desktop & tablet)
   - Logo GEN-CB terintegrasi
2. **Authentication (single account)**
   - Login page: `yayasangencb@gmail.com` / `Generasicerdasberaksi_`
   - Session tersimpan sampai logout
   - Pesan error: "Email atau Password salah"
3. **Layout aplikasi**
   - Header: Logo + "GEN-CB OFFICE" + tombol Logout
   - Dashboard dengan 4 card besar (Generator Surat, Flayer, Arsip, Pengaturan)
4. **Menu 1 — Generator Surat**
   - Form lengkap sesuai spesifikasi (nomor, tanggal, perihal, kepada, isi, TTD dll)
   - Dropdown 8 jenis surat
   - **Nomor surat otomatis** (001, 002, 003...) dengan format `001/GEN-CB/BULAN-ROMAWI/TAHUN` — disimpan di database Lovable Cloud (bukan Google Sheets, lihat catatan di bawah)
   - **AI isi surat**: user ketik kalimat singkat → AI (Lovable AI Gateway, Gemini) membuat isi formal Bahasa Indonesia, bisa diedit
   - **Preview surat** mengikuti template GEN-CB (kop, margin, watermark, TTD, footer)
   - Export **PDF** & **DOCX**, tombol **Print**
   - Auto-save draft
5. **Menu 3 — Arsip (basic)**
   - Daftar surat tersimpan, cari & filter (tanggal, judul, nomor, jenis), pagination
   - Preview, Edit, Download, Hapus, Duplicate
6. **Menu 4 — Pengaturan**
   - Data organisasi, logo, nama Ketua/Sekretaris, TTD digital
   - Otomatis dipakai saat generate surat
7. **QR Code Verification** untuk surat + halaman `/verify/:id` publik
8. **Database + Storage** (Lovable Cloud / Supabase)
   - Tabel: `organization`, `letters`, `letter_counter`, `settings`
   - Storage bucket: logos, ttd, exports
   - RLS aktif

### Fase 2 — Generator Flayer (dibangun setelah Fase 1 disetujui)
- Form flayer sesuai spec
- Preview live realtime mengikuti template flayer GEN-CB (canvas/HTML render)
- Export PNG HD, JPG, PDF
- Arsip flayer + duplicate
- Tabel `flyers` + storage bucket flyer

Pemisahan ini karena render flayer high-fidelity (Canvas/HTML→PNG) butuh iterasi visual tersendiri agar hasilnya benar-benar mirip template flayer yang Anda upload.

## Catatan Teknis Penting (mohon dibaca)

1. **Google Spreadsheet sebagai database nomor surat**: Spreadsheet Google membutuhkan koneksi OAuth Google per-user dan cocok untuk data satu akun saja — untuk penomoran yang harus unik & atomic (tidak boleh dobel saat dua orang generate bersamaan), database lebih andal. **Saya akan simpan counter nomor surat di Lovable Cloud** (aman, unik, otomatis). Jika Anda tetap ingin sync ke Google Sheet asli, ini bisa ditambahkan sebagai fitur ekspor terpisah di Fase 2.
2. **Template surat & flayer**: Saya akan parse `Contoh_Mentahan_Surat_GEN_CB.docx` untuk mengambil format header/margin/footer, dan menggunakan `Mentahan_FLayer_rapat.png` sebagai referensi visual flayer.
3. **AI**: Menggunakan **Lovable AI Gateway** (Gemini) — sudah termasuk, tidak perlu API key eksternal.
4. **DOCX export**: Menggunakan library `docx` yang menghasilkan file .docx yang bisa dibuka di MS Word/Google Docs dengan header, footer, watermark, dan tanda tangan.
5. **PDF export**: Menggunakan render HTML → PDF di browser (jsPDF + html2canvas) agar sama persis dengan preview.

## Teknologi
TanStack Start · React · Tailwind v4 · shadcn/ui · Lucide · Lovable Cloud (Supabase) · Lovable AI Gateway (Gemini) · library: `docx`, `jspdf`, `html2canvas`, `qrcode`, `html-to-image`

## Yang saya butuhkan konfirmasi
- **Setuju bertahap** (Fase 1 dulu → Fase 2)? Atau lebih suka semuanya sekaligus (akan lebih lama dan lebih besar kemungkinan perlu revisi)?
- **Nomor surat**: OK simpan di Lovable Cloud (rekomendasi) atau wajib Google Sheets?
- **Data organisasi awal** (nama lengkap, alamat, no HP, email, website, nama Ketua, nama Sekretaris) — apakah bisa Anda isi lewat menu Pengaturan setelah aplikasi jadi, atau ada nilai default yang mau saya masukkan sekarang?

Setelah konfirmasi, saya langsung mulai Fase 1.
