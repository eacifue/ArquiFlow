import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateBudgetItem } from "./api";
import { BUDGET_CATEGORIES } from "./categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/ui/field-error";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  category: z.enum(BUDGET_CATEGORIES),
  description: z.string().min(1, "Requerido").max(500),
  budgetedAmount: z.coerce.number().min(0, "No puede ser negativo"),
  unit: z.string().optional(),
  quantity: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateBudgetItemDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const createBudgetItem = useCreateBudgetItem(projectId);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "Materiales" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createBudgetItem.mutateAsync({
        ...values,
        unit: values.unit || undefined,
      });
      toast.success("Ítem de presupuesto creado");
      reset({ category: "Materiales", description: "", budgetedAmount: 0, unit: "", quantity: undefined });
      setOpen(false);
    } catch {
      toast.error("No se pudo crear el ítem");
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
      <DialogTrigger render={<Button size="sm" />}>Nuevo ítem</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ítem de presupuesto</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={watch("category")} onValueChange={(value) => setValue("category", value as FormValues["category"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bi-description">Descripción</Label>
            <Input id="bi-description" {...register("description")} />
            <FieldError message={errors.description?.message} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="bi-budgetedAmount">Presupuestado</Label>
              <Input id="bi-budgetedAmount" type="number" step="0.01" {...register("budgetedAmount")} />
              <FieldError message={errors.budgetedAmount?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bi-unit">Unidad</Label>
              <Input id="bi-unit" placeholder="m², u, kg" {...register("unit")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bi-quantity">Cantidad (opcional)</Label>
            <Input id="bi-quantity" type="number" step="0.01" {...register("quantity")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createBudgetItem.isPending}>
              {createBudgetItem.isPending ? "Creando..." : "Crear ítem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
