import { useState } from "react";
import { toast } from "sonner";
import { useDeleteBudgetItem } from "./api";
import { EditBudgetItemDialog } from "./EditBudgetItemDialog";
import { CreateExpenseDialog } from "./CreateExpenseDialog";
import { ExpensesList } from "./ExpensesList";
import type { BudgetItem } from "./types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

interface BudgetItemCardProps {
  projectId: string;
  item: BudgetItem;
  canManage: boolean;
  canAddExpense: boolean;
}

export function BudgetItemCard({ projectId, item, canManage, canAddExpense }: BudgetItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteBudgetItem = useDeleteBudgetItem(projectId);

  const remaining = item.budgetedAmount - item.spentAmount;
  const overBudget = item.spentAmount > item.budgetedAmount;
  const pctUsed = item.budgetedAmount > 0 ? Math.round((item.spentAmount / item.budgetedAmount) * 100) : 0;

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar el ítem "${item.description}"? Esto también borra sus gastos.`)) return;
    try {
      await deleteBudgetItem.mutateAsync(item.id);
      toast.success("Ítem eliminado");
    } catch {
      toast.error("No se pudo eliminar el ítem");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{item.category}</Badge>
            {overBudget && <Badge variant="destructive">⚠ Sobre presupuesto</Badge>}
          </div>
          <p className="font-medium">{item.description}</p>
          {item.unit && item.quantity != null && (
            <p className="text-sm text-muted-foreground">
              {item.quantity} {item.unit}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteBudgetItem.isPending}>
              Eliminar
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Presupuestado</p>
            <p className="font-semibold tabular-nums">{currency.format(item.budgetedAmount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gastado ({pctUsed}%)</p>
            <p className={`font-semibold tabular-nums ${overBudget ? "text-destructive" : ""}`}>
              {currency.format(item.spentAmount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{remaining >= 0 ? "Restante" : "Excedido"}</p>
            <p className={`font-semibold tabular-nums ${remaining < 0 ? "text-destructive" : ""}`}>
              {currency.format(Math.abs(remaining))}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Ocultar gastos" : "Ver gastos"}
          </Button>
          {canAddExpense && <CreateExpenseDialog projectId={projectId} budgetItemId={item.id} />}
        </div>

        {expanded && <ExpensesList projectId={projectId} budgetItemId={item.id} canManage={canManage} />}
      </CardContent>

      <EditBudgetItemDialog projectId={projectId} item={item} open={editOpen} onOpenChange={setEditOpen} />
    </Card>
  );
}
