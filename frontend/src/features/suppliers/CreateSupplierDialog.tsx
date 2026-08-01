import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateSupplier } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().min(1, "Requerido").max(200),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  taxId: z.string().optional(),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateSupplierDialog() {
  const [open, setOpen] = useState(false);
  const createSupplier = useCreateSupplier();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createSupplier.mutateAsync({
        ...values,
        contactName: values.contactName || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        taxId: values.taxId || undefined,
        category: values.category || undefined,
      });
      toast.success("Proveedor creado");
      reset();
      setOpen(false);
    } catch {
      toast.error("No se pudo crear el proveedor");
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger render={<Button />}>Nuevo proveedor</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="sup-name">Nombre</Label>
            <Input id="sup-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sup-contactName">Contacto</Label>
              <Input id="sup-contactName" {...register("contactName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sup-phone">Teléfono</Label>
              <Input id="sup-phone" {...register("phone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sup-email">Email</Label>
              <Input id="sup-email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sup-taxId">CUIT</Label>
              <Input id="sup-taxId" {...register("taxId")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sup-category">Rubro</Label>
            <Input id="sup-category" placeholder="Ej: Electricidad, Plomería" {...register("category")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? "Creando..." : "Crear proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
