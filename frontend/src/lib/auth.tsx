import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { apiClient } from "@/lib/api-client";

export type Role = "Admin" | "ProjectManager" | "Supervisor" | "Client";

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  roles: Role[];
  studioName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "arquiflow.token";
const USER_KEY = "arquiflow.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AuthUser;
    return { ...parsed, studioName: parsed.studioName ?? "" };
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email, password) => {
        const { data } = await apiClient.post<AuthUser & { token: string }>("/api/auth/login", { email, password });
        localStorage.setItem(TOKEN_KEY, data.token);
        const authUser: AuthUser = {
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          roles: data.roles,
          studioName: data.studioName ?? "",
        };
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        setUser(authUser);
        return authUser;
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export const ROLE_LABEL: Record<Role, string> = {
  Admin: "Admin",
  ProjectManager: "Project Manager",
  Supervisor: "Supervisor",
  Client: "Cliente",
};

export function usePermissions() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isManager = isAdmin || roles.includes("ProjectManager");
  const isSupervisor = roles.includes("Supervisor");
  const isClient = !isManager && !isSupervisor && roles.includes("Client");
  return {
    isAdmin,
    isManager,
    isSupervisor,
    isClient,
    canLogSite: isManager || isSupervisor,
    primaryRole: (roles[0] ?? "Client") as Role,
  };
}

/** Pantalla inicial según el rol. */
export function homePathFor(user: AuthUser) {
  if (user.roles.includes("Admin") || user.roles.includes("ProjectManager")) return "/inicio";
  if (user.roles.includes("Supervisor")) return "/obras";
  return "/portal";
}
