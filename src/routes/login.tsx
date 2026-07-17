import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk — GEN-CB Office" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [ready, isAuthenticated, navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = login(email, password);
      setLoading(false);
      if (res.ok) {
        toast.success("Selamat datang di GEN-CB Office");
        navigate({ to: "/dashboard", replace: true });
      } else {
        toast.error(res.error ?? "Login gagal");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left brand panel */}
      <div
        className="hidden md:flex flex-col justify-between p-10 text-primary-foreground relative overflow-hidden"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="GEN-CB" className="h-12 w-12 object-contain drop-shadow-lg" />
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">Yayasan</div>
            <div className="font-black text-lg">Generasi Cerdas Beraksi</div>
          </div>
        </div>
        <div>
          <h1 className="text-5xl font-black leading-tight">
            GEN-CB<br />
            <span style={{ color: "var(--brand-orange)" }}>Office.</span>
          </h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Sistem internal untuk membuat surat resmi dan flayer rapat GEN-CB
            dengan cepat, rapi, dan konsisten.
          </p>
        </div>
        <div className="text-sm opacity-70">
          Bersama merencanakan kegiatan, bersama mewujudkan prestasi.
        </div>
        <div
          className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--brand-orange)" }}
        />
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-6 flex items-center gap-3">
            <img src={LOGO_URL} alt="GEN-CB" className="h-12 w-12 object-contain" />
            <div>
              <div className="text-xs text-muted-foreground">GEN-CB</div>
              <div className="text-lg font-black text-primary">OFFICE</div>
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Masuk</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan akun resmi Yayasan GEN-CB.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="yayasangencb@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{ background: "var(--gradient-brand)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}
            </Button>
          </form>
          <p className="mt-6 text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Yayasan Generasi Cerdas Beraksi
          </p>
        </div>
      </div>
    </div>
  );
}