import { useState } from "react";
import { useDeleteSupplier, useSaveSupplier, useSuppliers } from "@/api/admin";
import type { Supplier } from "@/api/types";
import { apiErrorMessage } from "@/lib/hooks";
import { formatARS, plural } from "@/lib/format";
import { Button, EmptyState, Skeleton } from "@/ui/ds";
import { Field, TextInput } from "@/ui/controls";
import { Icon } from "@/ui/Icon";
import { Modal, useConfirm, useToast } from "@/ui/overlay";

export function SuppliersScreen() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: suppliers = [], isLoading, isError } = useSuppliers();
  const remove = useDeleteSupplier();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ supplier?: Supplier } | null>(null);

  const query = q.trim().toLowerCase();
  const rows = suppliers.filter(
    (s) => !query || `${s.name} ${s.category ?? ""} ${s.taxId ?? ""}`.toLowerCase().includes(query),
  );

  const destroy = async (s: Supplier) => {
    const ok = await confirm({
      title: `¿Eliminar ${s.name}?`,
      description:
        s.projectCount > 0
          ? `Aparece en ${plural(s.projectCount, "obra", "obras")}. Sus gastos y pagos se conservan, sin proveedor asignado.`
          : "No tiene gastos ni pagos registrados.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(s.id);
      toast.success("Proveedor eliminado", s.name);
    } catch (err) {
      toast.error("No se pudo eliminar", apiErrorMessage(err, s.name));
    }
  };

  return (
    <main className="app-main">
      <header className="page-head page-head--end">
        <div className="page-head__titles">
          <h1 className="page-title">Proveedores</h1>
          <p className="page-sub">{`${plural(suppliers.length, "proveedor", "proveedores")} · compartidos entre todas las obras`}</p>
        </div>
        <div className="page-actions">
          <div className="search">
            <Icon name="search" size={16} />
            <input
              type="search"
              className="af-input"
              aria-label="Buscar por nombre, rubro o CUIT"
              placeholder="Buscar por nombre, rubro o CUIT"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button icon="plus" onClick={() => setEditing({})}>
            Nuevo proveedor
          </Button>
        </div>
      </header>

      <section className="card">
        {isLoading ? (
          <div className="card__pad">
            <Skeleton height={240} />
          </div>
        ) : isError ? (
          <div className="card__pad">
            <EmptyState tone="error" icon="octagon-x" title="No se pudieron cargar los proveedores" description="Intentá de nuevo en un momento." />
          </div>
        ) : rows.length ? (
          <div className="scroll-x">
            <table className="af-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th className="pl">Proveedor</th>
                  <th>Rubro</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>CUIT</th>
                  <th className="af-r">Saldo pendiente</th>
                  <th className="pr" style={{ width: 80 }}>
                    <span className="af-sr">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="data-row">
                    <td className="pl">
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      {s.email ? <div className="af-meta">{s.email}</div> : null}
                    </td>
                    <td>{s.category || "—"}</td>
                    <td>{s.contactName || "—"}</td>
                    <td className="af-num">{s.phone || "—"}</td>
                    <td className="af-num">{s.taxId || "—"}</td>
                    <td
                      className="af-num af-r"
                      style={{ fontWeight: 500, color: s.pendingBalance > 0 ? "var(--warning-text)" : "var(--success-text)" }}
                    >
                      {s.pendingBalance > 0 ? formatARS(s.pendingBalance) : "Al día"}
                    </td>
                    <td className="pr" style={{ whiteSpace: "nowrap" }}>
                      <button type="button" className="icon-btn" aria-label={`Editar ${s.name}`} onClick={() => setEditing({ supplier: s })}>
                        <Icon name="pencil" />
                      </button>
                      <button type="button" className="icon-btn" aria-label={`Eliminar ${s.name}`} onClick={() => destroy(s)}>
                        <Icon name="trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card__pad">
            {query ? (
              <EmptyState icon="folder" title={`Sin resultados para “${q.trim()}”`} description="Probá con otro nombre, rubro o CUIT." />
            ) : (
              <EmptyState icon="truck" title="Todavía no hay proveedores" description="Se usan en gastos y pagos de todas las obras." />
            )}
          </div>
        )}
      </section>

      {editing ? <SupplierForm supplier={editing.supplier} onClose={() => setEditing(null)} /> : null}
    </main>
  );
}

function SupplierForm({ supplier, onClose }: { supplier?: Supplier; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveSupplier();
  const [f, setF] = useState({
    name: supplier?.name ?? "",
    category: supplier?.category ?? "",
    contactName: supplier?.contactName ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    taxId: supplier?.taxId ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Poné la razón social.";
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Email inválido.";
    if (f.taxId.trim() && !/^\d{2}-\d{8}-\d$/.test(f.taxId.trim())) e.taxId = "Con guiones: 30-12345678-9.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const clean = (v: string) => v.trim() || null;
    try {
      await save.mutateAsync({
        id: supplier?.id,
        input: {
          name: f.name.trim(),
          category: clean(f.category),
          contactName: clean(f.contactName),
          phone: clean(f.phone),
          email: clean(f.email),
          taxId: clean(f.taxId),
        },
      });
      toast.success(supplier ? "Proveedor actualizado" : "Proveedor creado", f.name.trim());
      onClose();
    } catch (err) {
      toast.error("No se pudo guardar el proveedor", apiErrorMessage(err, "Revisá los datos."));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={supplier ? "Editar proveedor" : "Nuevo proveedor"}
      description="Se usa en gastos y pagos de todas las obras."
      onSubmit={submit}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Guardando…" : "Guardar proveedor"}
          </Button>
        </>
      }
    >
      <Field label="Razón social" error={errors.name}>
        {(id) => <TextInput id={id} value={f.name} onChange={set("name")} placeholder="Ej. Hormigonera del Sur" />}
      </Field>
      <Field label="Rubro">
        {(id) => <TextInput id={id} value={f.category} onChange={set("category")} placeholder="Ej. Hormigón elaborado" />}
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Field label="Contacto">
          {(id) => <TextInput id={id} value={f.contactName} onChange={set("contactName")} placeholder="Nombre y apellido" />}
        </Field>
        <Field label="Teléfono">
          {(id) => <TextInput id={id} mono value={f.phone} onChange={set("phone")} placeholder="11 5555-5555" />}
        </Field>
      </div>
      <Field label="Email" error={errors.email}>
        {(id) => <TextInput id={id} value={f.email} onChange={set("email")} placeholder="compras@proveedor.com.ar" />}
      </Field>
      <Field label="CUIT" hint="Con guiones: 30-12345678-9." error={errors.taxId}>
        {(id, d) => <TextInput id={id} aria-describedby={d} mono value={f.taxId} onChange={set("taxId")} placeholder="30-12345678-9" />}
      </Field>
    </Modal>
  );
}
