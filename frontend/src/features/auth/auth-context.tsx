import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { apiClient } from "@/lib/api-client";

interface AuthUser {
  email: string;
  fullName: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "arquiflow.token";
const USER_KEY = "arquiflow.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post<{
      token: string;
      email: string;
      fullName: string;
      roles: string[];
    }>("/api/auth/login", { email, password });

    localStorage.setItem(TOKEN_KEY, data.token);
    const authUser: AuthUser = { email: data.email, fullName: data.fullName, roles: data.roles };
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
