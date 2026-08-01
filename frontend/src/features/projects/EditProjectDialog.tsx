import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateProject } from "./api";
import type { Project, ProjectStatus } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "Planning", label: "Planificación" },
  { value: "InProgress", label: "En curso" },
  { value: "OnHold", label: "En pausa" },
  { value: "Completed", label: "Completada" },
  { value: "Cancelled", label: "Cancelada" },
];

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  address: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.coerce.number().min(0, "No puede ser negativo"),
  status: z.enum(["Planning", "InProgress", "OnHold", "Completed", "Cancelled"]),
});

type FormValues = z.infer<typeof schema>;

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const updateProject = useUpdateProject(project.id);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name,
      address: project.address ?? "",
      description: project.description ?? "",
      startDate: project.startDate ?? "",
      endDate: project.endDate ?? "",
      totalBudget: project.totalBudget,
      status: project.status,
    },
  });

  useEffect(() => {
    reset({
      name: project.name,
      address: project.address ?? "",
      description: project.description ?? "",
      startDate: project.startDate ?? "",
      endDate: project.endDate ?? "",
      totalBudget: project.totalBudget,
      status: project.status,
    });
  }, [project, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProject.mutateAsync({
        ...values,
        address: values.address || undefined,
        description: values.description || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });
      toast.success("Obra actualizada");
      onOpenChange(false);
    } catch {
      toast.error("No se pudo actualizar la obra");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar obra</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input id="edit-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Dirección</Label>
            <Input id="edit-address" {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea id="edit-description" {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-startDate">Fecha de inicio</Label>
              <Input id="edit-startDate" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endDate">Fecha de fin</Label>
              <Input id="edit-endDate" type="date" {...register("endDate")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-totalBudget">Presupuesto total</Label>
              <Input id="edit-totalBudget" type="number" step="0.01" {...register("totalBudget")} />
              {errors.totalBudget && (
                <p className="text-sm text-destructive">{errors.totalBudget.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as ProjectStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateProject.isPending}>
              {updateProject.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
