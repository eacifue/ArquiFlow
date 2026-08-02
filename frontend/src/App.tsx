import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/routes/LoginPage";
import { AppLayout } from "@/routes/AppLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { ProjectsListPage } from "@/features/projects/ProjectsListPage";
import { ProjectDetailPage } from "@/features/projects/ProjectDetailPage";
import { UsersPage } from "@/features/users/UsersPage";
import { SuppliersPage } from "@/features/suppliers/SuppliersPage";
import { TaskTypesPage } from "@/features/tasktypes/TaskTypesPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/task-types" element={<TaskTypesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
