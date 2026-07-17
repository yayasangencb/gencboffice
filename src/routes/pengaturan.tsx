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
  label, value, onFile, onClear,
}: { label: string; value: string; onFile: (f: File | null) => void; onClear: () => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-md border bg-muted grid place-items-center overflow-hidden">
          {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-1">
          <label className="cursor-pointer text-sm text-primary hover:underline">
            {value ? "Ganti gambar" : "Upload gambar"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          </label>
          {value && (
            <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={onClear}>
              Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}