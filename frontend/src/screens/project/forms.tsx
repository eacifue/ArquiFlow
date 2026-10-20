import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteProject, useInviteClient, useSaveProject, useStaff } from "@/api/projects";
import {
  useCreateExpense,
  useCreatePayment,
  useDeleteBudgetItem,
  useDeleteTask,
  useProjectExpenses,
  useSaveBudgetItem,
  useSaveTask,
} from "@/api/work";
import { useSuppliers, useTaskTypes } from "@/api/admin";
import type { BudgetItem, Project, ProjectStatus, ScheduleTask } from "@/api/types";
import { apiErrorMessage, generatePassword } from "@/lib/hooks";
import { BUDGET_CATEGORIES, PROJECT_STATUS_LABEL } from "@/lib/labels";
import { formatARS, formatDate, todayIso } from "@/lib/format";
import { Button } from "@/ui/ds";
import { Field, SelectInput, TextArea, TextInput } from "@/ui/controls";
import { Modal, useConfirm, useToast } from "@/ui/overlay";

type Errors = Record<string, string>;

const num = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(",", ".")));

function Footer({ onCancel, submitLabel, busy, left }: { onCancel: () => void; submitLabel: string; busy: boolean; left?: React.ReactNode }) {
  return (
    <>
      {left ? <div style={{ marginRight: "auto" }}>{left}</div> : null}
      <Button variant="ghost" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={busy}>
        {busy ? "Guardando…" : submitLabel}
      </Button>
    </>
  );
}

/* ---------- Obra ---------- */

export function ProjectFormDialog({ open, onClose, project }: { open: boolean; onClose: () => void; project?: Project }) {
  return open ? <ProjectForm onClose={onClose} project={project} /> : null;
}

function ProjectForm({ onClose, project }: { onClose: () => void; project?: Project }) {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const save = useSaveProject(project?.id);
  const remove = useDeleteProject();
  const { data: staff = [] } = useStaff();
  const [f, setF] = useState({
    name: project?.name ?? "",
    address: project?.address ?? "",
    description: project?.description ?? "",
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
    totalBudget: project ? String(project.totalBudget) : "",
    status: (project?.status ?? "Planning") as ProjectStatus,
    projectManagerId: project?.projectManager?.id ?? "",
    supervisorId: project?.supervisor?.id ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    const e: Errors = {};
    if (!f.name.trim()) e.name = "Poné un nombre.";
    const budget = f.totalBudget.trim() === "" ? 0 : num(f.totalBudget);
    if (Number.isNaN(budget) || budget < 0) e.totalBudget = "Tiene que ser un monto válido.";
    if (f.startDate && f.endDate && f.endDate < f.startDate) e.endDate = "La fecha de fin no puede ser anterior al inicio.";
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      const saved = await save.mutateAsync({
        name: f.name.trim(),
        address: f.address.trim() || null,
        description: f.description.trim() || null,
        startDate: f.startDate || null,
        endDate: f.endDate || null,
        totalBudget: budget,
        status: project ? f.status : undefined,
        projectManagerId: f.projectManagerId || null,
        supervisorId: f.supervisorId || null,
      });
      toast.success(project ? "Obra actualizada" : "Obra creada", saved.name);
      onClose();
      if (!project) navigate(`/obras/${saved.id}`);
    } catch (err) {
      toast.error("No se pudo guardar la obra", apiErrorMessage(err, "Revisá los datos e intentá de nuevo."));
    }
  };

  const destroy = async () => {
    if (!project) return;
    const ok = await confirm({
      title: `¿Eliminar ${project.name}?`,
      description: "Se borran su presupuesto, cronograma, bitácora y pagos. No se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    await remove.mutateAsync(project.id);
    toast.success("Obra eliminada", project.name);
    onClose();
    navigate("/obras");
  };

  const managers = staff.filter((s) => s.role === "Admin" || s.role === "ProjectManager");
  const supervisors = staff.filter((s) => s.role === "Supervisor");

  return (
    <Modal
      open
      onClose={onClose}
      title={project ? "Editar obra" : "Nueva obra"}
      description={project ? project.name : "Después cargás el presupuesto y el cronograma."}
      maxWidth={560}
      offsetTop={64}
      onSubmit={submit}
      footer={
        <Footer
          onCancel={onClose}
          submitLabel="Guardar obra"
          busy={save.isPending}
          left={
            project ? (
              <Button variant="ghost" style={{ color: "var(--destructive-text)" }} onClick={destroy}>
                Eliminar obra
              </Button>
            ) : null
          }
        />
      }
    >
      <Field label="Nombre" error={errors.name}>
        {(id) => <TextInput id={id} value={f.name} onChange={set("name")} placeholder="Ej. Casa Bermúdez" />}
      </Field>
      <Field label="Dirección" optional>
        {(id) => <TextInput id={id} value={f.address} onChange={set("address")} placeholder="Ej. Los Sauces 1240, Nordelta" />}
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Field label="Inicio" optional>
          {(id) => <TextInput id={id} type="date" value={f.startDate} onChange={set("startDate")} />}
        </Field>
        <Field label="Entrega" optional error={errors.endDate}>
          {(id) => <TextInput id={id} type="date" value={f.endDate} onChange={set("endDate")} />}
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Field label="Project Manager" optional>
          {(id) => (
            <SelectInput id={id} value={f.projectManagerId} onChange={set("projectManagerId")}>
              <option value="">Sin asignar</option>
              {managers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
        <Field label="Supervisor" optional>
          {(id) => (
            <SelectInput id={id} value={f.supervisorId} onChange={set("supervisorId")}>
              <option value="">Sin asignar</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: project ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 12 }}>
        <Field label="Presupuesto total" hint="Si cargás partidas, se usa la suma de las partidas." error={errors.totalBudget}>
          {(id, d) => (
            <TextInput id={id} aria-describedby={d} mono inputMode="decimal" value={f.totalBudget} onChange={set("totalBudget")} placeholder="0" />
          )}
        </Field>
        {project ? (
          <Field label="Estado">
            {(id) => (
              <SelectInput id={id} value={f.status} onChange={set("status")}>
                {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABEL[s]}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
        ) : null}
      </div>
      <Field label="Descripción" optional>
        {(id) => <TextArea id={id} rows={3} value={f.description} onChange={set("description")} />}
      </Field>
    </Modal>
  );
}

/* ---------- Tarea del cronograma ---------- */

export function TaskFormDialog({
  open,
  onClose,
  projectId,
  task,
  nextSortOrder,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: ScheduleTask;
  nextSortOrder: number;
}) {
  return open ? <TaskForm onClose={onClose} projectId={projectId} task={task} nextSortOrder={nextSortOrder} /> : null;
}

function TaskForm({ onClose, projectId, task, nextSortOrder }: { onClose: () => void; projectId: string; task?: ScheduleTask; nextSortOrder: number }) {
  const toast = useToast();
  const confirm = useConfirm();
  const save = useSaveTask(projectId);
  const remove = useDeleteTask(projectId);
  const { data: types = [] } = useTaskTypes();
  const [f, setF] = useState({
    name: task?.name ?? "",
    startDate: task?.startDate ?? todayIso(),
    endDate: task?.endDate ?? todayIso(),
    progressPercent: String(task?.progressPercent ?? 0),
  });
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const names = types.map((t) => t.name);
  if (task && !names.includes(task.name)) names.unshift(task.name);

  const submit = async () => {
    const e: Errors = {};
    if (!f.name) e.name = "Elegí la tarea.";
    if (!f.startDate) e.startDate = "Poné la fecha de inicio.";
    if (!f.endDate) e.endDate = "Poné la fecha de fin.";
    else if (f.endDate < f.startDate) e.endDate = "La fecha de fin no puede ser anterior al inicio.";
    const progress = num(f.progressPercent);
    if (Number.isNaN(progress) || progress < 0 || progress > 100) e.progressPercent = "Entre 0 y 100.";
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await save.mutateAsync({
        id: task?.id,
        input: {
          name: f.name,
          startDate: f.startDate,
          endDate: f.endDate,
          progressPercent: Math.round(progress),
          sortOrder: task?.sortOrder ?? nextSortOrder,
        },
      });
      toast.success(task ? "Tarea actualizada" : "Tarea agregada", f.name);
      onClose();
    } catch (err) {
      toast.error("No se pudo guardar la tarea", apiErrorMessage(err, "Revisá los datos."));
    }
  };

  const destroy = async () => {
    if (!task) return;
    const ok = await confirm({ title: `¿Eliminar ${task.name}?`, description: "Sale del cronograma de esta obra.", confirmLabel: "Eliminar", destructive: true });
    if (!ok) return;
    await remove.mutateAsync(task.id);
    toast.success("Tarea eliminada", task.name);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={task ? "Editar tarea" : "Nueva tarea"}
      description="Las tareas salen del maestro de tareas."
      onSubmit={submit}
      footer={
        <Footer
          onCancel={onClose}
          submitLabel="Guardar tarea"
          busy={save.isPending}
          left={task ? <Button variant="ghost" style={{ color: "var(--destructive-text)" }} onClick={destroy}>Eliminar</Button> : null}
        />
      }
    >
      <Field label="Tarea" error={errors.name}>
        {(id) => (
          <SelectInput id={id} value={f.name} onChange={set("name")}>
            <option value="">Elegir tarea</option>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Field label="Inicio" error={errors.startDate}>
          {(id) => <TextInput id={id} type="date" value={f.startDate} onChange={set("startDate")} />}
        </Field>
        <Field label="Fin" error={errors.endDate}>
          {(id) => <TextInput id={id} type="date" value={f.endDate} onChange={set("endDate")} />}
        </Field>
      </div>
      <Field label="Avance (%)" error={errors.progressPercent}>
        {(id) => <TextInput id={id} mono inputMode="numeric" value={f.progressPercent} onChange={set("progressPercent")} />}
      </Field>
    </Modal>
  );
}

/* ---------- Partida ---------- */

export function BudgetItemFormDialog({ open, onClose, projectId, item }: { open: boolean; onClose: () => void; projectId: string; item?: BudgetItem }) {
  return open ? <BudgetItemForm onClose={onClose} projectId={projectId} item={item} /> : null;
}

function BudgetItemForm({ onClose, projectId, item }: { onClose: () => void; projectId: string; item?: BudgetItem }) {
  const toast = useToast();
  const confirm = useConfirm();
  const save = useSaveBudgetItem(projectId);
  const remove = useDeleteBudgetItem(projectId);
  const [f, setF] = useState({
    category: item?.category ?? BUDGET_CATEGORIES[0],
    description: item?.description ?? "",
    budgetedAmount: item ? String(item.budgetedAmount) : "",
    quantity: item?.quantity != null ? String(item.quantity) : "",
    unit: item?.unit ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    const e: Errors = {};
    if (!f.description.trim()) e.description = "Describí la partida.";
    const amount = num(f.budgetedAmount);
    if (Number.isNaN(amount) || amount < 0) e.budgetedAmount = "Tiene que ser un monto válido.";
    const qty = f.quantity.trim() === "" ? null : num(f.quantity);
    if (qty !== null && (Number.isNaN(qty) || qty < 0)) e.quantity = "Cantidad inválida.";
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await save.mutateAsync({
        id: item?.id,
        input: { category: f.category, description: f.description.trim(), budgetedAmount: amount, quantity: qty, unit: f.unit.trim() || null },
      });
      toast.success(item ? "Partida actualizada" : "Partida agregada", f.description.trim());
      onClose();
    } catch (err) {
      toast.error("No se pudo guardar la partida", apiErrorMessage(err, "Revisá los datos."));
    }
  };

  const destroy = async () => {
    if (!item) return;
    const ok = await confirm({
      title: `¿Eliminar ${item.description}?`,
      description: item.expenses.length ? "También se borran sus gastos." : "La partida no tiene gastos.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    await remove.mutateAsync(item.id);
    toast.success("Partida eliminada", item.description);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? "Editar partida" : "Nueva partida"}
      description="Lo presupuestado para un rubro de la obra."
      onSubmit={submit}
      footer={
        <Footer
          onCancel={onClose}
          submitLabel="Guardar partida"
          busy={save.isPending}
          left={item ? <Button variant="ghost" style={{ color: "var(--destructive-text)" }} onClick={destroy}>Eliminar</Button> : null}
        />
      }
    >
      <Field label="Categoría">
        {(id) => (
          <SelectInput id={id} value={f.category} onChange={set("category")}>
            {BUDGET_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        )}
      </Field>
      <Field label="Descripción" error={errors.description}>
        {(id) => <TextInput id={id} value={f.description} onChange={set("description")} placeholder="Ej. Hormigón H21" />}
      </Field>
      <Field label="Presupuestado" error={errors.budgetedAmount}>
        {(id) => <TextInput id={id} mono inputMode="decimal" value={f.budgetedAmount} onChange={set("budgetedAmount")} placeholder="0" />}
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Field label="Cantidad" optional error={errors.quantity}>
          {(id) => <TextInput id={id} mono inputMode="decimal" value={f.quantity} onChange={set("quantity")} />}
        </Field>
        <Field label="Unidad" optional>
          {(id) => <TextInput id={id} value={f.unit} onChange={set("unit")} placeholder="Ej. m³" />}
        </Field>
      </div>
    </Modal>
  );
}

/* ---------- Gasto ---------- */

export function ExpenseFormDialog({
  open,
  onClose,
  projectId,
  items,
  budgetItemId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  items: BudgetItem[];
  budgetItemId?: string;
}) {
  return open ? <ExpenseForm onClose={onClose} projectId={projectId} items={items} budgetItemId={budgetItemId} /> : null;
}

function ExpenseForm({ onClose, projectId, items, budgetItemId }: { onClose: () => void; projectId: string; items: BudgetItem[]; budgetItemId?: string }) {
  const toast = useToast();
  const create = useCreateExpense(projectId);
  const { data: suppliers = [] } = useSuppliers();
  const [f, setF] = useState({
    budgetItemId: budgetItemId ?? items[0]?.id ?? "",
    amount: "",
    date: todayIso(),
    description: "",
    supplierId: "",
  });
  const [receipt, setReceipt] = useState<File | undefined>();
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const fixed = items.find((i) => i.id === budgetItemId);

  const submit = async () => {
    const e: Errors = {};
    if (!f.budgetItemId) e.budgetItemId = "Elegí la partida.";
    const amount = num(f.amount);
    if (Number.isNaN(amount) || amount <= 0) e.amount = "Tiene que ser mayor a cero.";
    if (!f.date) e.date = "Poné la fecha.";
    else if (f.date > todayIso()) e.date = "No puede ser una fecha futura.";
    if (receipt && receipt.size > 10 * 1024 * 1024) e.receipt = "El comprobante no puede superar los 10 MB.";
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await create.mutateAsync({
        budgetItemId: f.budgetItemId,
        input: { amount, date: f.date, description: f.description.trim() || undefined, supplierId: f.supplierId || undefined, receipt },
      });
      toast.success("Gasto registrado", formatARS(amount));
      onClose();
    } catch (err) {
      toast.error("No se pudo registrar el gasto", apiErrorMessage(err, "Revisá los datos."));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar gasto"
      description={fixed ? `${fixed.category} · ${fixed.description}` : "Se suma a lo gastado de la partida."}
      onSubmit={submit}
      offsetTop={64}
      footer={<Footer onCancel={onClose} submitLabel="Registrar gasto" busy={create.isPending} />}
    >
      {!fixed ? (
        <Field label="Partida" error={errors.budgetItemId}>
          {(id) =>
            items.length ? (
              <SelectInput id={id} value={f.budgetItemId} onChange={set("budgetItemId")}>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {`${i.category} · ${i.description}`}
                  </option>
                ))}
              </SelectInput>
            ) : (
              <p className="af-meta">Primero cargá una partida en Presupuesto.</p>
            )
          }
        </Field>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Field label="Monto" error={errors.amount}>
          {(id) => <TextInput id={id} mono inputMode="decimal" value={f.amount} onChange={set("amount")} placeholder="0" />}
        </Field>
        <Field label="Fecha" error={errors.date}>
          {(id) => <TextInput id={id} type="date" max={todayIso()} value={f.date} onChange={set("date")} />}
        </Field>
      </div>
      <Field label="Descripción" optional>
        {(id) => <TextInput id={id} value={f.description} onChange={set("description")} placeholder="Ej. factura de cemento" />}
      </Field>
      <Field label="Proveedor" optional>
        {(id) => (
          <SelectInput id={id} value={f.supplierId} onChange={set("supplierId")}>
            <option value="">Sin proveedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>
      <Field label="Comprobante (foto o PDF)" optional error={errors.receipt}>
        {(id) => (
          <input
            id={id}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="af-input"
            style={{ paddingTop: 6 }}
            onChange={(e) => setReceipt(e.target.files?.[0])}
          />
        )}
      </Field>
    </Modal>
  );
}

/* ---------- Pago ---------- */

export function PaymentFormDialog({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  return open ? <PaymentForm onClose={onClose} projectId={projectId} /> : null;
}

function PaymentForm({ onClose, projectId }: { onClose: () => void; projectId: string }) {
  const toast = useToast();
  const create = useCreatePayment(projectId);
  const { data: suppliers = [] } = useSuppliers();
  const { data: expenses = [] } = useProjectExpenses(projectId, true);
  const [f, setF] = useState({ supplierId: "", amount: "", date: todayIso(), method: "", expenseId: "" });
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    const e: Errors = {};
    if (!f.supplierId) e.supplierId = "Elegí el proveedor.";
    const amount = num(f.amount);
    if (Number.isNaN(amount) || amount <= 0) e.amount = "Tiene que ser mayor a cero.";
    if (!f.date) e.date = "Poné la fecha.";
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await create.mutateAsync({ supplierId: f.supplierId, amount, date: f.date, method: f.method.trim() || null, expenseId: f.expenseId || null });
      toast.success("Pago registrado", formatARS(amount));
      onClose();
    } catch (err) {
      toast.error("No se pudo registrar el pago", apiErrorMessage(err, "Revisá los datos."));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar pago a proveedor"
      description="Queda como Pendiente hasta que lo marques como Pagado."
      onSubmit={submit}
      footer={<Footer onCancel={onClose} submitLabel="Registrar pago" busy={create.isPending} />}
    >
      <Field label="Proveedor" error={errors.supplierId}>
        {(id) => (
          <SelectInput id={id} value={f.supplierId} onChange={set("supplierId")}>
            <option value="">Elegir proveedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Field label="Monto" error={errors.amount}>
          {(id) => <TextInput id={id} mono inputMode="decimal" value={f.amount} onChange={set("amount")} placeholder="0" />}
        </Field>
        <Field label="Fecha" error={errors.date}>
          {(id) => <TextInput id={id} type="date" value={f.date} onChange={set("date")} />}
        </Field>
      </div>
      <Field label="Medio de pago" optional>
        {(id) => <TextInput id={id} value={f.method} onChange={set("method")} placeholder="Ej: Transferencia" />}
      </Field>
      <Field label="Vincular a un gasto" optional>
        {(id) => (
          <SelectInput id={id} value={f.expenseId} onChange={set("expenseId")}>
            <option value="">Sin vincular</option>
            {expenses.map((x) => (
              <option key={x.id} value={x.id}>
                {`${formatDate(x.date)} · ${x.description || x.budgetItemDescription} · ${formatARS(x.amount)}`}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>
    </Modal>
  );
}

/* ---------- Invitar cliente ---------- */

export function InviteClientDialog({ open, onClose, project }: { open: boolean; onClose: () => void; project: Project }) {
  return open ? <InviteClientForm onClose={onClose} project={project} /> : null;
}

function InviteClientForm({ onClose, project }: { onClose: () => void; project: Project }) {
  const toast = useToast();
  const invite = useInviteClient(project.id);
  const [f, setF] = useState({ fullName: "", email: "", password: generatePassword(project.address ?? project.name) });
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    const e: Errors = {};
    if (!f.fullName.trim()) e.fullName = "Poné el nombre.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Email inválido.";
    if (f.password.length < 8) e.password = "Mínimo 8 caracteres.";
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await invite.mutateAsync({ fullName: f.fullName.trim(), email: f.email.trim(), password: f.password });
      toast.success("Cliente invitado", project.name);
      onClose();
    } catch (err) {
      toast.error("No se pudo invitar", apiErrorMessage(err, "Revisá los datos."));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Invitar cliente"
      description={`${project.name} · acceso de solo lectura`}
      offsetTop={96}
      onSubmit={submit}
      footer={<Footer onCancel={onClose} submitLabel="Invitar cliente" busy={invite.isPending} />}
    >
      <Field label="Nombre completo" error={errors.fullName}>
        {(id) => <TextInput id={id} value={f.fullName} onChange={set("fullName")} placeholder="Ej. Ana Bermúdez" />}
      </Field>
      <Field label="Email" error={errors.email}>
        {(id) => <TextInput id={id} type="email" value={f.email} onChange={set("email")} placeholder="nombre@ejemplo.com" />}
      </Field>
      <Field label="Contraseña inicial" hint="Pasásela al cliente. Puede cambiarla al ingresar." error={errors.password}>
        {(id, d) => (
          <div style={{ display: "flex", gap: 8 }}>
            <TextInput id={id} aria-describedby={d} mono value={f.password} onChange={set("password")} style={{ flex: 1, minWidth: 0 }} />
            <Button variant="secondary" style={{ padding: "0 12px" }} onClick={() => setF({ ...f, password: generatePassword(project.address ?? project.name) })}>
              Generar otra
            </Button>
          </div>
        )}
      </Field>
    </Modal>
  );
}
