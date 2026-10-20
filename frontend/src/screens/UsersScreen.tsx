import { useState, type CSSProperties } from "react";
import { useResetPassword, useSaveUser, useUsers } from "@/api/admin";
import type { AppUser } from "@/api/types";
import { ROLE_LABEL, type Role } from "@/lib/auth";
import { apiErrorMessage, generatePassword } from "@/lib/hooks";
import { formatWhen, initials } from "@/lib/format";
import { Button, EmptyState, Skeleton } from "@/ui/ds";
import { Avatar, Field, Segmented, TextInput } from "@/ui/controls";
import { Modal, useConfirm, useToast } from "@/ui/overlay";

type Filter = "Todos" | Role;

const ROLE_STYLE: Record<Role, CSSProperties> = {
  Admin: { background: "var(--primary)", color: "var(--primary-foreground)" },
  ProjectManager: { background: "var(--accent)", color: "var(--accent-foreground)" },
  Supervisor: { background: "var(--secondary)", color: "var(--secondary-foreground)", border: "1px solid var(--border)" },
  Client: { background: "transparent", color: "var(--muted-foreground)", border: "1px solid var(--border)" },
};

const ROLE_DESC: Record<Role, string> = {
  Admin: "Todo, más usuarios y maestro de tareas.",
  ProjectManager: "Crea y edita obras, presupuesto, cronograma y pagos.",
  Supervisor: "Carga bitácora y gastos en obra. No ve pagos.",
  Client: "Solo lectura de las obras a las que se lo invita.",
};

const ROLES: Role[] = ["Admin", "ProjectManager", "Supervisor", "Client"];

export function UsersScreen() {
  const { data: users = [], isLoading, isError } = useUsers();
  const [filter, setFilter] = useState<Filter>("Todos");
  const [editing, setEditing] = useState<{ user?: AppUser } | null>(null);

  const rows = users.filter((u) => filter === "Todos" || u.roles.includes(filter));

  return (
    <main className="app-main">
      <header className="page-head page-head--end">
        <div className="page-head__titles">
          <h1 className="page-title">Usuarios</h1>
          <p className="page-sub">Solo Admin. Los clientes también se invitan desde cada obra.</p>
        </div>
        <div className="page-actions">
          <Segmented<Filter>
            label="Filtrar por rol"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "Todos", label: "Todos" },
              { value: "Admin", label: "Admin" },
              { value: "ProjectManager", label: "PM" },
              { value: "Supervisor", label: "Supervisor" },
              { value: "Client", label: "Cliente" },
            ]}
          />
          <Button icon="plus" onClick={() => setEditing({})}>
            Nuevo usuario
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
            <EmptyState tone="error" icon="octagon-x" title="No se pudieron cargar los usuarios" description="Intentá de nuevo en un momento." />
          </div>
        ) : rows.length === 0 ? (
          <div className="card__pad">
            <EmptyState icon="users" title="No hay usuarios con ese rol" description="Probá con otro filtro." />
          </div>
        ) : (
          <div className="scroll-x">
            <table className="af-table" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th className="pl">Usuario</th>
                  <th>Rol</th>
                  <th>Obras</th>
                  <th>Último ingreso</th>
                  <th className="pr" style={{ width: 120 }}>
                    <span className="af-sr">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const role = u.roles[0] ?? "Client";
                  return (
                    <tr key={u.id} className="data-row">
                      <td className="pl">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar initials={initials(u.fullName)} />
                          <div>
                            <div style={{ fontWeight: 500 }}>{u.fullName}</div>
                            <div className="af-meta">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px", borderRadius: 4, fontSize: 12, fontWeight: 500, ...ROLE_STYLE[role] }}>
                          {ROLE_LABEL[role]}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted-foreground)" }}>{u.allProjects ? "Todas" : u.projects.join(", ") || "—"}</td>
                      <td className="af-num" style={{ color: "var(--muted-foreground)" }}>
                        {u.lastLoginAt ? formatWhen(u.lastLoginAt) : "Nunca"}
                      </td>
                      <td className="pr" style={{ textAlign: "right" }}>
                        <Button variant="outline" size="sm" icon="pencil" style={{ fontSize: 14, gap: 6 }} onClick={() => setEditing({ user: u })}>
                          Editar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing ? <UserForm user={editing.user} onClose={() => setEditing(null)} /> : null}
    </main>
  );
}

function UserForm({ user, onClose }: { user?: AppUser; onClose: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const save = useSaveUser();
  const reset = useResetPassword();
  const [f, setF] = useState({ fullName: user?.fullName ?? "", email: user?.email ?? "", password: generatePassword() });
  const [role, setRole] = useState<Role>(user?.roles[0] ?? "ProjectManager");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!f.fullName.trim()) e.fullName = "Poné el nombre.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Email inválido.";
    if (!user && f.password.length < 8) e.password = "Mínimo 8 caracteres.";
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await save.mutateAsync({
        id: user?.id,
        input: { fullName: f.fullName.trim(), email: f.email.trim(), role, password: user ? undefined : f.password },
      });
      toast.success(user ? "Usuario actualizado" : "Usuario creado", f.fullName.trim());
      onClose();
    } catch (err) {
      toast.error("No se pudo guardar el usuario", apiErrorMessage(err, "Revisá los datos."));
    }
  };

  const resetPassword = async () => {
    if (!user) return;
    const password = generatePassword();
    const ok = await confirm({
      title: `¿Restablecer la contraseña de ${user.fullName}?`,
      description: (
        <>
          La nueva contraseña va a ser <span className="af-num" style={{ color: "var(--foreground)" }}>{password}</span>. Pasásela al usuario; la anterior deja de funcionar.
        </>
      ),
      confirmLabel: "Restablecer",
    });
    if (!ok) return;
    try {
      await reset.mutateAsync({ id: user.id, password });
      toast.success("Contraseña restablecida", password);
    } catch (err) {
      toast.error("No se pudo restablecer", apiErrorMessage(err, "Intentá de nuevo."));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={user ? "Editar usuario" : "Nuevo usuario"}
      description={user ? "Cambiar el rol cambia lo que ve en todas sus obras." : "Las obras se asignan desde cada obra."}
      maxWidth={560}
      offsetTop={64}
      onSubmit={submit}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Guardando…" : "Guardar usuario"}
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Field label="Nombre completo" error={errors.fullName}>
          {(id) => <TextInput id={id} value={f.fullName} onChange={set("fullName")} placeholder="Nombre y apellido" />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(id) => <TextInput id={id} value={f.email} onChange={set("email")} placeholder="nombre@estudio.com.ar" />}
        </Field>
      </div>
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <legend style={{ fontWeight: 500, padding: 0, marginBottom: 6 }}>Rol</legend>
        <div role="radiogroup" aria-label="Rol" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ROLES.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={role === r} className="choice" onClick={() => setRole(r)}>
              <span className="choice__dot">
                <span />
              </span>
              <span style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <span style={{ fontWeight: 500 }}>{ROLE_LABEL[r]}</span>
                <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>{ROLE_DESC[r]}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      {user ? (
        <div className="note-box">
          <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>
            La contraseña la cambia el usuario. Si la olvidó, generá una nueva.
          </span>
          <Button variant="outline" size="sm" onClick={resetPassword} disabled={reset.isPending} style={{ whiteSpace: "nowrap" }}>
            Restablecer contraseña
          </Button>
        </div>
      ) : (
        <Field label="Contraseña inicial" hint="Pasásela al usuario; puede cambiarla al ingresar." error={errors.password}>
          {(id, d) => <TextInput id={id} aria-describedby={d} mono value={f.password} onChange={set("password")} />}
        </Field>
      )}
    </Modal>
  );
}
