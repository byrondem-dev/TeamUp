import React, { useState } from "react";
import { apiPost } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ nombre: "", email: "", password: "", tipo: "jugador" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      tipo: form.tipo,
    };
    if (!payload.nombre || !payload.email || !payload.password || !payload.tipo) {
      setMsg("Faltan campos");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/auth/register", payload);
      alert("Registrado. Ahora inicia sesión.");
      nav("/login");
    } catch (er) {
      setMsg(er.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111", display: "grid", placeItems: "center" }}>
      <form onSubmit={submit} style={{ width: 360, background: "#1a1a1a", padding: 24, borderRadius: 12, display: "grid", gap: 10 }}>
        <h2 style={{ color: "#ff69b4" }}>Crear cuenta</h2>
        <input style={inp} name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} />
        <input style={inp} type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} />
        <input style={inp} type="password" name="password" placeholder="Contraseña" value={form.password} onChange={onChange} />
        <select style={inp} name="tipo" value={form.tipo} onChange={onChange}>
          <option value="jugador">Jugador</option>
          <option value="dueno">Dueño</option>
        </select>
        <button style={btn} disabled={loading}>{loading ? "Creando..." : "Registrarme"}</button>

        {msg && (
          <div style={{ background: "rgba(255,0,70,.15)", border: "1px solid rgba(255,0,70,.4)", color: "#ffd6e4", padding: 10, borderRadius: 8 }}>
            {msg}
          </div>
        )}

        <p style={{ color: "#bbb", marginTop: 8 }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: "#fff" }}>Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}

const inp = { padding: 10, borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff" };
const btn = { background: "#ff1493", color: "#fff", border: "none", padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" };
