import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { MeetingTask, Meeting } from "@/lib/rapat.types";
import { formatIdDate } from "@/lib/brand";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Calendar, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tugas")({
  head: () => ({ meta: [{ title: "Tugas Saya — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <TugasSayaPage />
    </RequireAuth>
  ),
});

function TugasSayaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myTasks, isLoading } = useQuery({
    queryKey: ["my_tasks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("meeting_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MeetingTask[];
    },
    enabled: !!user?.id,
  });

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Selesai" ? "Belum Selesai" : "Selesai";
    try {
      await supabase.from("meeting_tasks").update({ status: nextStatus }).eq("id", taskId);
      toast.success(`Status tugas diubah menjadi ${nextStatus}`);
      queryClient.invalidateQueries({ queryKey: ["my_tasks", user?.id] });
    } catch (e) {
      toast.error("Gagal mengubah status tugas");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <CheckSquare className="h-7 w-7 text-primary" /> Tugas Saya (Action Items)
        </h1>
        <p className="text-sm text-muted-foreground">
          Daftar tugas & tindak lanjut hasil keputusan rapat yang dialokasikan kepada Anda.
        </p>
      </div>

      {isLoading ? (
        <div className="p-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !myTasks || myTasks.length === 0 ? (
        <Card border-dashed className="p-12 text-center text-muted-foreground">
          <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Belum ada action item yang ditugaskan kepada Anda saat ini.
        </Card>
      ) : (
        <div className="space-y-3">
          {myTasks.map((t) => (
            <Card key={t.id} className="hover:shadow-xs transition">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant={t.status === "Selesai" ? "default" : "outline"}
                    className="h-8 px-3 text-xs shrink-0"
                    onClick={() => handleToggleTaskStatus(t.id, t.status)}
                  >
                    {t.status === "Selesai" ? "✓ Selesai" : "Tandai Selesai"}
                  </Button>
                  <div>
                    <div className={`font-bold text-base ${t.status === "Selesai" ? "line-through text-muted-foreground" : ""}`}>
                      {t.title}
                    </div>
                    {t.deadline && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" /> Deadline: {formatIdDate(t.deadline)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={t.status === "Selesai" ? "default" : "secondary"}>
                    {t.status}
                  </Badge>
                  <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                    <Link to="/rapat/$id" params={{ id: t.meeting_id }}>
                      Rapat <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
