import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Icon } from "./Icon";
import { cx } from "./ds";

/* ---------- Field ---------- */
export function Field({
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}) {
  const id = useId();
  const describedBy = hint || error ? `${id}-d` : undefined;
  return (
    <div className={cx("af-field", error && "af-field--error", className)}>
      <label htmlFor={id} className="af-field__label">
        {label}
        {optional ? <span className="af-meta"> (opcional)</span> : null}
      </label>
      {children(id, describedBy)}
      {error ? (
        <div id={describedBy} className="af-field__error">
          <Icon name="info" size={14} />
          {error}
        </div>
      ) : hint ? (
        <div id={describedBy} className="af-meta">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function TextInput({ className, mono, ...props }: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return <input {...props} className={cx("af-input", mono && "af-input--mono", className)} />;
}

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx("af-input af-select", className)}>
      {children}
    </select>
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx("af-input af-textarea", className)} />;
}

/* ---------- Segmented (radiogroup de filtros) ---------- */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="af-segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className="af-segmented__opt"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Avatar (iniciales) ---------- */
export function Avatar({ initials, size = 32, fontSize = 12 }: { initials: string; size?: number; fontSize?: number }) {
  return (
    <span className="af-avatar" style={{ width: size, height: size, fontSize }}>
      {initials}
    </span>
  );
}
