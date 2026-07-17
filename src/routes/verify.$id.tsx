import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchOrganization } from "@/lib/org";
import { LetterPreview, type LetterData } from "@/components/letter-preview";
import { Loader2, ShieldCheck } from "lucide-react";
import { LOGO_URL } from "@/lib/brand";

export const Route = createFileRoute("/verify/$id")({
  head: () => ({ meta: [{ title: "Verifikasi Surat — GEN-CB" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { id } = Route.useParams();
  const { data: org } = useQuery({ queryKey: ["org"], queryFn: fetchOrganization });
  const { data, isLoading, error } = useQuery({
    queryKey: ["letter", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letters" as never)
        .select("id, letter_number, letter_date, perihal, payload, created_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { id: string; letter_number: string; letter_date: string; perihal: string; payload: LetterData; created_at: string } | null;
    },
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (error || !data) return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Surat tidak ditemukan</h1>
        <p className="text-muted-foreground">QR / tautan tidak valid atau surat sudah dihapus.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <div className="mb-6 rounded-2xl bg-card border p-5 flex items-center gap-4">
          <img src={LOGO_URL} alt="" className="h-12 w-12 object-contain" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" /> Surat Terverifikasi
            </div>
            <div className="text-lg font-bold truncate">{data.perihal}</div>
            <div className="text-xs text-muted-foreground font-mono">{data.letter_number}</div>
          </div>
        </div>
        <div className="overflow-auto rounded-xl border bg-white p-2">
          <div style={{ transform: "scale(0.9)", transformOrigin: "top left", width: "210mm" }}>
            {org && <LetterPreview data={data.payload} org={org} />}
          </div>
        </div>
      </div>
    </div>
  );
}