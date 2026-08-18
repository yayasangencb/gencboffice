import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Profile } from "@/lib/rapat.types";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  Edit,
  Shield,
  Phone,
  Mail,
  BarChart2,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  Calendar,
  Key,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/pengurus/")({
  head: () => ({ meta: [{ title: "Manajemen Pengurus — GEN-CB Office" }] }),
  component: () => (
    <RequireAuth>
      <ManajemenPengurusPage />
    </RequireAuth>
  ),
});

function ManajemenPengurusPage() {
  const queryClient = useQueryClient();
  const { refreshProfiles } = useAuth();

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [statsUser, setStatsUser] = useState<Profile | null>(null);

  // Form State for Add/Edit
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loginPassword, setLoginPassword] = useState("gencb123");
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<"ADMIN" | "PENGURUS">("PENGURUS");
  const [position, setPosition] = useState("Anggota");
  const [bidang, setBidang] = useState("Bidang Pemuda & Olahraga");
  const [divisi, setDivisi] = useState("Divisi Acara");
  const [saving, setSaving] = useState(false);

  // Delete User State
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeletingUser(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", deletingUser.id);

      if (error) throw error;

      toast.success(`Akun pengurus "${deletingUser.name}" berhasil dihapus.`);
      setDeletingUser(null);
      queryClient.invalidateQueries({ queryKey: ["all_profiles_manage"] });
      queryClient.invalidateQueries({ queryKey: ["all_attendance_stats"] });
      refreshProfiles();
    } catch (e) {
      toast.error("Gagal menghapus pengurus: " + (e as Error).message);
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Fetch Profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["all_profiles_manage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch All Attendance Records for % Calculations
  const { data: allAttendance } = useQuery({
    queryKey: ["all_attendance_stats"],
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("user_id, status");
      return data || [];
    },
  });

  // Calculate stats map per user
  const userStatsMap = useMemo(() => {
    const map: Record<string, { total: number; hadir: number; terlambat: number; izin: number; alfa: number; percent: number }> = {};
    (allAttendance || []).forEach((a) => {
      if (!map[a.user_id]) {
        map[a.user_id] = { total: 0, hadir: 0, terlambat: 0, izin: 0, alfa: 0, percent: 0 };
      }
      const st = map[a.user_id];
      st.total += 1;
      if (a.status === "HADIR") st.hadir += 1;
      else if (a.status === "TERLAMBAT") st.terlambat += 1;
      else if (a.status === "IZIN") st.izin += 1;
      else if (a.status === "ALFA") st.alfa += 1;
    });

    Object.keys(map).forEach((uId) => {
      const st = map[uId];
      if (st.total > 0) {
        st.percent = Math.round(((st.hadir + st.terlambat) / st.total) * 100);
      }
    });

    return map;
  }, [allAttendance]);

  const filtered = useMemo(() => {
    const list = profiles || [];
    return list.filter((p) => {
      if (roleFilter !== "ALL" && p.role !== roleFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          p.full_name.toLowerCase().includes(s) ||
          p.email.toLowerCase().includes(s) ||
          (p.position || "").toLowerCase().includes(s) ||
          (p.bidang || "").toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [profiles, q, roleFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFullName("");
    setEmail("");
    setWhatsapp("");
    setLoginPassword("gencb123");
    setShowPassword(false);
    setUserRole("PENGURUS");
    setPosition("Anggota");
    setBidang("Bidang Pemuda & Olahraga");
    setDivisi("Divisi Acara");
    setFormOpen(true);
  };

  const handleOpenEdit = (p: Profile) => {
    setEditingId(p.id);
    setFullName(p.full_name);
    setEmail(p.email);
    setWhatsapp(p.whatsapp || "");
    setLoginPassword(p.login_password || "gencb123");
    setShowPassword(false);
    setUserRole(p.role);
    setPosition(p.position || "Anggota");
    setBidang(p.bidang || "");
    setDivisi(p.divisi || "");
    setFormOpen(true);
  };

  const generateRandomPassword = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const pass = `Gencb${rand}!`;
    setLoginPassword(pass);
    toast.info(`Password dibuat: ${pass}`);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return toast.error("Nama dan Email wajib diisi");
    if (!loginPassword.trim()) return toast.error("Password akses wajib diisi");

    setSaving(true);
    try {
      if (editingId) {
        await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            email,
            whatsapp,
            login_password: loginPassword.trim(),
            role: userRole,
            position,
            bidang,
            divisi,
          })
          .eq("id", editingId);
        toast.success(`Akun ${fullName} berhasil diperbarui (Password diset)`);
      } else {
        await supabase.from("profiles").insert({
          full_name: fullName,
          email,
          whatsapp,
          login_password: loginPassword.trim(),
          role: userRole,
          position,
          bidang,
          divisi,
          is_active: true,
        });
        toast.success(`Akun Pengurus Baru ${fullName} berhasil dibuat!`);
      }

      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["all_profiles_manage"] });
      refreshProfiles();
    } catch (err) {
      toast.error("Gagal menyimpan data pengurus: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCredentials = (p: Profile) => {
    const text = `Halo ${p.full_name},\nBerikut kredensial login akun GEN-CB Office Anda:\n\nEmail: ${p.email}\nPassword: ${p.login_password || "gencb123"}\nLink Login: https://gencboffice.lovable.app/login`;
    navigator.clipboard.writeText(text);
    toast.success(`Kredensial login ${p.full_name} berhasil disalin ke clipboard!`);
  };

  const handleToggleActive = async (p: Profile) => {
    try {
      const nextActive = !p.is_active;
      await supabase.from("profiles").update({ is_active: nextActive }).eq("id", p.id);
      toast.success(`Status ${p.full_name} diubah menjadi ${nextActive ? "Aktif" : "Nonaktif"}`);
      queryClient.invalidateQueries({ queryKey: ["all_profiles_manage"] });
      refreshProfiles();
    } catch (e) {
      toast.error("Gagal mengubah status pengurus");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Manajemen Akun & Pengurus GEN-CB
          </h1>
          <p className="text-sm text-muted-foreground">
            Admin dapat membuatkan akun login (Email & Password), mengelola jabatan, dan menyalin kredensial akses.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="shadow-md">
          <UserPlus className="h-4 w-4 mr-1.5" /> Tambah Akun Pengurus Baru
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, email, jabatan, bidang..."
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger><SelectValue placeholder="Role Pengurus" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Role</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="PENGURUS">PENGURUS</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table Profiles */}
      {isLoading ? (
        <div className="p-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Nama Pengurus & Login</th>
                  <th className="p-3">Jabatan / Divisi</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Kehadiran Rapat</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi & Kredensial</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => {
                  const uStat = userStatsMap[p.id] || { total: 0, hadir: 0, percent: 100 };
                  return (
                    <tr key={p.id} className="hover:bg-muted/40 transition">
                      <td className="p-3">
                        <div className="font-bold text-sm text-foreground">{p.full_name}</div>
                        <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-primary"><Mail className="h-3 w-3" /> {p.email}</span>
                          <span className="flex items-center gap-1 font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            <Key className="h-3 w-3 text-muted-foreground" /> {p.login_password || "gencb123"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold">{p.position || "Anggota"}</div>
                        <div className="text-[11px] text-muted-foreground">{p.bidang} · {p.divisi}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={p.role === "ADMIN" ? "default" : "outline"} className="text-[10px] font-bold">
                          {p.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-primary">{uStat.percent}%</span>
                          <div className="w-20 bg-muted h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${uStat.percent}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">({uStat.hadir}/{uStat.total})</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={p.is_active ? "secondary" : "destructive"} className="text-[10px]">
                          {p.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2 text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                          onClick={() => handleCopyCredentials(p)}
                          title="Salin Kredensial Email & Password"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" /> Salin Akses
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setStatsUser(p)}
                          title="Lihat Stat Kehadiran"
                        >
                          <BarChart2 className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={p.is_active ? "destructive" : "secondary"}
                          className="h-7 px-2 text-[10px]"
                          onClick={() => handleToggleActive(p)}
                        >
                          {p.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        {p.role !== "ADMIN" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeletingUser({ id: p.id, name: p.full_name })}
                            title="Hapus Pengurus Permanen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Akun & Password Pengurus" : "Buat Akun Pengurus Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>Nama Lengkap Pengurus <span className="text-destructive">*</span></Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Contoh: Rizki Ramadhan" required />
            </div>

            <div className="space-y-1">
              <Label>Email Resmi Login <span className="text-destructive">*</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rizki@gencb.org" required />
            </div>

            {/* Password Login Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label>Password Akses Login <span className="text-destructive">*</span></Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] text-primary p-0"
                  onClick={generateRandomPassword}
                >
                  <Sparkles className="h-3 w-3 mr-1" /> Acak Password
                </Button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password akun..."
                  className="pr-10 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Nomor WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="0857..." />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Role Akses Sistem</Label>
                <Select value={userRole} onValueChange={(v) => setUserRole(v as "ADMIN" | "PENGURUS")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENGURUS">PENGURUS</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Jabatan</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Contoh: Koordinator" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Bidang Organisasi</Label>
              <Input value={bidang} onChange={(e) => setBidang(e.target.value)} placeholder="Contoh: Bidang Pemuda & Olahraga" />
            </div>

            <div className="space-y-1">
              <Label>Divisi</Label>
              <Input value={divisi} onChange={(e) => setDivisi(e.target.value)} placeholder="Contoh: Divisi Acara" />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Simpan & Buat Akun"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Individual Attendance Stats Modal */}
      {statsUser && (
        <Dialog open={!!statsUser} onOpenChange={() => setStatsUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rekap Kehadiran — {statsUser.full_name}</DialogTitle>
            </DialogHeader>
            {(() => {
              const st = userStatsMap[statsUser.id] || { total: 0, hadir: 0, terlambat: 0, izin: 0, alfa: 0, percent: 100 };
              return (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Persentase Kehadiran Rapat</div>
                      <div className="text-3xl font-black text-primary">{st.percent}%</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{statsUser.position}</div>
                      <div className="font-bold text-foreground">{statsUser.bidang}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 border rounded-md bg-emerald-50 text-emerald-700 font-bold">
                      Hadir: {st.hadir}
                    </div>
                    <div className="p-2 border rounded-md bg-amber-50 text-amber-700 font-bold">
                      Terlambat: {st.terlambat}
                    </div>
                    <div className="p-2 border rounded-md bg-blue-50 text-blue-700 font-bold">
                      Izin: {st.izin}
                    </div>
                    <div className="p-2 border rounded-md bg-rose-50 text-rose-700 font-bold">
                      Alfa: {st.alfa}
                    </div>
                  </div>
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatsUser(null)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Hapus Akun Pengurus Permanen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun pengurus <strong className="text-foreground">"{deletingUser?.name}"</strong>?
              <br /><br />
              ⚠️ <strong>Dampak Penghapusan:</strong> Akun pengurus dan seluruh riwayat presensinya akan terhapus permanen. Persentase statistik kehadiran organisasi akan otomatis dikalkulasi ulang!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteUser}
              disabled={isDeletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingUser ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Ya, Hapus Pengurus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
