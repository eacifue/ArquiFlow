import { toast } from "sonner";
import { useDeleteExpense, useExpenses } from "./api";
import { resolveFileUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

interface ExpensesListProps {
  projectId: string;
  budgetItemId: string;
  canManage: boolean;
}

export function ExpensesList({ projectId, budgetItemId, canManage }: ExpensesListProps) {
  const { data: expenses, isLoading } = useExpenses(budgetItemId, true);
  const deleteExpense = useDeleteExpense(projectId, budgetItemId);

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await deleteExpense.mutateAsync(expenseId);
      toast.success("Gasto eliminado");
    } catch {
      toast.error("No se pudo eliminar el gasto");
    }
  };

  if (isLoading) {
    return <p className="py-2 text-sm text-muted-foreground">Cargando gastos...</p>;
  }

  if (!expenses || expenses.length === 0) {
    return <p className="py-2 text-sm text-muted-foreground">Todavía no hay gastos cargados para este ítem.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Comprobante</TableHead>
          {canManage && <TableHead className="w-0" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>{expense.date}</TableCell>
            <TableCell>{expense.description ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{currency.format(expense.amount)}</TableCell>
            <TableCell>
              {expense.receiptFileUrl ? (
                <a
                  href={resolveFileUrl(expense.receiptFileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Ver
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>
            {canManage && (
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                  Eliminar
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
