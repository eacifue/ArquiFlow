import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateBudgetItem } from "./api";
import { BUDGET_CATEGORIES } from "./categories";
import type { BudgetItem } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";

const schema = z.object({
  category: z.enum(BUDGET_CATEGORIES),
  description: z.string().min(1, "Requerido").max(500),
  budgetedAmount: z.coerce.number().min(0, "No puede ser negativo"),
  unit: z.string().optional(),
  quantity: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditBudgetItemDialogProps {
  projectId: string;
  item: BudgetItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBudgetItemDialog({ projectId, item, open, onOpenChange }: EditBudgetItemDialogProps) {
  const updateBudgetItem = useUpdateBudgetItem(projectId, item.id);
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
      category: item.category as FormValues["category"],
      description: item.description,
      budgetedAmount: item.budgetedAmount,
      unit: item.unit ?? "",
      quantity: item.quantity ?? undefined,
    },
  });

  useEffect(() => {
    reset({
      category: item.category as FormValues["category"],
      description: item.description,
      budgetedAmount: item.budgetedAmount,
      unit: item.unit ?? "",
      quantity: item.quantity ?? undefined,
    });
  }, [item, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateBudgetItem.mutateAsync({ ...values, unit: values.unit || undefined });
      toast.success("Ítem actualizado");
      onOpenChange(false);
    } catch {
      toast.error("No se pudo actualizar el ítem");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar ítem de presupuesto</DialogTitle>
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
            <Label htmlFor="edit-bi-description">Descripción</Label>
            <Input id="edit-bi-description" {...register("description")} />
            <FieldError message={errors.description?.message} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-bi-budgetedAmount">Presupuestado</Label>
              <Input id="edit-bi-budgetedAmount" type="number" step="0.01" {...register("budgetedAmount")} />
              <FieldError message={errors.budgetedAmount?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bi-unit">Unidad</Label>
              <Input id="edit-bi-unit" placeholder="m², u, kg" {...register("unit")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-bi-quantity">Cantidad (opcional)</Label>
            <Input id="edit-bi-quantity" type="number" step="0.01" {...register("quantity")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateBudgetItem.isPending}>
              {updateBudgetItem.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
