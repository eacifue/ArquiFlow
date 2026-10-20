import { useState, type FormEvent } from "react";
import { useDeleteTaskType, useSaveTaskType, useTaskTypes } from "@/api/admin";
import type { TaskType } from "@/api/types";
import { apiErrorMessage } from "@/lib/hooks";
import { plural } from "@/lib/format";
import { Button, EmptyState, Skeleton } from "@/ui/ds";
import { Icon } from "@/ui/Icon";
import { useToast } from "@/ui/overlay";

export function TaskTypesScreen() {
  const toast = useToast();
  const { data: types = [], isLoading, isError } = useTaskTypes();
  const save = useSaveTaskType();
  const remove = useDeleteTaskType();
  const [nuevo, setNuevo] = useState("");
  const [edit, setEdit] = useState<{ id: string; name: string } | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const name = nuevo.trim();
    if (!name) return;
    try {
      await save.mutateAsync({ name });
      setNuevo("");
      toast.success("Tipo de tarea agregado", name);
    } catch (err) {
      toast.error("No se pudo agregar", apiErrorMessage(err, name));
    }
  };

  const rename = async (e: FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    const name = edit.name.trim();
    if (!name) return;
    try {
      await save.mutateAsync({ id: edit.id, name });
      setEdit(null);
      toast.success("Tipo de tarea actualizado", name);
    } catch (err) {
      toast.error("No se pudo actualizar", apiErrorMessage(err, name));
    }
  };

  const destroy = async (t: TaskType) => {
    try {
      await remove.mutateAsync(t.id);
      toast.success("Tipo de tarea eliminado", t.name);
    } catch (err) {
      toast.error("No se pudo eliminar", apiErrorMessage(err, t.name));
    }
  };

  return (
    <main className="app-main">
      <header className="page-head__titles">
        <h1 className="page-title">Maestro de tareas</h1>
        <p className="page-sub">Nombres de tarea que se eligen al armar el cronograma de cualquier obra.</p>
      </header>

      <section className="card" style={{ maxWidth: 760 }}>
        <form onSubmit={add} style={{ display: "flex", gap: 8, padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <label htmlFor="nuevo" className="af-sr">
            Nuevo tipo de tarea
          </label>
          <input
            id="nuevo"
            type="text"
            className="af-input"
            style={{ flex: 1, minWidth: 0 }}
            placeholder="Nuevo tipo de tarea, ej. Contrapiso"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
          />
          <Button type="submit" icon="plus" disabled={save.isPending && !edit}>
            Agregar
          </Button>
        </form>

        {isLoading ? (
          <div className="card__pad">
            <Skeleton height={240} />
          </div>
        ) : isError ? (
          <div className="card__pad">
            <EmptyState tone="error" icon="octagon-x" title="No se pudo cargar el maestro" description="Intentá de nuevo en un momento." />
          </div>
        ) : types.length === 0 ? (
          <div className="card__pad">
            <EmptyState icon="list-checks" title="Todavía no hay tipos de tarea" description="Agregá los nombres de tarea que usan tus cronogramas." />
          </div>
        ) : (
          <ul className="list-plain">
            {types.map((t) =>
              edit?.id === t.id ? (
                <li key={t.id} className="tt-row data-row">
                  <form onSubmit={rename} style={{ display: "contents" }}>
                    <label htmlFor={`ed-${t.id}`} className="af-sr">
                      Nombre
                    </label>
                    <input
                      id={`ed-${t.id}`}
                      type="text"
                      className="af-input"
                      style={{ flex: 1, minWidth: 0 }}
                      autoFocus
                      value={edit.name}
                      onChange={(e) => setEdit({ id: t.id, name: e.target.value })}
                      onKeyDown={(e) => e.key === "Escape" && setEdit(null)}
                    />
                    <Button type="submit" size="sm" disabled={save.isPending}>
                      Guardar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEdit(null)}>
                      Cancelar
                    </Button>
                  </form>
                </li>
              ) : (
                <li key={t.id} className="tt-row data-row">
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 500 }}>{t.name}</span>
                  <span style={{ fontSize: 13, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                    {t.projectCount > 0 ? `En ${plural(t.projectCount, "obra", "obras")}` : "Sin uso"}
                  </span>
                  <button type="button" className="icon-btn" aria-label={`Editar ${t.name}`} onClick={() => setEdit({ id: t.id, name: t.name })}>
                    <Icon name="pencil" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Eliminar ${t.name}`}
                    title={t.projectCount > 0 ? "En uso: no se puede eliminar" : "Eliminar"}
                    disabled={t.projectCount > 0 || remove.isPending}
                    onClick={() => destroy(t)}
                  >
                    <Icon name="trash" />
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
        <div className="card__foot">Un tipo en uso no se puede eliminar; renombrarlo cambia el nombre en todas las obras.</div>
      </section>
    </main>
  );
}
