import { useUsers } from "./api";
import { CreateUserDialog } from "./CreateUserDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ROLE_LABEL: Record<string, string> = {
  Admin: "Admin",
  ProjectManager: "Arquitecto / PM",
  Supervisor: "Supervisor",
};

export function UsersPage() {
  const { data: users, isLoading, isError } = useUsers();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-display font-semibold">Usuarios</h1>
        <CreateUserDialog />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando usuarios...</p>}
      {isError && <p className="text-sm text-destructive">No se pudieron cargar los usuarios.</p>}

      {users && users.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((appUser) => (
              <TableRow key={appUser.id}>
                <TableCell className="font-medium">{appUser.fullName}</TableCell>
                <TableCell>{appUser.email}</TableCell>
                <TableCell className="flex gap-1">
                  {appUser.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {ROLE_LABEL[role] ?? role}
                    </Badge>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
