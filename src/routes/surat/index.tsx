import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchOrganization } from "@/lib/org";
import { generateLetterContent } from "@/lib/ai.functions";
import { reserveLetterNumber } from "@/lib/letter-number.functions";
import { supabase } from "@/integrations/supabase/client";
import { LETTER_TYPES, formatLetterNumber } from "@/lib/brand";
import { LetterPreview, type LetterData } from "@/components/letter-preview";
import { generateLetterDocx, generateLetterPdf, downloadBlob } from "@/lib/letter-export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileDown, Printer, FileText, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

export const Route = createFileRoute("/surat/")({
  head: () => ({ meta: [{ title: "Generator Surat — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <SuratPage />
    </RequireAuth>
  ),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function SuratPage() {
  const { data: org } = useQuery({ queryKey: ["org"], queryFn: fetchOrganization });
  const genAI = useServerFn(generateLetterContent);
  const reserve = useServerFn(reserveLetterNumber);
  const previewRef = useRef<HTMLDivElement>(null);

  const [typeCode, setTypeCode] = useState<string>("UND");
  const [letterDate, setLetterDate] = useState(todayISO());
  const [reserved, setReserved] = useState<{ num: number; year: number } | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<null | "pdf" | "docx">(null);
  const [qr, setQr] = useState<string>("");
  const [savedId, setSavedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    lampiran: "",
    perihal: "",
    kepada: "",
    instansi: "",
    alamat: "",
    isi_surat: "",
    hari: "",
    tanggal_acara: "",
    jam: "",
    tempat: "",
    tempat_surat: "",
    penutup:
      "Demikian surat ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.",
    jabatan: "Ketua",
  });
  const upd = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const letterNumber = useMemo(() => {
    if (!reserved) return `(belum di-reserve)/${typeCode}/GEN-CB/-/-`;
    return formatLetterNumber(reserved.num, typeCode, new Date(letterDate));
  }, [reserved, typeCode, letterDate]);

  const doReserve = async () => {
    try {
      const y = new Date(letterDate).getFullYear();
      const res = await reserve({ data: { year: y } });
      setReserved({ num: res.number, year: y });
      toast.success(`Nomor tersedia: ${String(res.number).padStart(3, "0")}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  useEffect(() => { if (!reserved) doReserve(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const runAI = async () => {
    if (!aiPrompt.trim()) return toast.error("Tulis dulu maksud suratnya");
    setAiLoading(true);
    try {
      const typeLabel = LETTER_TYPES.find((t) => t.code === typeCode)?.label ?? "Surat";
      const res = await genAI({ data: { letterType: typeLabel, prompt: aiPrompt, context: form } });
      upd("isi_surat", res.text);
      if (!form.perihal) {
        upd("perihal", aiPrompt.slice(0, 80));
      }
      toast.success("Isi surat berhasil dibuat AI");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const letterData: LetterData = {
    letter_number: letterNumber,
    letter_date: letterDate,
    lampiran: form.lampiran,
    perihal: form.perihal,
    kepada: form.kepada,
    instansi: form.instansi,
    alamat: form.alamat,
    isi_surat: form.isi_surat,
    hari: form.hari,
    tanggal_acara: form.tanggal_acara,
    jam: form.jam,
    tempat: form.tempat,
    tempat_surat: form.tempat_surat,
    penutup: form.penutup,
    jabatan: form.jabatan,
    ketua_name: org?.ketua_name ?? "",
    sekretaris_name: org?.sekretaris_name ?? "",
    ttd_ketua_url: org?.ttd_ketua_url ?? "",
    ttd_sekretaris_url: org?.ttd_sekretaris_url ?? "",
    qr_data_url: qr,
  };

  const saveArchive = async (): Promise<string | null> => {
    if (!org) return null;
    if (!reserved) { toast.error("Nomor surat belum di-reserve"); return null; }
    if (!form.perihal || !form.isi_surat) { toast.error("Perihal & isi surat wajib diisi"); return null; }
    setSaving(true);
    try {
      const payload = {
        letter_number: letterNumber,
        letter_number_seq: reserved.num,
        letter_year: reserved.year,
        letter_type: typeCode,
        letter_date: letterDate,
        perihal: form.perihal,
        kepada: form.kepada,
        instansi: form.instansi,
        payload: letterData as unknown,
      };
      let id = savedId;
      if (id) {
        const { error } = await supabase.from("letters" as never).update(payload as never).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("letters" as never).insert(payload as never).select("id").single();
        if (error) throw error;
        id = (data as { id: string }).id;
        setSavedId(id);
      }
      const verifyUrl = `${window.location.origin}/verify/${id}`;
      const dataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 });
      setQr(dataUrl);
      await supabase.from("letters" as never).update({ qr_data: dataUrl, verify_url: verifyUrl } as never).eq("id", id);
      toast.success("Surat tersimpan di Arsip");
      return id;
    } catch (e) {
      toast.error((e as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    const id = savedId ?? (await saveArchive());
    if (!id || !previewRef.current) return;
    setExporting("pdf");
    try {
      await new Promise((r) => setTimeout(r, 100));
      await generateLetterPdf(previewRef.current, `${letterNumber.replaceAll("/", "-")}.pdf`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setExporting(null); }
  };

  const exportDOCX = async () => {
    const id = savedId ?? (await saveArchive());
    if (!id || !org) return;
    setExporting("docx");
    try {
      const blob = await generateLetterDocx(letterData, org);
      downloadBlob(blob, `${letterNumber.replaceAll("/", "-")}.docx`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setExporting(null); }
  };

  const doPrint = async () => {
    if (!savedId) await saveArchive();
    window.print();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Generator Surat</h1>
          <p className="text-sm text-muted-foreground">Buat surat resmi GEN-CB dengan penomoran otomatis & bantuan AI.</p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="outline" onClick={doPrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Button variant="outline" disabled={exporting !== null} onClick={exportDOCX}>
            {exporting === "docx" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />} DOCX
          </Button>
          <Button disabled={exporting !== null} onClick={exportPDF}>
            {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileDown className="h-4 w-4 mr-1" />} PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4 no-print">
          <Card>
            <CardHeader><CardTitle className="text-base">Detail Surat</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Jenis Surat</Label>
                  <Select value={typeCode} onValueChange={setTypeCode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LETTER_TYPES.map((t) => <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tanggal</Label>
                  <Input type="date" value={letterDate} onChange={(e) => setLetterDate(e.target.value)} />
                </div>
              </div>
              <div className="rounded-md border bg-muted/40 p-2 flex items-center justify-between">
                <div className="text-xs">
                  <div className="text-muted-foreground">Nomor Surat</div>
                  <div className="font-mono font-semibold">{letterNumber}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={doReserve}><RefreshCcw className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-1.5">
                <Label>Perihal</Label>
                <Input value={form.perihal} onChange={(e) => upd("perihal", e.target.value)} placeholder="Undangan Rapat Koordinasi" />
              </div>
              <div className="space-y-1.5">
                <Label>Lampiran</Label>
                <Input value={form.lampiran} onChange={(e) => upd("lampiran", e.target.value)} placeholder="1 (satu) berkas — opsional" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Kepada</Label>
                  <Input value={form.kepada} onChange={(e) => upd("kepada", e.target.value)} placeholder="Bapak/Ibu ..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Instansi</Label>
                  <Input value={form.instansi} onChange={(e) => upd("instansi", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Alamat / di —</Label>
                <Input value={form.alamat} onChange={(e) => upd("alamat", e.target.value)} placeholder="Tempat" />
              </div>
              <div className="space-y-1.5">
                <Label>Tempat Surat Dibuat</Label>
                <Input value={form.tempat_surat} onChange={(e) => upd("tempat_surat", e.target.value)} placeholder="Kota, misal: Bandung" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-foreground" /> Draft AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea rows={2} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder='Contoh: "Surat permohonan peminjaman sound system untuk kegiatan pelatihan"' />
              <Button className="w-full" disabled={aiLoading} onClick={runAI}>
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />} Buat Isi Surat dengan AI
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Isi Surat</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea rows={10} value={form.isi_surat} onChange={(e) => upd("isi_surat", e.target.value)} placeholder="Isi surat dalam Bahasa Indonesia formal..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Detail Acara (opsional)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Hari</Label><Input value={form.hari} onChange={(e) => upd("hari", e.target.value)} placeholder="Sabtu" /></div>
              <div className="space-y-1.5"><Label>Tanggal</Label><Input type="date" value={form.tanggal_acara} onChange={(e) => upd("tanggal_acara", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Waktu</Label><Input value={form.jam} onChange={(e) => upd("jam", e.target.value)} placeholder="09.00 WIB - selesai" /></div>
              <div className="space-y-1.5"><Label>Tempat</Label><Input value={form.tempat} onChange={(e) => upd("tempat", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Penandatangan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Jabatan (kanan)</Label>
                <Input value={form.jabatan} onChange={(e) => upd("jabatan", e.target.value)} />
              </div>
              <Textarea rows={3} value={form.penutup} onChange={(e) => upd("penutup", e.target.value)} />
              <p className="text-xs text-muted-foreground">Nama & TTD diambil dari halaman Pengaturan.</p>
            </CardContent>
          </Card>

          <Button variant="secondary" className="w-full" disabled={saving} onClick={saveArchive}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {savedId ? "Update Arsip & Generate QR" : "Simpan ke Arsip & Generate QR"}
          </Button>
        </div>

        <div className="min-w-0">
          <div className="rounded-2xl border bg-muted/30 p-4 overflow-auto">
            <div className="print-area origin-top-left" style={{ transform: "scale(0.78)", transformOrigin: "top left", width: "210mm" }}>
              {org && <LetterPreview ref={previewRef} data={letterData} org={org} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}