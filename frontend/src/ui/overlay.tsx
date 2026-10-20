import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { cx } from "./ds";

/* ---------- Modal (DialogFrame) ---------- */

function useDialogBehavior(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement | null>) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(
      "input:not([type=hidden]):not([disabled]), textarea, select, [data-autofocus]",
    );
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, panelRef]);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  offsetTop?: number;
  onSubmit?: (e: FormEvent) => void;
}

export function Modal({ open, onClose, title, description, children, footer, maxWidth = 480, offsetTop = 120, onSubmit }: ModalProps) {
  const panelRef = useRef<HTMLFormElement | null>(null);
  useDialogBehavior(open, onClose, panelRef);
  if (!open) return null;

  return createPortal(
    <div className="af-overlay" style={{ paddingTop: offsetTop }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="af-dialog"
        style={{ maxWidth }}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(e);
        }}
      >
        <div className="af-dialog__head" style={{ padding: "24px 24px 0" }}>
          <div>
            <h2 className="af-h2">{title}</h2>
            {description ? (
              <p className="af-meta" style={{ margin: "2px 0 0", display: "block" }}>
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="af-iconbtn" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="af-dialog__body">{children}</div>
        {footer ? <div className="af-dialog__foot">{footer}</div> : null}
      </form>
    </div>,
    document.body,
  );
}

/* ---------- Confirm (alertdialog) ---------- */

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) => new Promise<boolean>((resolve) => setState({ ...options, resolve })),
    [],
  );

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  useDialogBehavior(Boolean(state), () => close(false), panelRef);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state
        ? createPortal(
            <div className="af-overlay" style={{ paddingTop: 160 }} onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
              <div
                ref={panelRef}
                role="alertdialog"
                aria-modal="true"
                aria-label={state.title}
                tabIndex={-1}
                className="af-dialog"
                style={{ maxWidth: 440 }}
              >
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 6 }}>
                  <h2 className="af-h2">{state.title}</h2>
                  {state.description ? <p style={{ margin: 0, color: "var(--muted-foreground)" }}>{state.description}</p> : null}
                </div>
                <div className="af-dialog__foot">
                  <button type="button" className="af-btn af-btn--ghost af-btn--md" onClick={() => close(false)}>
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    data-autofocus
                    className={cx("af-btn af-btn--md", state.destructive ? "af-btn--destructive" : "af-btn--primary")}
                    onClick={() => close(true)}
                  >
                    <span>{state.confirmLabel}</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

/* ---------- Toast ---------- */

type ToastTone = "success" | "danger" | "warning" | "info";
interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

const TOAST_ICON = { success: "circle-check", danger: "octagon-x", warning: "triangle-alert", info: "info" } as const;

type Notify = (tone: ToastTone, title: string, description?: string) => void;
const ToastContext = createContext<Notify | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const notify = useCallback<Notify>((tone, title, description) => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, tone, title, description }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {createPortal(
        <div className="af-toasts" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className={`af-toast af-toast--${t.tone}`} role={t.tone === "danger" ? "alert" : "status"}>
              <Icon name={TOAST_ICON[t.tone]} size={18} />
              <div className="af-toast__text">
                <div className="af-strong">{t.title}</div>
                {t.description ? <div className="af-meta">{t.description}</div> : null}
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used within ToastProvider");
  return {
    success: (title: string, description?: string) => notify("success", title, description),
    error: (title: string, description?: string) => notify("danger", title, description),
    warning: (title: string, description?: string) => notify("warning", title, description),
    info: (title: string, description?: string) => notify("info", title, description),
  };
}
