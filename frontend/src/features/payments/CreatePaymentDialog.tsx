import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreatePayment, useProjectExpenses } from "./api";
import { useSuppliers } from "@/features/suppliers/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const NONE_EXPENSE = "__none__";

const schema = z.object({
  supplierId: z.string().min(1, "Requerido"),
  expenseId: z.string(),
  amount: z.coerce.number().positive("Debe ser mayor a 0"),
  date: z.string().min(1, "Requerido"),
  method: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreatePaymentDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const { data: suppliers } = useSuppliers();
  const { data: expenses } = useProjectExpenses(projectId, open);
  const createPayment = useCreatePayment(projectId);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0, 10), expenseId: NONE_EXPENSE, supplierId: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createPayment.mutateAsync({
        ...values,
        expenseId: values.expenseId === NONE_EXPENSE ? undefined : values.expenseId,
        method: values.method || undefined,
      });
      toast.success("Pago registrado");
      reset({ date: new Date().toISOString().slice(0, 10), expenseId: NONE_EXPENSE, supplierId: "", amount: 0, method: "" });
      setOpen(false);
    } catch {
      toast.error("No se pudo registrar el pago");
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
      <DialogTrigger render={<Button size="sm" />}>Nuevo pago</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago a proveedor</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <Select value={watch("supplierId")} onValueChange={(value) => setValue("supplierId", value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegir proveedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Vincular a un gasto (opcional)</Label>
            <Select value={watch("expenseId")} onValueChange={(value) => setValue("expenseId", value ?? NONE_EXPENSE)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_EXPENSE}>Sin vincular</SelectItem>
                {expenses?.map((expense) => (
                  <SelectItem key={expense.id} value={expense.id}>
                    {expense.budgetItemDescription} — {expense.date} (${expense.amount.toLocaleString("es-AR")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Monto</Label>
              <Input id="pay-amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-date">Fecha</Label>
              <Input id="pay-date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-method">Medio de pago</Label>
            <Input id="pay-method" placeholder="Ej: Transferencia" {...register("method")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending ? "Guardando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
