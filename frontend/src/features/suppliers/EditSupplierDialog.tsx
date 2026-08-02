import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateSupplier } from "./api";
import type { Supplier } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";

const schema = z.object({
  name: z.string().min(1, "Requerido").max(200),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  taxId: z.string().optional(),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditSupplierDialogProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSupplierDialog({ supplier, open, onOpenChange }: EditSupplierDialogProps) {
  const updateSupplier = useUpdateSupplier(supplier.id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: supplier.name,
      contactName: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      taxId: supplier.taxId ?? "",
      category: supplier.category ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: supplier.name,
      contactName: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      taxId: supplier.taxId ?? "",
      category: supplier.category ?? "",
    });
  }, [supplier, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateSupplier.mutateAsync({
        ...values,
        contactName: values.contactName || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        taxId: values.taxId || undefined,
        category: values.category || undefined,
      });
      toast.success("Proveedor actualizado");
      onOpenChange(false);
    } catch {
      toast.error("No se pudo actualizar el proveedor");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-sup-name">Nombre</Label>
            <Input id="edit-sup-name" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sup-contactName">Contacto</Label>
              <Input id="edit-sup-contactName" {...register("contactName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sup-phone">Teléfono</Label>
              <Input id="edit-sup-phone" {...register("phone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sup-email">Email</Label>
              <Input id="edit-sup-email" type="email" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sup-taxId">CUIT</Label>
              <Input id="edit-sup-taxId" {...register("taxId")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sup-category">Rubro</Label>
            <Input id="edit-sup-category" {...register("category")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateSupplier.isPending}>
              {updateSupplier.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
