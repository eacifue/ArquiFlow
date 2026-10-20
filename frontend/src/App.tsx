import type { ReactNode } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { homePathFor, useAuth, usePermissions } from "@/lib/auth";
import { LoginScreen } from "@/screens/LoginScreen";
import { AppLayout } from "@/screens/AppLayout";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { ProjectsScreen } from "@/screens/ProjectsScreen";
import { ProjectScreen } from "@/screens/project/ProjectScreen";
import { PortalScreen } from "@/screens/PortalScreen";
import { SuppliersScreen } from "@/screens/SuppliersScreen";
import { UsersScreen } from "@/screens/UsersScreen";
import { TaskTypesScreen } from "@/screens/TaskTypesScreen";

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }
  return <Outlet />;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathFor(user!)} replace />;
}

/** El cliente solo usa el portal; el equipo interno nunca cae ahí por defecto. */
function TeamOnly() {
  const { isClient } = usePermissions();
  const { pathname } = useLocation();
  const id = pathname.match(/^\/obras\/([^/]+)/)?.[1];
  if (isClient) return <Navigate to={id ? `/portal/${id}` : "/portal"} replace />;
  return <Outlet />;
}

function Only({ when, children }: { when: boolean; children: ReactNode }) {
  return when ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  const { isAdmin, isManager } = usePermissions();

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/portal" element={<PortalScreen />} />
        <Route path="/portal/:id" element={<PortalScreen />} />
        <Route element={<TeamOnly />}>
          <Route element={<AppLayout />}>
            <Route path="/inicio" element={<Only when={isManager}><DashboardScreen /></Only>} />
            <Route path="/obras" element={<ProjectsScreen />} />
            <Route path="/obras/:id" element={<ProjectScreen />} />
            <Route path="/obras/:id/:tab" element={<ProjectScreen />} />
            <Route path="/proveedores" element={<Only when={isManager}><SuppliersScreen /></Only>} />
            <Route path="/usuarios" element={<Only when={isAdmin}><UsersScreen /></Only>} />
            <Route path="/maestro-tareas" element={<Only when={isAdmin}><TaskTypesScreen /></Only>} />
          </Route>
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  );
}

export default App;
