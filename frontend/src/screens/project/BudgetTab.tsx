import { useState } from "react";
import { useBudgetItems } from "@/api/work";
import type { BudgetItem as BudgetItemData, Project } from "@/api/types";
import { usePermissions } from "@/lib/auth";
import { formatARS, formatPct, plural } from "@/lib/format";
import { BudgetItem, Button, EmptyState, Skeleton, Stat } from "@/ui/ds";
import { BudgetItemFormDialog, ExpenseFormDialog } from "./forms";

const RISK_RATIO = 0.9;

function ratioOf(item: BudgetItemData) {
  return item.budgetedAmount > 0 ? item.spentAmount / item.budgetedAmount : item.spentAmount > 0 ? Infinity : 0;
}

export function BudgetTab({ project }: { project: Project }) {
  const { isManager, canLogSite } = usePermissions();
  const { data: items = [], isLoading, isError } = useBudgetItems(project.id);
  const [itemDialog, setItemDialog] = useState<{ item?: BudgetItemData } | null>(null);
  const [expenseFor, setExpenseFor] = useState<{ budgetItemId?: string } | null>(null);
  const m = project.metrics;

  if (isLoading) return <Skeleton height={360} />;
  if (isError) return <EmptyState tone="error" icon="octagon-x" title="No se pudo cargar el presupuesto" description="Intentá de nuevo en un momento." />;

  const categories = m.categories;
  const max = Math.max(1, ...categories.map((c) => Math.max(c.budgeted, c.spent)));
  const consumed = m.budgeted > 0 ? (m.spent / m.budgeted) * 100 : 0;
  const available = m.budgeted - m.spent;
  const contingency = categories.find((c) => c.category === "Imprevistos");
  const categoryOrder = categories.map((c) => c.category);

  const sorted = [...items].sort((a, b) => {
    const rank = (i: BudgetItemData) => (ratioOf(i) > 1 ? 0 : ratioOf(i) >= RISK_RATIO ? 1 : 2);
    return (
      rank(a) - rank(b) ||
      categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) ||
      a.description.localeCompare(b.description)
    );
  });
  const openFirst = sorted[0] && ratioOf(sorted[0]) >= RISK_RATIO ? sorted[0].id : null;

  return (
    <>
      <section aria-label="Resumen de presupuesto" className="grid-stats">
        <Stat
          label="Presupuestado"
          value={formatARS(m.budgeted, { compact: true })}
          hint={`${plural(items.length, "partida", "partidas")} en ${plural(categories.length, "categoría", "categorías")}`}
        />
        <Stat label="Gastado" value={formatARS(m.spent, { compact: true })} hint={`${formatPct(consumed)} del total · avance ${formatPct(m.progress)}`} />
        <Stat
          label="Disponible"
          value={formatARS(available, { compact: true })}
          tone={available < 0 ? "danger" : undefined}
          hint={
            available < 0
              ? "El gasto superó lo presupuestado"
              : contingency
                ? `Incluye ${formatARS(Math.max(0, contingency.budgeted - contingency.spent), { compact: true })} de imprevistos`
                : "Sin fondo de imprevistos"
          }
        />
      </section>

      {categories.length ? (
        <section className="card card__pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="section__head">
            <h2 className="section-title">Presupuesto vs. gasto real</h2>
            <div className="legend">
              <span className="legend__item"><span className="legend__swatch" style={{ background: "var(--chart-2)" }} />Presupuestado</span>
              <span className="legend__item"><span className="legend__swatch" style={{ background: "var(--chart-1)" }} />Gastado real</span>
              <span className="legend__item"><span className="legend__swatch" style={{ background: "var(--chart-5)" }} />Excedido</span>
            </div>
          </div>
          <div role="img" aria-label="Barras de presupuestado y gastado real por categoría" className="bars">
            {categories.map((c) => {
              const r = c.budgeted > 0 ? c.spent / c.budgeted : 0;
              const over = c.spent > c.budgeted;
              return (
                <div key={c.category} className="bars__row">
                  <div className="bars__name">{c.category}</div>
                  <div className="bars__pair">
                    <div className="bars__bar" style={{ background: "var(--chart-2)", width: `${((c.budgeted / max) * 100).toFixed(1)}%` }} />
                    <div
                      className="bars__bar"
                      style={{ background: over ? "var(--chart-5)" : "var(--chart-1)", width: `${Math.max((c.spent / max) * 100, 0.4).toFixed(1)}%` }}
                    />
                  </div>
                  <div className="bars__nums">
                    <span className="af-num" style={{ fontSize: 13 }}>{formatARS(c.spent, { compact: true })}</span>
                    <span
                      className="af-num"
                      style={{
                        fontSize: 12,
                        color: r > 1 ? "var(--destructive-text)" : r >= RISK_RATIO ? "var(--warning-text)" : "var(--muted-foreground)",
                      }}
                    >
                      {`${Math.round(r * 100)} % de ${formatARS(c.budgeted, { compact: true })}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section__head">
          <h2 className="section-title">Partidas</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {isManager ? (
              <Button variant="outline" icon="plus" onClick={() => setItemDialog({})}>
                Nueva partida
              </Button>
            ) : null}
            {canLogSite && items.length ? (
              <Button icon="receipt" onClick={() => setExpenseFor({})}>
                Agregar gasto
              </Button>
            ) : null}
          </div>
        </div>
        {sorted.length === 0 ? (
          <EmptyState
            icon="folder"
            title="Todavía no hay partidas"
            description="Cargá las partidas del presupuesto para controlar el gasto real contra lo presupuestado."
            action={isManager ? <Button icon="plus" onClick={() => setItemDialog({})}>Nueva partida</Button> : null}
          />
        ) : (
          sorted.map((item) => (
            <BudgetItem
              key={item.id}
              categoria={item.category}
              descripcion={item.description}
              presupuestado={item.budgetedAmount}
              cantidad={item.quantity}
              unidad={item.unit}
              defaultOpen={item.id === openFirst}
              canAdd={canLogSite}
              onAddExpense={() => setExpenseFor({ budgetItemId: item.id })}
              extraActions={
                isManager ? (
                  <Button variant="ghost" size="sm" icon="pencil" onClick={() => setItemDialog({ item })}>
                    Editar partida
                  </Button>
                ) : null
              }
              gastos={item.expenses.map((e) => ({
                id: e.id,
                fecha: e.date,
                descripcion: e.description,
                proveedor: e.supplierName,
                monto: e.amount,
                comprobanteUrl: e.receiptFileUrl,
              }))}
            />
          ))
        )}
      </section>

      <BudgetItemFormDialog open={itemDialog != null} onClose={() => setItemDialog(null)} projectId={project.id} item={itemDialog?.item} />
      <ExpenseFormDialog
        open={expenseFor != null}
        onClose={() => setExpenseFor(null)}
        projectId={project.id}
        items={items}
        budgetItemId={expenseFor?.budgetItemId}
      />
    </>
  );
}
