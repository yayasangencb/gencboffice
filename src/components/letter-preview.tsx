import { forwardRef } from "react";
import { LOGO_URL, formatIdDate } from "@/lib/brand";
import type { Organization } from "@/lib/org";

export type LetterData = {
  letter_number: string;
  letter_date: string;
  lampiran: string;
  perihal: string;
  kepada: string;
  instansi: string;
  alamat: string;
  isi_surat: string;
  hari: string;
  tanggal_acara: string;
  jam: string;
  tempat: string;
  tempat_surat?: string;
  penutup: string;
  ketua_name: string;
  sekretaris_name: string;
  jabatan: string;
  ttd_ketua_url: string;
  ttd_sekretaris_url: string;
  extra_logo_url?: string;
  qr_data_url?: string;
};

export const LetterPreview = forwardRef<HTMLDivElement, { data: LetterData; org: Organization }>(
  function LetterPreview({ data, org }, ref) {
    const logo = org.logo_url || LOGO_URL;
    const hasEventDetails = data.hari || data.tanggal_acara || data.jam || data.tempat;
    return (
      <div
        ref={ref}
        className="relative mx-auto bg-white text-black shadow-sm"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "22mm 22mm 18mm 22mm",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "12pt",
          lineHeight: 1.5,
          boxSizing: "border-box",
        }}
      >
        {/* Watermark */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            opacity: 0.06,
          }}
        >
          <img src={logo} alt="" style={{ width: "60%", maxWidth: 500 }} />
        </div>

        {/* Kop / Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderBottom: "3px double #003B8F",
            paddingBottom: 8,
          }}
        >
          <img src={logo} alt="Logo" style={{ height: 90, width: 90, objectFit: "contain" }} />
          {data.extra_logo_url && (
            <img src={data.extra_logo_url} alt="Logo tambahan" style={{ height: 90, width: 90, objectFit: "contain" }} />
          )}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "10pt", letterSpacing: 3, color: "#FF7A00", fontWeight: 700 }}>
              YAYASAN
            </div>
            <div style={{ fontSize: "22pt", fontWeight: 900, color: "#003B8F", lineHeight: 1 }}>
              {org.name.toUpperCase()}
            </div>
            <div style={{ fontSize: "10pt", fontStyle: "italic", color: "#003B8F" }}>
              "Generasi Cerdas Beraksi"
            </div>
            <div style={{ fontSize: "9.5pt", marginTop: 4 }}>
              {org.address}
              {org.phone && <> · Telp: {org.phone}</>}
              {org.email && <> · {org.email}</>}
              {org.website && <> · {org.website}</>}
            </div>
          </div>
        </header>
        <div style={{ height: 3, background: "#FF7A00", marginTop: 2 }} />

        {/* Body */}
        <div style={{ position: "relative", marginTop: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: 90, verticalAlign: "top" }}>Nomor</td>
                <td style={{ width: 12 }}>:</td>
                <td>{data.letter_number || "—"}</td>
                <td style={{ textAlign: "right", verticalAlign: "top" }}>
                  {(data.tempat_surat || "").trim() ? `${data.tempat_surat}, ` : ""}
                  {formatIdDate(data.letter_date)}
                </td>
              </tr>
              {data.lampiran && (
                <tr>
                  <td>Lampiran</td>
                  <td>:</td>
                  <td colSpan={2}>{data.lampiran}</td>
                </tr>
              )}
              <tr>
                <td style={{ verticalAlign: "top" }}>Perihal</td>
                <td style={{ verticalAlign: "top" }}>:</td>
                <td colSpan={2}>
                  <span style={{ fontWeight: 700, textDecoration: "underline" }}>{data.perihal || "—"}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            <div>Kepada Yth,</div>
            {data.kepada && <div style={{ fontWeight: 700 }}>{data.kepada}</div>}
            {data.instansi && <div>{data.instansi}</div>}
            <div style={{ fontStyle: "italic" }}>di —</div>
            {data.alamat && <div style={{ marginLeft: 16, fontWeight: 700 }}>{data.alamat}</div>}
          </div>

          <div style={{ marginTop: 18, textAlign: "justify" }}>
            <p>Dengan hormat,</p>
            <div style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
              {data.isi_surat || "..."}
            </div>

            {hasEventDetails && (
              <div style={{ marginTop: 12, marginLeft: 24 }}>
                <table style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    {data.hari && (
                      <tr>
                        <td style={{ width: 90 }}>Hari</td><td style={{ width: 12 }}>:</td><td>{data.hari}</td>
                      </tr>
                    )}
                    {data.tanggal_acara && (
                      <tr>
                        <td>Tanggal</td><td>:</td><td>{formatIdDate(data.tanggal_acara)}</td>
                      </tr>
                    )}
                    {data.jam && (
                      <tr>
                        <td>Waktu</td><td>:</td><td>{data.jam}</td>
                      </tr>
                    )}
                    {data.tempat && (
                      <tr>
                        <td>Tempat</td><td>:</td><td>{data.tempat}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {data.penutup && (
              <p style={{ marginTop: 14 }}>{data.penutup}</p>
            )}
          </div>

          {/* Signatures */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36 }}>
            <SignBlock title="Sekretaris" name={data.sekretaris_name} img={data.ttd_sekretaris_url} />
            <SignBlock title={data.jabatan || "Ketua"} name={data.ketua_name} img={data.ttd_ketua_url} />
          </div>

          {data.qr_data_url && (
            <div style={{ position: "absolute", left: 0, bottom: -60, display: "flex", alignItems: "center", gap: 8 }}>
              <img src={data.qr_data_url} alt="QR" style={{ height: 72, width: 72 }} />
              <div style={{ fontSize: "8pt", color: "#555", lineHeight: 1.3 }}>
                Verifikasi keabsahan surat<br />
                dengan memindai QR Code
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

function SignBlock({ title, name, img }: { title: string; name: string; img?: string }) {
  return (
    <div style={{ width: 240, textAlign: "center" }}>
      <div>{title}</div>
      <div style={{ height: 80, display: "grid", placeItems: "center" }}>
        {img && <img src={img} alt="" style={{ maxHeight: 80, maxWidth: 160, objectFit: "contain" }} />}
      </div>
      <div style={{ fontWeight: 700, textDecoration: "underline" }}>{name || "(...)"}</div>
    </div>
  );
}