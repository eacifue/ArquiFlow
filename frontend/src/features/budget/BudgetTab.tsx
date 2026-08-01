import { useAuth } from "@/features/auth/auth-context";
import { useBudgetItems } from "./api";
import { CreateBudgetItemDialog } from "./CreateBudgetItemDialog";
import { BudgetItemCard } from "./BudgetItemCard";
import { BudgetVsActualChart } from "./BudgetVsActualChart";
import { Card, CardContent } from "@/components/ui/card";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export function BudgetTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { data: items, isLoading, isError } = useBudgetItems(projectId);

  const canManage = user?.roles.some((r) => r === "Admin" || r === "ProjectManager") ?? false;
  const canAddExpense = canManage || (user?.roles.includes("Supervisor") ?? false);

  const totalBudgeted = items?.reduce((sum, item) => sum + item.budgetedAmount, 0) ?? 0;
  const totalSpent = items?.reduce((sum, item) => sum + item.spentAmount, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Presupuesto vs. gasto real</h2>
        {canManage && <CreateBudgetItemDialog projectId={projectId} />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando presupuesto...</p>}
      {isError && <p className="text-sm text-destructive">No se pudo cargar el presupuesto.</p>}

      {items && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no hay ítems de presupuesto cargados.</p>
      )}

      {items && items.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Presupuestado total</p>
                <p className="text-xl font-semibold tabular-nums">{currency.format(totalBudgeted)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Gastado total</p>
                <p className={`text-xl font-semibold tabular-nums ${totalSpent > totalBudgeted ? "text-destructive" : ""}`}>
                  {currency.format(totalSpent)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Disponible</p>
                <p className={`text-xl font-semibold tabular-nums ${totalSpent > totalBudgeted ? "text-destructive" : ""}`}>
                  {currency.format(totalBudgeted - totalSpent)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <BudgetVsActualChart items={items} />
            </CardContent>
          </Card>

          <div className="space-y-3">
            {items.map((item) => (
              <BudgetItemCard
                key={item.id}
                projectId={projectId}
                item={item}
                canManage={canManage}
                canAddExpense={canAddExpense}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
