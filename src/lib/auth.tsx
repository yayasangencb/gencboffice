import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "gencb.session";
const VALID_EMAIL = "yayasangencb@gmail.com";
const VALID_PASSWORD = "Generasicerdasberaksi_";

type AuthState = {
  isAuthenticated: boolean;
  ready: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setAuth(window.localStorage.getItem(STORAGE_KEY) === "1");
      }
    } catch {}
    setReady(true);
  }, []);

  const login = (email: string, password: string) => {
    if (email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASSWORD) {
      try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      setAuth(true);
      return { ok: true };
    }
    return { ok: false, error: "Email atau Password salah." };
  };

  const logout = () => {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    setAuth(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}