import React, { useState } from "react";
import { apiPost } from "../api";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const email = form.email.trim();
    const password = form.password.trim();
    if (!email || !password) {
      setMsg("Faltan campos");
      return;
    }
    setLoading(true);
    try {
      const r = await apiPost("/api/auth/login", { email, password });
      // guarda todo lo que usa HomeLanding
      localStorage.setItem("token", r.token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(r.user || {}));
      if (r.user?.email) localStorage.setItem("userEmail", r.user.email);
      if (r.user?.tipo)  localStorage.setItem("userRole", r.user.tipo);

      nav(from === "/login" ? "/" : from, { replace: true });
    } catch (er) {
      setMsg(er.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111", display: "grid", placeItems: "center" }}>
      <form onSubmit={submit} style={{ width: 360, background: "#1a1a1a", padding: 24, borderRadius: 12, display: "grid", gap: 10 }}>
        <h2 style={{ color: "#9ec1ff" }}>Iniciar sesión</h2>
        <input
          style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff" }}
          type="email" name="email" placeholder="Email"
          value={form.email} onChange={onChange}
        />
        <input
          style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff" }}
          type="password" name="password" placeholder="Contraseña"
          value={form.password} onChange={onChange}
        />
        <button
          style={{ background: "#ff1493", color: "#fff", border: "none", padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>

        {msg && (
          <div style={{ background: "rgba(255,0,70,.15)", border: "1px solid rgba(255,0,70,.4)", color: "#ffd6e4", padding: 10, borderRadius: 8 }}>
            {msg}
          </div>
        )}

        <p style={{ color: "#bbb", marginTop: 8 }}>
          ¿No tienes cuenta? <Link to="/register" style={{ color: "#fff" }}>Regístrate</Link>
        </p>
      </form>
    </div>
  );
}
