import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LETTER_TYPES } from "@/lib/brand";
import { useMemo, useState } from "react";
import { FileText, Search, Loader2 } from "lucide-react";

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
  created_at: string;
};

function ArsipPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [date, setDate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["letters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letters" as never)
        .select("id, letter_number, letter_type, letter_date, perihal, kepada, instansi, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LetterRow[];
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
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">Arsip</h1>
        <p className="text-muted-foreground">Semua surat & flayer yang pernah dibuat.</p>
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
              <Link key={r.id} to="/verify/$id" params={{ id: r.id }} className="block">
                <Card className="hover:shadow-md transition">
                  <CardContent className="flex flex-wrap items-center gap-4 py-4">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{r.perihal}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        <span className="font-mono">{r.letter_number}</span> · {typeLabel} · {new Date(r.letter_date).toLocaleDateString("id-ID")}
                      </div>
                      {(r.kepada || r.instansi) && (
                        <div className="text-xs text-muted-foreground truncate">
                          Kepada: {[r.kepada, r.instansi].filter(Boolean).join(" — ")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}