import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import { useDeleteSupplier, useSuppliers } from "./api";
import { CreateSupplierDialog } from "./CreateSupplierDialog";
import { EditSupplierDialog } from "./EditSupplierDialog";
import type { Supplier } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SuppliersPage() {
  const { user } = useAuth();
  const { data: suppliers, isLoading, isError } = useSuppliers();
  const deleteSupplier = useDeleteSupplier();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const canManage = user?.roles.some((r) => r === "Admin" || r === "ProjectManager") ?? false;

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm(`¿Eliminar el proveedor "${supplier.name}"?`)) return;
    try {
      await deleteSupplier.mutateAsync(supplier.id);
      toast.success("Proveedor eliminado");
    } catch {
      toast.error("No se pudo eliminar (¿tiene pagos registrados?)");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Proveedores</h1>
        {canManage && <CreateSupplierDialog />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando proveedores...</p>}
      {isError && <p className="text-sm text-destructive">No se pudieron cargar los proveedores.</p>}
      {suppliers && suppliers.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no hay proveedores cargados.</p>
      )}

      {suppliers && suppliers.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rubro</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              {canManage && <TableHead className="w-0" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>
                  {supplier.category ? <Badge variant="secondary">{supplier.category}</Badge> : "—"}
                </TableCell>
                <TableCell>{supplier.contactName ?? "—"}</TableCell>
                <TableCell>{supplier.phone ?? "—"}</TableCell>
                <TableCell>{supplier.email ?? "—"}</TableCell>
                {canManage && (
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingSupplier(supplier)}>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(supplier)}>
                      Eliminar
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editingSupplier && (
        <EditSupplierDialog
          supplier={editingSupplier}
          open={Boolean(editingSupplier)}
          onOpenChange={(open) => !open && setEditingSupplier(null)}
        />
      )}
    </div>
  );
}
