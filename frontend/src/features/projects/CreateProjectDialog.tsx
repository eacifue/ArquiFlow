import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateProject } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  address: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.coerce.number().min(0, "No puede ser negativo"),
});

type FormValues = z.infer<typeof schema>;

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createProject.mutateAsync({
        ...values,
        address: values.address || undefined,
        description: values.description || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });
      toast.success("Obra creada");
      reset();
      setOpen(false);
    } catch {
      toast.error("No se pudo crear la obra");
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
      <DialogTrigger render={<Button />}>Nueva obra</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva obra</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker id="startDate" value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de fin</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <DatePicker id="endDate" value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalBudget">Presupuesto total</Label>
            <Input id="totalBudget" type="number" step="0.01" {...register("totalBudget")} />
            <FieldError message={errors.totalBudget?.message} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Creando..." : "Crear obra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
