import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Building2Icon, ClipboardListIcon, MenuIcon, TruckIcon, UsersIcon, type LucideIcon } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

function SidebarNav({ navItems, onNavigate }: { navItems: NavItem[]; onNavigate?: () => void }) {
  return (
    <>
      <div className="mb-6 text-lg font-semibold">ArquiFlow</div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`
            }
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const canManageProjects = user?.roles.some((r) => r === "Admin" || r === "ProjectManager") ?? false;

  const navItems: NavItem[] = [
    { to: "/projects", label: "Obras", icon: Building2Icon },
    ...(canManageProjects ? [{ to: "/suppliers", label: "Proveedores", icon: TruckIcon }] : []),
    ...(user?.roles.includes("Admin") ? [{ to: "/users", label: "Usuarios", icon: UsersIcon }] : []),
    ...(user?.roles.includes("Admin")
      ? [{ to: "/task-types", label: "Maestro de tareas", icon: ClipboardListIcon }]
      : []),
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r bg-muted/30 p-4 lg:block">
        <SidebarNav navItems={navItems} />
      </aside>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent className="bg-muted/30" aria-label="Menú de navegación">
          <SidebarNav navItems={navItems} onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-2 border-b px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 lg:hidden"
            onClick={() => setNavOpen(true)}
          >
            <MenuIcon />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{user?.fullName}</span>
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="shrink-0" onClick={logout}>
            Cerrar sesión
          </Button>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
