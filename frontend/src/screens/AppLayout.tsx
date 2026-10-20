import { createContext, useContext, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useMatch } from "react-router-dom";
import { ROLE_LABEL, useAuth, usePermissions } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Icon, type IconName } from "@/ui/Icon";

const NavContext = createContext<{ openNav: () => void }>({ openNav: () => {} });

/** Las pantallas con encabezado propio en celular (detalle de obra) abren el menú con esto. */
export function useNav() {
  return useContext(NavContext);
}

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

function Sidebar({ items }: { items: NavItem[] }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const role = user?.roles[0];
  const roleLine = [role ? ROLE_LABEL[role] : null, user?.studioName || null].filter(Boolean).join(" · ");

  return (
    <aside className="app-sidebar">
      <div className="app-brand">ArquiFlow</div>
      <nav aria-label="Principal" className="app-nav">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-item">
            <Icon name={item.icon} size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div ref={menuRef} style={{ marginTop: "auto", position: "relative" }}>
        {menuOpen ? (
          <div className="af-dialog" role="menu" style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 8, padding: 4 }}>
            <button type="button" role="menuitem" className="af-btn af-btn--ghost af-btn--md af-btn--block" style={{ justifyContent: "flex-start" }} onClick={toggle}>
              <Icon name={theme === "dark" ? "sun" : "moon"} />
              <span>{theme === "dark" ? "Tema claro" : "Tema oscuro"}</span>
            </button>
            <button type="button" role="menuitem" className="af-btn af-btn--ghost af-btn--md af-btn--block" style={{ justifyContent: "flex-start" }} onClick={logout}>
              <span>Cerrar sesión</span>
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className="app-user"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{ width: "100%", background: "none", border: 0, borderTop: "1px solid var(--sidebar-border)", textAlign: "left", cursor: "pointer", color: "inherit" }}
        >
          <span className="app-user__name">{user?.fullName}</span>
          <span className="app-user__role">{roleLine}</span>
        </button>
      </div>
    </aside>
  );
}

export function AppLayout() {
  const { isAdmin, isManager } = usePermissions();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const inProject = useMatch("/obras/:id/*");

  useEffect(() => setNavOpen(false), [location.pathname]);

  const items: NavItem[] = [
    ...(isManager ? [{ to: "/inicio", label: "Inicio", icon: "house" }] : []),
    { to: "/obras", label: "Obras", icon: "building" },
    ...(isManager ? [{ to: "/proveedores", label: "Proveedores", icon: "truck" }] : []),
    ...(isAdmin ? [{ to: "/usuarios", label: "Usuarios", icon: "users" }] : []),
    ...(isAdmin ? [{ to: "/maestro-tareas", label: "Maestro de tareas", icon: "list-checks" }] : []),
  ];

  return (
    <NavContext.Provider value={{ openNav: () => setNavOpen(true) }}>
      <div className="app-shell">
        <Sidebar items={items} />
        {!inProject ? (
          <header className="app-topbar">
            <button type="button" className="m-icon-btn" aria-label="Abrir menú" onClick={() => setNavOpen(true)}>
              <Icon name="menu" size={22} />
            </button>
            <span className="app-brand" style={{ padding: 0 }}>
              ArquiFlow
            </span>
          </header>
        ) : null}
        <Outlet />
      </div>
      {navOpen ? (
        <div className="app-drawer" onMouseDown={(e) => e.target === e.currentTarget && setNavOpen(false)}>
          <Sidebar items={items} />
        </div>
      ) : null}
    </NavContext.Provider>
  );
}
