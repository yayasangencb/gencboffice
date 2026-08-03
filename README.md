# GEN-CB Office Suite

Aplikasi Web Generator Surat & Flayer GEN-CB

Buatkan aplikasi web profesional bernama

GEN-CB Office

Logo menggunakan logo GEN-CB.

Tema utama mengikuti identitas GEN-CB

Deep Blue (#003B8F)
Orange (#FF7A00)
Putih
Modern
Clean
Responsive

Aplikasi dibuat khusus untuk internal Yayasan Generasi Cerdas Beraksi (GEN-CB).

AUTHENTICATION

Halaman pertama adalah Login.

Tidak ada fitur Register.

Hanya terdapat satu akun.

Email

yayasangencb@gmail.com

Password

Generasicerdasberaksi_

Jika login berhasil masuk Dashboard.

Jika gagal tampilkan pesan

Email atau Password salah.

Session login disimpan sampai logout.

DASHBOARD

Dashboard menampilkan card besar

📄 Generator Surat

🖼 Generator Flayer Rapat

📂 Arsip

⚙ Pengaturan

Di bagian atas terdapat

Logo GEN-CB

Nama

GEN-CB OFFICE

serta tombol Logout.

MENU 1
Generator Surat

Konsep aplikasi seperti membuat surat otomatis.

Template surat menggunakan format surat GEN-CB yang sudah ada.

Gunakan header, margin, font, watermark dan posisi tanda tangan mengikuti template surat yang saya upload.

Nomor surat otomatis.

PENOMORAN SURAT

Nomor surat mengikuti Spreadsheet Google.

Spreadsheet digunakan sebagai database nomor surat.

Gunakan spreadsheet berikut sebagai sumber data.

https://docs.google.com/spreadsheets/d/16EZy9678GUvgdxR5Wqaxqj_dvJRiYR3h/edit

Karena organisasi baru dimulai maka nomor pertama adalah

001

Kemudian otomatis menjadi

002

003

004

dan seterusnya.

Format nomor surat misalnya

001/GEN-CB/VII/2026

atau sesuai jenis surat.

Nomor tidak boleh sama.

JENIS SURAT

Dropdown

Surat Undangan
Surat Permohonan
Surat Peminjaman
Surat Tugas
Surat Rekomendasi
Surat Keterangan
Surat Keputusan
Surat Lainnya
FORM INPUT SURAT

Nomor Surat (otomatis)

Tanggal Surat

Lampiran

Perihal

Kepada

Instansi

Alamat

Isi Surat

Hari

Tanggal Acara

Jam

Tempat

Penutup

Nama Ketua

Nama Sekretaris

Jabatan

TTD Ketua

TTD Sekretaris

Upload Logo Tambahan (Opsional)

FITUR AI

Jika user hanya menulis

"Surat permohonan peminjaman sound system"

AI otomatis membuat isi surat formal Bahasa Indonesia.

Begitu juga

Surat Undangan

Surat Permohonan

Surat Tugas

Surat Keterangan

Semua otomatis dibuatkan isi.

User masih dapat mengedit sebelum Generate.

PREVIEW SURAT

Saat klik Generate

Munculkan Preview persis seperti surat asli.

Header

Watermark

Margin

Logo

Tanda tangan

Footer

Semuanya mengikuti template.

EXPORT

Tombol

Download PDF

Download DOCX

Print

MENU 2
Generator Flayer Rapat

Gunakan template flayer GEN-CB yang saya upload.

Warna

Orange

Blue

Putih

Tetap konsisten.

FORM INPUT FLAYER

Judul Acara

Sub Judul

Tanggal

Jam

Lokasi

Deskripsi

Tagline

Upload Logo

Upload Background (Opsional)

Upload QR Code (Opsional)

Nama Penyelenggara

PREVIEW

Saat mengetik

Preview berubah secara realtime.

Tidak perlu klik refresh.

Template mengikuti desain flayer GEN-CB.

Posisi elemen harus proporsional.

EXPORT FLAYER

PNG HD

PDF

JPG

MENU 3
Arsip

Semua surat yang pernah dibuat tersimpan.

Semua flayer tersimpan.

Bisa dicari berdasarkan

Tanggal

Judul

Nomor Surat

Jenis Surat

Terdapat tombol

Preview

Edit

Download

Hapus

MENU 4
Pengaturan

Data organisasi

Nama Organisasi

Alamat

No HP

Email

Website

Logo

Nama Ketua

Nama Sekretaris

Tanda tangan digital

Semua data otomatis dipakai setiap generate surat.

DATABASE

Gunakan Supabase.

Tabel

users

organization

letters

letter_number

flyers

settings

archive

STORAGE

Gunakan Supabase Storage

untuk

Logo

TTD

Background

QR Code

Export File

UI

Gunakan shadcn/ui

TailwindCSS

Lucide Icon

Responsive Desktop

Responsive Tablet

Loading Animation

Toast Notification

Dark Mode

Light Mode

FITUR TAMBAHAN

✅ Auto Save Draft

✅ Duplicate Surat

✅ Duplicate Flayer

✅ Export PDF

✅ Export Word

✅ Export PNG

✅ Print

✅ Preview Live

✅ Search

✅ Filter

✅ Pagination

BONUS FITUR

Tambahkan QR Code Verification.

Setiap surat memiliki QR Code unik.

Ketika QR Code dipindai akan membuka halaman verifikasi.

Menampilkan

Nomor Surat

Tanggal

Jenis Surat

Status

Valid

atau

Tidak Valid.

DESAIN

Surat harus benar-benar mengikuti template GEN-CB yang telah saya upload.

Flayer harus mengikuti template rapat GEN-CB yang telah saya upload.

Gunakan warna identitas GEN-CB dan tata letak profesional.

Semua posisi elemen harus tetap rapi ketika diubah isinya.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gencboffice.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/49650188-6a9a-488f-a0d8-322604c253e3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
