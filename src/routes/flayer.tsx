import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useRef, useState } from "react";
import { Calendar, Clock, MapPin, Download, FileImage, FileText, Loader2 } from "lucide-react";
import { LOGO_URL, formatIdDate } from "@/lib/brand";
import { toast } from "sonner";

export const Route = createFileRoute("/flayer")({
  head: () => ({ meta: [{ title: "Generator Flayer — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <FlayerPage />
    </RequireAuth>
  ),
});

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function FlayerPage() {
  const [heading, setHeading] = useState("RAPAT PEMBAHASAN");
  const [subheading, setSubheading] = useState("GEN-CB");
  const [title, setTitle] = useState("LOMBA TENIS MEJA");
  const [date, setDate] = useState("2026-07-18");
  const [timeText, setTimeText] = useState("18.30 WIB - Selesai");
  const [location, setLocation] = useState("Meet & Play\nSasak Panjang");
  const [quote, setQuote] = useState(
    "Bersama merencanakan kegiatan,\nbersama mewujudkan prestasi.",
  );
  const [busy, setBusy] = useState<null | "png" | "jpg" | "pdf">(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const dateLine = useMemo(() => {
    if (!date) return { day: "", full: "" };
    const d = new Date(date);
    if (isNaN(d.getTime())) return { day: "", full: "" };
    return { day: DAYS[d.getDay()] + ",", full: formatIdDate(d) };
  }, [date]);

  async function renderCanvas() {
    const el = previewRef.current;
    if (!el) throw new Error("preview not ready");
    const { default: html2canvas } = await import("html2canvas");
    return await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  }

  async function exportImg(type: "png" | "jpg") {
    try {
      setBusy(type);
      const canvas = await renderCanvas();
      const mime = type === "png" ? "image/png" : "image/jpeg";
      const dataUrl = canvas.toDataURL(mime, type === "jpg" ? 0.95 : undefined);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `flayer-gencb-${slug(title)}.${type}`;
      a.click();
      toast.success(`Flayer ${type.toUpperCase()} diunduh`);
    } catch (e) {
      toast.error("Gagal export flayer");
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    try {
      setBusy("pdf");
      const canvas = await renderCanvas();
      const { default: jsPDF } = await import("jspdf");
      const w = canvas.width;
      const h = canvas.height;
      const pdf = new jsPDF({ unit: "px", format: [w, h], orientation: h >= w ? "portrait" : "landscape" });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, w, h);
      pdf.save(`flayer-gencb-${slug(title)}.pdf`);
      toast.success("Flayer PDF diunduh");
    } catch (e) {
      toast.error("Gagal export PDF");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Generator Flayer Rapat</h1>
        <p className="text-sm text-muted-foreground">Isi form di kiri, preview live di kanan mengikuti template GEN-CB.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card>
          <CardContent className="p-5 space-y-4">
            <Field label="Heading atas">
              <Input value={heading} onChange={(e) => setHeading(e.target.value.toUpperCase())} placeholder="RAPAT PEMBAHASAN" />
            </Field>
            <Field label="Sub label (di antara garis)">
              <Input value={subheading} onChange={(e) => setSubheading(e.target.value)} placeholder="GEN-CB" />
            </Field>
            <Field label="Judul utama">
              <Input value={title} onChange={(e) => setTitle(e.target.value.toUpperCase())} placeholder="LOMBA TENIS MEJA" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Waktu">
                <Input value={timeText} onChange={(e) => setTimeText(e.target.value)} placeholder="18.30 WIB - Selesai" />
              </Field>
            </div>
            <Field label="Lokasi (baris terpisah dengan Enter)">
              <Textarea rows={2} value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <Field label="Kutipan (cursive)">
              <Textarea rows={2} value={quote} onChange={(e) => setQuote(e.target.value)} />
            </Field>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => exportImg("png")} disabled={!!busy}>
                {busy === "png" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileImage className="h-4 w-4 mr-1" />}
                PNG HD
              </Button>
              <Button variant="secondary" onClick={() => exportImg("jpg")} disabled={!!busy}>
                {busy === "jpg" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                JPG
              </Button>
              <Button variant="outline" onClick={exportPdf} disabled={!!busy}>
                {busy === "pdf" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <div className="w-full max-w-[520px]">
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <div className="overflow-hidden rounded-md">
                <div
                  className="origin-top-left"
                  style={{
                    width: 1080,
                    height: 1350,
                    transform: "scale(var(--flayer-scale, 0.44))",
                    transformOrigin: "top left",
                  }}
                >
                  <FlayerCanvas
                    ref={previewRef}
                    heading={heading}
                    subheading={subheading}
                    title={title}
                    dayLine={dateLine.day}
                    dateLine={dateLine.full}
                    timeText={timeText}
                    location={location}
                    quote={quote}
                  />
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">Preview 1080×1350 · Instagram Portrait</p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) { :root { --flayer-scale: 0.44; } }
        @media (max-width: 1023px) { :root { --flayer-scale: 0.35; } }
        @media (max-width: 640px) { :root { --flayer-scale: 0.28; } }
      `}</style>

      {/* size the wrapper to the scaled preview */}
      <style>{`
        .flayer-wrap { aspect-ratio: 1080 / 1350; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "flayer";
}

type FlayerProps = {
  heading: string;
  subheading: string;
  title: string;
  dayLine: string;
  dateLine: string;
  timeText: string;
  location: string;
  quote: string;
};

const FlayerCanvas = (() => {
  const Comp = (
    { heading, subheading, title, dayLine, dateLine, timeText, location, quote }: FlayerProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const BLUE = "#003B8F";
    const ORANGE = "#FF7A00";
    const locLines = location.split("\n");
    const quoteLines = quote.split("\n");
    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: 1080,
          height: 1350,
          background: "#F7F8FA",
          overflow: "hidden",
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          color: BLUE,
        }}
      >
        {/* Top-left blue block with orange stripes */}
        <svg width="360" height="360" style={{ position: "absolute", top: 0, left: 0 }} viewBox="0 0 360 360">
          <polygon points="0,0 260,0 0,300" fill={BLUE} />
          <polygon points="0,180 200,0 260,0 0,240" fill={ORANGE} opacity="0.95" />
          <polygon points="0,220 130,0 200,0 0,280" fill="#F7F8FA" />
          <polygon points="0,250 90,0 140,0 0,310" fill={BLUE} />
        </svg>

        {/* Top-right dot grid */}
        <DotGrid x={880} y={80} rows={6} cols={6} color={BLUE} />

        {/* Logo */}
        <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <img src={LOGO_URL} alt="GEN-CB" crossOrigin="anonymous" style={{ width: 240, height: 240, objectFit: "contain" }} />
        </div>

        {/* Heading block */}
        <div style={{ position: "absolute", top: 380, left: 0, right: 0, textAlign: "center", padding: "0 80px" }}>
          <div style={{ fontWeight: 900, fontSize: 68, letterSpacing: 1, color: BLUE, lineHeight: 1.05 }}>
            {heading}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 14 }}>
            <span style={{ height: 2, width: 120, background: BLUE }} />
            <span style={{ fontSize: 40, fontWeight: 800, color: BLUE, letterSpacing: 1 }}>{subheading}</span>
            <span style={{ height: 2, width: 120, background: BLUE }} />
          </div>
          <div style={{ fontWeight: 900, fontSize: 88, color: ORANGE, marginTop: 18, lineHeight: 1.02, letterSpacing: 1 }}>
            {title}
          </div>
        </div>

        {/* Info card */}
        <div
          style={{
            position: "absolute",
            top: 760,
            left: 90,
            right: 90,
            border: `2px solid ${BLUE}`,
            borderRadius: 24,
            padding: "26px 30px",
            background: "rgba(255,255,255,0.6)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            alignItems: "center",
            gap: 8,
          }}
        >
          <InfoItem icon={<Calendar size={44} strokeWidth={2.4} color={BLUE} />}>
            <div style={{ fontWeight: 700, fontSize: 24, lineHeight: 1.2 }}>{dayLine}</div>
            <div style={{ fontWeight: 700, fontSize: 24, lineHeight: 1.2 }}>{dateLine}</div>
          </InfoItem>
          <div style={{ borderLeft: `2px solid ${BLUE}`, paddingLeft: 20 }}>
            <InfoItem icon={<Clock size={44} strokeWidth={2.4} color={BLUE} />}>
              <div style={{ fontWeight: 700, fontSize: 24, lineHeight: 1.25 }}>{timeText}</div>
            </InfoItem>
          </div>
          <div style={{ borderLeft: `2px solid ${BLUE}`, paddingLeft: 20 }}>
            <InfoItem icon={<MapPin size={44} strokeWidth={2.4} color={BLUE} />}>
              {locLines.map((l, i) => (
                <div key={i} style={{ fontWeight: 700, fontSize: 24, lineHeight: 1.2 }}>{l}</div>
              ))}
            </InfoItem>
          </div>
        </div>

        {/* Divider with dot */}
        <div style={{ position: "absolute", top: 980, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <span style={{ height: 2, width: 160, background: ORANGE }} />
          <span style={{ width: 14, height: 14, background: ORANGE, borderRadius: 999 }} />
          <span style={{ height: 2, width: 160, background: ORANGE }} />
        </div>

        {/* Quote */}
        <div
          style={{
            position: "absolute",
            top: 1010,
            left: 0,
            right: 0,
            textAlign: "center",
            padding: "0 80px",
            fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
            fontSize: 52,
            color: BLUE,
            fontStyle: "italic",
            lineHeight: 1.25,
          }}
        >
          {quoteLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>

        {/* Bottom-right dot grid */}
        <DotGrid x={880} y={1150} rows={5} cols={6} color={BLUE} />

        {/* Bottom waves */}
        <svg width="1080" height="260" viewBox="0 0 1080 260" style={{ position: "absolute", left: 0, bottom: 0 }}>
          <path d="M0,120 C300,40 700,220 1080,80 L1080,260 L0,260 Z" fill={BLUE} />
          <path d="M0,160 C260,80 720,240 1080,120 L1080,260 L0,260 Z" fill="#F7F8FA" opacity="0.15" />
          <path d="M0,180 C280,110 700,240 1080,150" fill="none" stroke={ORANGE} strokeWidth="6" />
          <path d="M0,210 C320,140 720,250 1080,180" fill="none" stroke={ORANGE} strokeWidth="4" opacity="0.7" />
        </svg>
      </div>
    );
  };
  return (require("react") as typeof import("react")).forwardRef<HTMLDivElement, FlayerProps>(Comp);
})();

function InfoItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div>{children}</div>
    </div>
  );
}

function DotGrid({ x, y, rows, cols, color }: { x: number; y: number; rows: number; cols: number; color: string }) {
  const gap = 22;
  const r = 5;
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      dots.push(<circle key={`${i}-${j}`} cx={j * gap + r} cy={i * gap + r} r={r} fill={color} />);
    }
  }
  const w = cols * gap;
  const h = rows * gap;
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: x, top: y }}>
      {dots}
    </svg>
  );
}