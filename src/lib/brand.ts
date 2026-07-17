import logoAsset from "@/assets/logo-gen-cb.asset.json";

export const LOGO_URL = logoAsset.url;

export const LETTER_TYPES = [
  { code: "UND", label: "Surat Undangan" },
  { code: "PMH", label: "Surat Permohonan" },
  { code: "PJM", label: "Surat Peminjaman" },
  { code: "TGS", label: "Surat Tugas" },
  { code: "REK", label: "Surat Rekomendasi" },
  { code: "KET", label: "Surat Keterangan" },
  { code: "KEP", label: "Surat Keputusan" },
  { code: "LN", label: "Surat Lainnya" },
] as const;

export type LetterTypeCode = (typeof LETTER_TYPES)[number]["code"];

export const ROMAN_MONTHS = [
  "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII",
];

export function formatLetterNumber(num: number, typeCode: string, date: Date): string {
  const padded = String(num).padStart(3, "0");
  const roman = ROMAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${padded}/${typeCode}/GEN-CB/${roman}/${year}`;
}

export function formatIdDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}