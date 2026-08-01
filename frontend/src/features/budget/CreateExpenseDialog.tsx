import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateExpense } from "./api";
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
  amount: z.coerce.number().positive("Debe ser mayor a 0"),
  date: z.string().min(1, "Requerido"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateExpenseDialog({ projectId, budgetItemId }: { projectId: string; budgetItemId: string }) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createExpense = useCreateExpense(projectId, budgetItemId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createExpense.mutateAsync({
        ...values,
        receipt: fileInputRef.current?.files?.[0],
      });
      toast.success("Gasto registrado");
      reset({ date: new Date().toISOString().slice(0, 10), amount: 0, description: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
    } catch {
      toast.error("No se pudo registrar el gasto");
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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Agregar gasto</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar gasto</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exp-amount">Monto</Label>
              <Input id="exp-amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-date">Fecha</Label>
              <Input id="exp-date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp-description">Descripción</Label>
            <Input id="exp-description" placeholder="Ej: factura de cemento" {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp-receipt">Comprobante (foto o PDF)</Label>
            <Input id="exp-receipt" type="file" accept="image/*,.pdf" ref={fileInputRef} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending ? "Guardando..." : "Registrar gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
