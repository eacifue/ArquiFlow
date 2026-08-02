import { toast } from "sonner";
import { BanknoteIcon, Trash2Icon } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
import { usePayments, useDeletePayment, useUpdatePaymentStatus } from "./api";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import type { Payment } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

interface SupplierBalance {
  supplierId: string;
  supplierName: string;
  pending: number;
  paid: number;
}

function computeBalances(payments: Payment[]): SupplierBalance[] {
  const bySupplier = new Map<string, SupplierBalance>();

  for (const payment of payments) {
    const existing = bySupplier.get(payment.supplierId) ?? {
      supplierId: payment.supplierId,
      supplierName: payment.supplierName,
      pending: 0,
      paid: 0,
    };
    if (payment.status === "Pending") {
      existing.pending += payment.amount;
    } else {
      existing.paid += payment.amount;
    }
    bySupplier.set(payment.supplierId, existing);
  }

  return Array.from(bySupplier.values()).sort((a, b) => b.pending - a.pending);
}

export function PaymentsTab({ projectId }: { projectId: string }) {
  const { data: payments, isLoading, isError } = usePayments(projectId);
  const updateStatus = useUpdatePaymentStatus(projectId);
  const deletePayment = useDeletePayment(projectId);

  const handleToggleStatus = async (payment: Payment) => {
    try {
      await updateStatus.mutateAsync({
        paymentId: payment.id,
        status: payment.status === "Pending" ? "Paid" : "Pending",
      });
      toast.success(payment.status === "Pending" ? "Marcado como pagado" : "Marcado como pendiente");
    } catch {
      toast.error("No se pudo actualizar el pago");
    }
  };

  const handleDelete = async (payment: Payment) => {
    const confirmed = await confirm({
      title: `¿Eliminar el pago a ${payment.supplierName}?`,
      description: `Por ${currency.format(payment.amount)}. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deletePayment.mutateAsync(payment.id);
      toast.success("Pago eliminado");
    } catch {
      toast.error("No se pudo eliminar el pago");
    }
  };

  const balances = payments ? computeBalances(payments) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pagos a proveedores</h2>
        <CreatePaymentDialog projectId={projectId} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando pagos...</p>}
      {isError && <p className="text-sm text-destructive">No se pudieron cargar los pagos.</p>}
      {payments && payments.length === 0 && (
        <EmptyState
          icon={BanknoteIcon}
          message="Todavía no hay pagos registrados."
          action={<CreatePaymentDialog projectId={projectId} />}
        />
      )}

      {payments && payments.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saldo por proveedor</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Pendiente</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance) => (
                    <TableRow key={balance.supplierId}>
                      <TableCell className="font-medium">{balance.supplierName}</TableCell>
                      <TableCell className={`text-right tabular-nums ${balance.pending > 0 ? "text-destructive" : ""}`}>
                        {currency.format(balance.pending)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{currency.format(balance.paid)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Medio</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.supplierName}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.method ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{currency.format(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === "Paid" ? "success" : "destructive"}>
                      {payment.status === "Paid" ? "Pagado" : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleStatus(payment)}>
                      {payment.status === "Pending" ? "Marcar pagado" : "Marcar pendiente"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(payment)}>
                      <Trash2Icon data-icon="inline-start" />
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
