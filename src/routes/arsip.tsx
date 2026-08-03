import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LETTER_TYPES, formatIdDate } from "@/lib/brand";
import { useMemo, useState } from "react";
import { FileText, Search, Loader2, Plus, Pencil, Trash2, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/arsip")({
  head: () => ({ meta: [{ title: "Arsip — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <ArsipPage />
    </RequireAuth>
  ),
});

type LetterRow = {
  id: string;
  letter_number: string;
  letter_type: string;
  letter_date: string;
  perihal: string;
  kepada: string;
  instansi: string;
  alamat: string;
  isi_surat: string;
  created_at: string;
  qr_data: string | null;
  verify_url: string | null;
};

function ArsipPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [date, setDate] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<LetterRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["letters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letters" as never)
        .select("id, letter_number, letter_type, letter_date, perihal, kepada, instansi, alamat, isi_surat, created_at, qr_data, verify_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LetterRow[];
    },
  });

  const deleteLetter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("letters" as never).delete().eq("id" as never, id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Surat telah dihapus dari Arsip");
      qc.invalidateQueries({ queryKey: ["letters"] });
    },
    onError: (e: Error) => {
      toast.error("Gagal menghapus surat: " + e.message);
    },
  });

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((r) => {
      if (type !== "ALL" && r.letter_type !== type) return false;
      if (date && r.letter_date !== date) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          r.letter_number.toLowerCase().includes(s) ||
          r.perihal.toLowerCase().includes(s) ||
          (r.kepada || "").toLowerCase().includes(s) ||
          (r.instansi || "").toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [data, q, type, date]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Arsip Surat</h1>
          <p className="text-muted-foreground">Kelola, edit, dan hapus semua surat yang tersimpan.</p>
        </div>
        <Button asChild>
          <Link to="/surat">
            <Plus className="h-4 w-4 mr-1.5" /> Buat Surat Baru
          </Link>
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-3 pt-4 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nomor, perihal, penerima..." className="pl-9" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Jenis Surat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jenis</SelectItem>
              {LETTER_TYPES.map((t) => <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center text-muted-foreground">
          Belum ada surat yang tersimpan.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => {
            const typeLabel = LETTER_TYPES.find((t) => t.code === r.letter_type)?.label ?? r.letter_type;
            return (
              <Card key={r.id} className="hover:shadow-md transition">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-base">{r.perihal}</div>
                      <div className="text-xs md:text-sm text-muted-foreground truncate">
                        <span className="font-mono font-medium">{r.letter_number}</span> · {typeLabel} · {formatIdDate(r.letter_date)}
                      </div>
                      {(r.kepada || r.instansi) && (
                        <div className="text-xs text-muted-foreground truncate">
                          Kepada: {[r.kepada, r.instansi].filter(Boolean).join(" — ")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedDetail(r)}
                      title="Lihat Detail"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" asChild title="Buka Halaman Verifikasi">
                      <Link to="/verify/$id" params={{ id: r.id }} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/surat" search={{ id: r.id }}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Surat Dari Arsip?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Surat dengan nomor <strong className="font-mono">{r.letter_number}</strong> perihal "{r.perihal}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteLetter.mutate(r.id)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detail Surat Arsip</DialogTitle>
          </DialogHeader>
          {selectedDetail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3">
                <div>
                  <div className="text-xs text-muted-foreground">Nomor Surat</div>
                  <div className="font-mono font-semibold">{selectedDetail.letter_number}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tanggal</div>
                  <div className="font-semibold">{formatIdDate(selectedDetail.letter_date)}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Perihal</div>
                <div className="font-medium">{selectedDetail.perihal}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Penerima (Kepada & Instansi)</div>
                <div>{[selectedDetail.kepada, selectedDetail.instansi].filter(Boolean).join(" — ") || "-"}</div>
              </div>
              {selectedDetail.alamat && (
                <div>
                  <div className="text-xs text-muted-foreground">Alamat</div>
                  <div>{selectedDetail.alamat}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Ringkasan Isi Surat</div>
                <div className="whitespace-pre-wrap rounded-md border bg-background p-3 text-xs text-muted-foreground max-h-48 overflow-y-auto">
                  {selectedDetail.isi_surat}
                </div>
              </div>
              {selectedDetail.qr_data && (
                <div className="flex items-center gap-4 pt-2 border-t">
                  <img src={selectedDetail.qr_data} alt="QR Verification" className="h-20 w-20 border rounded" />
                  <div className="text-xs text-muted-foreground">
                    <div className="font-semibold text-foreground">QR Verifikasi Digital</div>
                    <div>Dapat di-scan untuk memverifikasi keaslian dokumen resmi GEN-CB.</div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/surat" search={{ id: selectedDetail.id }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit di Generator Surat
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}