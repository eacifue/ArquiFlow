import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const { user, logout } = useAuth();

  const canManageProjects = user?.roles.some((r) => r === "Admin" || r === "ProjectManager") ?? false;

  const navItems = [
    { to: "/projects", label: "Obras" },
    ...(canManageProjects ? [{ to: "/suppliers", label: "Proveedores" }] : []),
    ...(user?.roles.includes("Admin") ? [{ to: "/users", label: "Usuarios" }] : []),
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r bg-muted/30 p-4">
        <div className="mb-6 text-lg font-semibold">ArquiFlow</div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm text-muted-foreground">{user?.fullName}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
