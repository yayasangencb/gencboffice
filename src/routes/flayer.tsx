import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/flayer")({
  head: () => ({ meta: [{ title: "Generator Flayer — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <FlayerStub />
    </RequireAuth>
  ),
});

function FlayerStub() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Card>
        <CardContent className="p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "var(--gradient-accent)" }}>
            <ImageIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-black">Generator Flayer Rapat</h1>
          <p className="mt-2 text-muted-foreground">
            Modul ini sedang disiapkan. Template flayer GEN-CB, live preview,
            dan export PNG/JPG/PDF akan hadir di update berikutnya.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}