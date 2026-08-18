import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Profile, UserRole } from "@/lib/rapat.types";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "gencb.session";
const USER_KEY = "gencb.active_user_id";

// Admin Tunggal GEN-CB: Muhammad Raditya Anwar
// Seluruh pengurus lainnya: Role PENGURUS
export const SAMPLE_PROFILES: Profile[] = [
  {
    id: "usr-admin-radit",
    full_name: "Muhammad Raditya Anwar",
    email: "yayasangencb@gmail.com",
    whatsapp: "085772202454",
    role: "ADMIN",
    position: "Admin GEN-CB / Sekretaris Jenderal",
    bidang: "Pengurus Harian",
    divisi: "Administrasi Utama",
    photo_url: "",
    is_active: true,
    joined_date: "2024-01-10",
  },
  {
    id: "usr-edi-mulyadi",
    full_name: "Edi Mulyadi",
    email: "edi.mulyadi@gencb.org",
    whatsapp: "081234567890",
    role: "PENGURUS",
    position: "Ketua Umum",
    bidang: "Pengurus Harian",
    divisi: "Pimpinan",
    photo_url: "",
    is_active: true,
    joined_date: "2024-01-10",
  },
  {
    id: "usr-abi-bayu",
    full_name: "Abi Bayu Pamungkas",
    email: "abi.bayu@gencb.org",
    whatsapp: "082345678901",
    role: "PENGURUS",
    position: "Koordinator",
    bidang: "Bidang Pemuda & Olahraga",
    divisi: "Divisi Acara",
    photo_url: "",
    is_active: true,
    joined_date: "2024-02-15",
  },
  {
    id: "usr-fadlan",
    full_name: "Muhammad Fadlan Abdillah",
    email: "fadlan@gencb.org",
    whatsapp: "083456789012",
    role: "PENGURUS",
    position: "Bendahara",
    bidang: "Pengurus Harian",
    divisi: "Keuangan & Logistik",
    photo_url: "",
    is_active: true,
    joined_date: "2024-03-01",
  },
  {
    id: "usr-siti-rahma",
    full_name: "Siti Rahmawati",
    email: "siti.rahma@gencb.org",
    whatsapp: "084567890123",
    role: "PENGURUS",
    position: "Anggota",
    bidang: "Bidang Pendidikan",
    divisi: "Divisi Kurikulum",
    photo_url: "",
    is_active: true,
    joined_date: "2024-04-12",
  },
  {
    id: "usr-budi-santoso",
    full_name: "Budi Santoso",
    email: "budi.santoso@gencb.org",
    whatsapp: "085678901234",
    role: "PENGURUS",
    position: "Anggota",
    bidang: "Bidang Pemuda & Olahraga",
    divisi: "Divisi Perlengkapan",
    photo_url: "",
    is_active: true,
    joined_date: "2024-05-01",
  },
];

type AuthState = {
  isAuthenticated: boolean;
  ready: boolean;
  user: Profile | null;
  role: UserRole;
  allProfiles: Profile[];
  login: (email: string, password?: string) => { ok: boolean; error?: string };
  logout: () => void;
  switchProfile: (profileId: string) => void;
  refreshProfiles: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>(SAMPLE_PROFILES);
  const [currentUser, setCurrentUser] = useState<Profile | null>(SAMPLE_PROFILES[0]);

  const seedProfilesIfNeeded = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*");
      if (!error && data && data.length > 0) {
        setProfiles(data as Profile[]);
        const savedUserId = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
        const match = data.find((p) => p.id === savedUserId) || data[0];
        setCurrentUser(match as Profile);
      } else {
        await supabase.from("profiles").insert(SAMPLE_PROFILES as never);
      }
    } catch {}
  };

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setAuth(window.localStorage.getItem(STORAGE_KEY) === "1");
        const savedId = window.localStorage.getItem(USER_KEY);
        if (savedId) {
          const found = profiles.find((p) => p.id === savedId);
          if (found) setCurrentUser(found);
        }
      }
    } catch {}
    seedProfilesIfNeeded().finally(() => setReady(true));
  }, []);

  const switchProfile = (profileId: string) => {
    const target = profiles.find((p) => p.id === profileId);
    if (target) {
      setCurrentUser(target);
      try {
        window.localStorage.setItem(USER_KEY, target.id);
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      setAuth(true);
    }
  };

  const refreshProfiles = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (!error && data && data.length > 0) {
        setProfiles(data as Profile[]);
        if (currentUser) {
          const updated = data.find((p) => p.id === currentUser.id);
          if (updated) setCurrentUser(updated as Profile);
        }
      }
    } catch {}
  };

  const login = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const match = profiles.find((p) => p.email.toLowerCase() === cleanEmail);

    if (match) {
      setCurrentUser(match);
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
        window.localStorage.setItem(USER_KEY, match.id);
      } catch {}
      setAuth(true);
      return { ok: true };
    }

    if (cleanEmail === "yayasangencb@gmail.com") {
      setCurrentUser(SAMPLE_PROFILES[0]);
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
        window.localStorage.setItem(USER_KEY, SAMPLE_PROFILES[0].id);
      } catch {}
      setAuth(true);
      return { ok: true };
    }

    return { ok: false, error: "Email pengurus tidak terdaftar." };
  };

  const logout = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {}
    setAuth(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        ready,
        user: currentUser,
        role: currentUser?.role || "PENGURUS",
        allProfiles: profiles,
        login,
        logout,
        switchProfile,
        refreshProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}