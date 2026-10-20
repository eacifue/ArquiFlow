import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { homePathFor, useAuth } from "@/lib/auth";
import { Icon } from "@/ui/Icon";

export function LoginScreen() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("expired") === "1" ? "Tu sesión expiró. Ingresá de nuevo." : null,
  );
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  if (user) return <Navigate to={homePathFor(user)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const logged = await login(email, password);
      const from = params.get("from");
      navigate(from && from.startsWith("/") && from !== "/login" ? from : homePathFor(logged), { replace: true });
    } catch {
      setError("El email o la contraseña no coinciden. Revisalos e intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <section aria-hidden="true" className="login__art">
        <div className="login__bars">
          <div style={{ width: "48%", marginLeft: "0%", background: "var(--primary)" }} />
          <div style={{ width: "56%", marginLeft: "14%", background: "var(--chart-2)" }} />
          <div style={{ width: "62%", marginLeft: "26%", background: "var(--foreground)" }} />
          <div style={{ width: "58%", marginLeft: "38%", background: "var(--warning)" }} />
          <div style={{ width: "12%", marginLeft: "66%", background: "var(--success)" }} />
        </div>
        <div className="login__brand">
          <span>ArquiFlow</span>
          <span style={{ color: "var(--muted-foreground)" }}>Control de obra y presupuesto, después de la firma.</span>
        </div>
      </section>

      <main className="login__main">
        <form className="login__form" onSubmit={submit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h1 style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600, letterSpacing: "-0.01em" }}>Ingresar</h1>
            <p style={{ fontSize: 14, lineHeight: "20px", color: "var(--muted-foreground)" }}>
              Con el email y la contraseña que te dio el estudio.
            </p>
          </div>

          {error ? (
            <div role="alert" className="login__alert">
              <Icon name="octagon-x" size={18} style={{ flex: "none", marginTop: 1 }} />
              <span>{error}</span>
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="email" style={{ fontSize: 14, fontWeight: 500 }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              className="login__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label htmlFor="pass" style={{ fontSize: 14, fontWeight: 500 }}>
                Contraseña
              </label>
              <a
                href="#"
                style={{ fontSize: 13, textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  setShowForgot((v) => !v);
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <input
              id="pass"
              type="password"
              autoComplete="current-password"
              required
              className={error && !error.startsWith("Tu sesión") ? "login__input is-error" : "login__input"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {showForgot ? (
              <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--muted-foreground)" }}>
                Pedile al estudio que te genere una contraseña nueva.
              </span>
            ) : null}
          </div>

          <button type="submit" className="login__submit" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </button>

          <p
            style={{
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              fontSize: 13,
              lineHeight: "18px",
              color: "var(--muted-foreground)",
            }}
          >
            No hay registro público. Las cuentas las crea el estudio; si sos cliente, usá los datos de tu invitación.
          </p>
        </form>
      </main>
    </div>
  );
}
