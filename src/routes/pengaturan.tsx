import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOrganization, saveOrganization, fileToDataUrl, type Organization } from "@/lib/org";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export const Route = createFileRoute("/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["org"], queryFn: fetchOrganization });
  const [form, setForm] = useState<Organization | null>(null);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async (patch: Partial<Organization>) => {
      if (!form) return;
      await saveOrganization(form.id, patch);
    },
    onSuccess: () => {
      toast.success("Pengaturan disimpan");
      qc.invalidateQueries({ queryKey: ["org"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !form) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const upd = (k: keyof Organization, v: string) => setForm({ ...form, [k]: v });

  const uploadImage = async (k: keyof Organization, f: File | null) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error("Ukuran maksimal 2MB");
    const url = await fileToDataUrl(f);
    upd(k, url);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Data organisasi otomatis dipakai saat generate surat.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Identitas Organisasi</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nama Organisasi</Label>
            <Input value={form.name} onChange={(e) => upd("name", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Alamat</Label>
            <Textarea value={form.address} onChange={(e) => upd("address", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>No HP</Label>
            <Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => upd("email", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => upd("website", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Pengurus & Tanda Tangan</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nama Ketua</Label>
            <Input value={form.ketua_name} onChange={(e) => upd("ketua_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nama Sekretaris</Label>
            <Input value={form.sekretaris_name} onChange={(e) => upd("sekretaris_name", e.target.value)} />
          </div>
          <ImageField label="TTD Ketua" value={form.ttd_ketua_url} onFile={(f) => uploadImage("ttd_ketua_url", f)} onClear={() => upd("ttd_ketua_url", "")} />
          <ImageField label="TTD Sekretaris" value={form.ttd_sekretaris_url} onFile={(f) => uploadImage("ttd_sekretaris_url", f)} onClear={() => upd("ttd_sekretaris_url", "")} />
          <ImageField label="Logo Organisasi (opsional, default: logo GEN-CB)" value={form.logo_url} onFile={(f) => uploadImage("logo_url", f)} onClear={() => upd("logo_url", "")} />
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button disabled={save.isPending} onClick={() => save.mutate(form)}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Pengaturan"}
        </Button>
      </div>
    </div>
  );
}

function ImageField({
  label,
  value,
  onFile,
  onClear,
}: {
  label: string;
  value: string;
  onFile: (f: File | null) => void;
  onClear: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : value
              ? "border-border bg-card hover:border-primary/50"
              : "border-muted-foreground/30 bg-muted/40 hover:bg-muted/70 hover:border-primary/50"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {value ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-20 w-32 rounded-lg border bg-white/90 p-1 flex items-center justify-center overflow-hidden shadow-sm">
              <img src={value} alt={label} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex items-center gap-2 z-10">
              <span className="text-xs text-muted-foreground">Klik atau drag gambar baru untuk mengganti</span>
              <button
                type="button"
                className="text-xs text-destructive hover:underline font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-center py-2">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              {isDragging ? "Lepaskan file di sini" : "Drag & Drop gambar di sini"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              atau <span className="text-primary font-medium underline">Pilih file</span> (PNG, JPG, maks 2MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}