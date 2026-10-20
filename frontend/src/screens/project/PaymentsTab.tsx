import { useState } from "react";
import { usePayments, useSetPaymentStatus } from "@/api/work";
import type { Payment, Project } from "@/api/types";
import { formatARS, formatDate, plural } from "@/lib/format";
import { Button, EmptyState, Skeleton, Stat } from "@/ui/ds";
import { Segmented } from "@/ui/controls";
import { Icon } from "@/ui/Icon";
import { useConfirm, useToast } from "@/ui/overlay";
import { PaymentFormDialog } from "./forms";

type Filter = "Todos" | "Pendientes" | "Pagados";
const NO_SUPPLIER = "Sin proveedor";

export function PaymentsTab({ project }: { project: Project }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: payments = [], isLoading, isError } = usePayments(project.id);
  const setStatus = useSetPaymentStatus(project.id);
  const [filter, setFilter] = useState<Filter>("Todos");
  const [creating, setCreating] = useState(false);

  if (isLoading) return <Skeleton height={360} />;
  if (isError) return <EmptyState tone="error" icon="octagon-x" title="No se pudieron cargar los pagos" description="Intentá de nuevo en un momento." />;

  const paid = payments.filter((p) => p.status === "Paid");
  const pending = payments.filter((p) => p.status === "Pending");
  const paidTotal = paid.reduce((a, p) => a + p.amount, 0);
  const pendingTotal = pending.reduce((a, p) => a + p.amount, 0);
  const total = paidTotal + pendingTotal;

  const bySupplier = new Map<string, { name: string; paid: number; pending: number }>();
  for (const p of payments) {
    const name = p.supplierName ?? NO_SUPPLIER;
    const s = bySupplier.get(name) ?? { name, paid: 0, pending: 0 };
    if (p.status === "Paid") s.paid += p.amount;
    else s.pending += p.amount;
    bySupplier.set(name, s);
  }
  const balances = [...bySupplier.values()].sort((a, b) => b.pending - a.pending || b.paid - a.paid);
  const pendingSuppliers = balances.filter((s) => s.pending > 0).length;

  const visible = payments.filter((p) => filter === "Todos" || (filter === "Pagados" ? p.status === "Paid" : p.status === "Pending"));

  const toggle = async (p: Payment) => {
    const next = p.status === "Paid" ? "Pending" : "Paid";
    if (next === "Paid") {
      const ok = await confirm({
        title: "¿Marcar como pagado?",
        description: `${formatARS(p.amount)} a ${p.supplierName ?? NO_SUPPLIER}.`,
        confirmLabel: "Marcar como pagado",
      });
      if (!ok) return;
    }
    try {
      await setStatus.mutateAsync({ id: p.id, status: next });
      toast.success(next === "Paid" ? "Pago marcado como pagado" : "Pago marcado como pendiente", p.supplierName ?? undefined);
    } catch {
      toast.error("No se pudo cambiar el estado");
    }
  };

  return (
    <>
      <section aria-label="Resumen de pagos" className="grid-stats">
        <Stat label="Gastado" value={formatARS(total, { compact: true })} hint="Lo que la obra debe a proveedores" />
        <Stat
          label="Pagado"
          value={formatARS(paidTotal, { compact: true })}
          hint={`${plural(paid.length, "pago", "pagos")} · ${total > 0 ? Math.round((paidTotal / total) * 100) : 0} % de lo gastado`}
          tone="success"
        />
        <Stat
          label="Pendiente de pago"
          value={formatARS(pendingTotal, { compact: true })}
          hint={`${plural(pending.length, "pago", "pagos")} a ${plural(pendingSuppliers, "proveedor", "proveedores")}`}
          tone="warning"
        />
      </section>

      <div className="split">
        <section className="card card--col split__main">
          <div className="card__head">
            <div className="card__head-left">
              <h2 className="section-title">Pagos</h2>
              <Segmented<Filter>
                label="Filtrar por estado"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "Todos", label: `Todos · ${payments.length}` },
                  { value: "Pendientes", label: `Pendientes · ${pending.length}` },
                  { value: "Pagados", label: `Pagados · ${paid.length}` },
                ]}
              />
            </div>
            <Button icon="plus" onClick={() => setCreating(true)}>
              Registrar pago
            </Button>
          </div>
          {visible.length === 0 ? (
            <div className="card__pad">
              <EmptyState
                icon="receipt"
                title={payments.length ? "No hay pagos con ese estado" : "Todavía no hay pagos"}
                description={payments.length ? "Probá con otro filtro." : "Registrá los pagos a proveedores para controlar lo que se debe."}
              />
            </div>
          ) : (
            <div className="scroll-x">
              <table className="af-table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th className="pl">Proveedor</th>
                    <th>Fecha</th>
                    <th>Gasto vinculado</th>
                    <th>Medio</th>
                    <th className="af-r">Monto</th>
                    <th className="pr">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => {
                    const isPaid = p.status === "Paid";
                    const action = isPaid ? "Marcar como pendiente" : "Marcar como pagado";
                    return (
                      <tr key={p.id}>
                        <td className="pl" style={{ fontWeight: 500 }}>
                          {p.supplierName ?? <span className="af-text--muted">{NO_SUPPLIER}</span>}
                        </td>
                        <td className="af-num">{formatDate(p.date)}</td>
                        <td>
                          {p.expenseId ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted-foreground)" }}>
                              <Icon name="link" size={14} />
                              {p.expenseDescription || "Gasto sin descripción"}
                            </span>
                          ) : (
                            <span className="af-meta">—</span>
                          )}
                        </td>
                        <td>{p.method || "—"}</td>
                        <td className="af-num af-r" style={{ fontWeight: 500 }}>
                          {formatARS(p.amount)}
                        </td>
                        <td className="pr">
                          <button
                            type="button"
                            className={isPaid ? "estado-btn estado-btn--pagado" : "estado-btn estado-btn--pendiente"}
                            aria-label={action}
                            title={action}
                            disabled={setStatus.isPending}
                            onClick={() => toggle(p)}
                          >
                            <span className="dot" />
                            {isPaid ? "Pagado" : "Pendiente"}
                            <Icon name="chevrons-up-down" size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="card__foot card__foot--border">
            Tocá el estado para alternar Pendiente ↔ Pagado. Se pide confirmación al marcar como Pagado.
          </div>
        </section>

        <section className="card card--col split__side">
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
            <h2 className="section-title">Saldo por proveedor</h2>
          </div>
          {balances.length === 0 ? (
            <p className="card__foot">Sin pagos registrados.</p>
          ) : (
            <ul className="list-plain">
              {balances.map((s) => {
                const tot = s.paid + s.pending;
                return (
                  <li key={s.name} className="saldo">
                    <div className="saldo__top">
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                      <span
                        className="af-num"
                        style={{ fontSize: 13, fontWeight: 600, color: s.pending > 0 ? "var(--warning-text)" : "var(--success-text)" }}
                      >
                        {s.pending > 0 ? `Debe ${formatARS(s.pending, { compact: true })}` : "Al día"}
                      </span>
                    </div>
                    <div className="saldo__bar">
                      <div style={{ background: "var(--success)", width: `${tot ? ((s.paid / tot) * 100).toFixed(1) : 0}%` }} />
                      <div style={{ background: "var(--warning)", width: `${tot ? ((s.pending / tot) * 100).toFixed(1) : 0}%` }} />
                    </div>
                    <div className="af-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--muted-foreground)" }}>
                      {`Pagado ${formatARS(s.paid, { compact: true })} de ${formatARS(tot, { compact: true })}`}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <PaymentFormDialog open={creating} onClose={() => setCreating(false)} projectId={project.id} />
    </>
  );
}
