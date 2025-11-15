// src/pages/PublicarPartido.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Api } from "../api.js";

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function formatFechaLarga(ymd) {
  if (!ymd) return "";
  const d = new Date(ymd + "T00:00:00");
  return d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PublicarPartido() {
  const { id } = useParams(); // id de la reserva
  const navigate = useNavigate();
  const location = useLocation();

  const [reserva, setReserva] = useState(location.state?.reserva || null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cupos, setCupos] = useState(1);
  const [nivel, setNivel] = useState("cualquiera");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Si no viene la reserva en state, la buscamos en /api/reservas/mis
  useEffect(() => {
    (async () => {
      if (reserva) return;
      try {
        const todas = await Api.misReservas();
        const r = (todas || []).find((x) => String(x.id) === String(id));
        if (r) {
          setReserva(r);
        } else {
          setMsg("No se encontró la reserva.");
        }
      } catch (e) {
        console.error(e);
        setMsg("No se pudieron cargar los datos de la reserva.");
      }
    })();
  }, [id, reserva]);

  useEffect(() => {
    if (reserva && !titulo) {
      setTitulo(
        `Se busca jugador para partido en ${reserva.cancha_nombre || "cancha"}`
      );
    }
  }, [reserva, titulo]);

  if (!reserva) {
    return (
      <div style={pageBg}>
        <div style={card}>
          <p style={{ color: "#ffe6f3", fontSize: "0.9rem" }}>
            {msg || "Cargando datos de la reserva..."}
          </p>
          <button style={primaryBtn} onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const fechaBonita = formatFechaLarga(reserva.fecha);
  const horaInicio = (reserva.hora_inicio || "").slice(0, 5);
  const horaFin = (reserva.hora_fin || "").slice(0, 5);
  const monto = CLP.format(Number(reserva.monto_total || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg("");

      await Api.crearPartido({
        reserva_id: reserva.id,
        cupos_necesarios: Number(cupos) || 1,
        titulo,
        descripcion,
        nivel,
      });

      setMsg("Partido publicado correctamente ✅");
      setTimeout(() => {
        navigate("/resultados");
      }, 800);
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Error al publicar el partido");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={pageBg}>
      <div style={card}>
        <div style={topRow}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            ⬅ Volver
          </button>
          <h1 style={titleText}>Publicar partido</h1>
        </div>

        <div style={resumenBox}>
          <h2 style={resumenTitle}>Datos de la reserva</h2>
          <p style={resumenText}>
            <strong>{reserva.cancha_nombre || "Cancha sin nombre"}</strong>
          </p>
          <p style={resumenText}>
            📅 {fechaBonita} · ⏰ {horaInicio} – {horaFin}
          </p>
          <p style={resumenText}>💰 {monto}</p>
          <p style={resumenText}>
            📍 {reserva.ubicacion || "Ubicación no especificada"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={formBox}>
          <label style={label}>
            Título del aviso
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              style={input}
            />
          </label>

          <label style={label}>
            Descripción (nivel, qué buscan, etc.)
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              style={textarea}
              placeholder="Ej: Faltan 2, pichanga piola, todos bienvenidos..."
            />
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ ...label, flex: 1 }}>
              Cupos necesarios
              <input
                type="number"
                min={1}
                max={10}
                value={cupos}
                onChange={(e) => setCupos(e.target.value)}
                style={input}
              />
            </label>

            <label style={{ ...label, flex: 1 }}>
              Nivel del partido
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                style={input}
              >
                <option value="cualquiera">Cualquiera</option>
                <option value="piola">Pichanga piola</option>
                <option value="intermedio">Intermedio</option>
                <option value="competitivo">Competitivo</option>
              </select>
            </label>
          </div>

          {msg && (
            <p style={{ fontSize: "0.85rem", marginTop: 6, color: "#ffe6f3" }}>
              {msg}
            </p>
          )}

          <button type="submit" style={primaryBtn} disabled={saving}>
            {saving ? "Publicando..." : "Publicar partido (falta uno)"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ==== estilos ==== */

const pageBg = {
  minHeight: "100vh",
  padding: "90px 16px 32px",
  backgroundImage:
    "linear-gradient(130deg, rgba(0,0,0,.97), rgba(20,0,30,.95), rgba(60,0,80,.9))",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

const card = {
  width: "100%",
  maxWidth: 700,
  background: "rgba(0,0,0,.92)",
  borderRadius: 24,
  padding: 24,
  border: "1px solid rgba(255,105,180,.5)",
  boxShadow: "0 22px 60px rgba(0,0,0,.95)",
  backdropFilter: "blur(10px)",
  color: "#ffe6f3",
};

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};

const backBtn = {
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.7)",
  background:
    "radial-gradient(circle at top left, rgba(255,105,180,.25), rgba(0,0,0,.9))",
  color: "#ffe6f3",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
};

const titleText = {
  margin: 0,
  fontSize: "1.4rem",
  color: "#ff79c4",
};

const resumenBox = {
  borderRadius: 16,
  padding: 12,
  background:
    "linear-gradient(145deg, rgba(15,0,25,.98), rgba(5,0,10,.98))",
  border: "1px solid rgba(255,105,180,.25)",
  marginBottom: 16,
};

const resumenTitle = {
  margin: "0 0 6px",
  fontSize: "0.95rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#ffb3e1",
};

const resumenText = {
  margin: "2px 0",
  fontSize: "0.86rem",
};

const formBox = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const label = {
  fontSize: "0.85rem",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const input = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,105,180,.6)",
  background: "rgba(15,0,25,.88)",
  color: "#fff",
  outline: "none",
  fontSize: "0.9rem",
};

const textarea = {
  ...input,
  resize: "vertical",
};

const primaryBtn = {
  marginTop: 10,
  padding: "9px 18px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg, #ff61b6, #ffb3e1, #ff61b6)",
  color: "#2b0018",
  fontWeight: 800,
  fontSize: "0.95rem",
  cursor: "pointer",
  letterSpacing: "0.05em",
};
