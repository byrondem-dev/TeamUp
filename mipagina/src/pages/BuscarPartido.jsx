// src/pages/BuscarPartido.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  MapPin,
  CalendarDays,
  Clock3,
  Users,
  Trophy,
} from "lucide-react";
import "../App.css";

export default function BuscarPartido() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState({
    ciudad: "",
    fecha: "",
    horario: "noche",
    tipo: "amistoso",
    nivel: "mixto",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBusqueda((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 👉 Ahora mandamos los filtros a /resultados como querystring
    const params = new URLSearchParams({
      fecha: busqueda.fecha,
      q: busqueda.ciudad,
      horario: busqueda.horario,
      tipo: busqueda.tipo,
      nivel: busqueda.nivel,
    });

    navigate(`/resultados?${params.toString()}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundImage:
          "url('https://assets.goal.com/images/v3/blte8158c229856001c/Lionel%20Messi%20GFX.jpg?auto=webp&format=pjpg&width=3840&quality=60')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      {/* Overlay degradado */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(0,0,0,0.96), rgba(10,0,20,0.94), rgba(60,0,80,0.9))",
        }}
      />

      {/* Botón inicio */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid rgba(255,105,180,0.8)",
          background:
            "radial-gradient(circle at top left, rgba(255,105,180,.25), rgba(0,0,0,.9))",
          color: "#ffb3e1",
          cursor: "pointer",
          fontSize: "0.85rem",
          fontWeight: 600,
          zIndex: 10,
        }}
      >
        <Home size={18} />
        Inicio
      </button>

      {/* Contenido principal */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1120,
          margin: "0 auto",
          padding: "80px 16px 32px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 28,
          alignItems: "center",
        }}
      >
        {/* Lado izquierdo: texto, features, chips */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(255,105,180,0.16)",
              border: "1px solid rgba(255,105,180,0.7)",
              marginBottom: 10,
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#ffd9f0",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #6dffbf 0%, #3cff9d 50%, #00d67b 100%)",
                boxShadow: "0 0 8px rgba(109,255,191,0.9)",
              }}
            />
            Buscador de partidos
          </div>

          <h1
            style={{
              fontSize: "2.4rem",
              lineHeight: 1.15,
              margin: 0,
              color: "#ff79c4",
              textShadow: "0 0 18px rgba(255,105,180,0.85)",
            }}
          >
            Encuentra tu próximo <br />
            <span style={{ color: "#ffffff" }}>partido de fútbol</span>
          </h1>

          <p
            style={{
              marginTop: 10,
              marginBottom: 18,
              fontSize: "0.98rem",
              color: "rgba(255,230,243,0.92)",
              maxWidth: 480,
            }}
          >
            Elige tu ciudad, fecha y estilo de partido. Nosotros te mostramos
            las canchas y equipos que necesitan jugadores. Sin grupos raros, todo
            en un solo lugar.
          </p>

          {/* Chips rápidos */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div style={chip}>
              <Users size={16} />
              5 vs 5 · 7 vs 7 · 11 vs 11
            </div>
            <div style={chip}>
              <Clock3 size={16} />
              Partidos hoy y mañana
            </div>
            <div style={chip}>
              <Trophy size={16} />
              Amistosos y torneos
            </div>
          </div>

          {/* 3 mini-cards de pasos */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
              marginTop: 6,
            }}
          >
            <div style={stepCard}>
              <div style={stepBadge}>1</div>
              <div style={stepTitle}>Busca</div>
              <div style={stepText}>
                Filtra por ciudad, fecha y rango horario.
              </div>
            </div>
            <div style={stepCard}>
              <div style={stepBadge}>2</div>
              <div style={stepTitle}>Elige</div>
              <div style={stepText}>
                Revisa canchas, tipo de partido y nivel.
              </div>
            </div>
            <div style={stepCard}>
              <div style={stepBadge}>3</div>
              <div style={stepTitle}>Juega</div>
              <div style={stepText}>
                Confirma tu cupo y solo preocúpate de asistir.
              </div>
            </div>
          </div>
        </div>

        {/* Lado derecho: card de búsqueda */}
        <div
          style={{
            background: "rgba(0,0,0,0.94)",
            borderRadius: 20,
            padding: 20,
            border: "1px solid rgba(255,105,180,0.7)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.9)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 6,
              fontSize: "1.2rem",
              color: "#ffb3e1",
            }}
          >
            Buscar partidos
          </h2>
          <p
            style={{
              margin: 0,
              marginBottom: 14,
              fontSize: "0.85rem",
              color: "#ffe6f3",
              opacity: 0.9,
            }}
          >
            Completa los datos y te mostraremos partidos disponibles según tu
            perfil.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Ciudad */}
            <div style={fieldWrapper}>
              <label style={fieldLabel}>Ciudad o zona</label>
              <div style={fieldInputBox}>
                <MapPin size={18} color="#ff69b4" />
                <input
                  type="text"
                  name="ciudad"
                  value={busqueda.ciudad}
                  onChange={handleChange}
                  placeholder="Ej: Maipú, Ñuñoa, Quilicura..."
                  required
                  style={fieldInput}
                />
              </div>
            </div>

            {/* Fecha */}
            <div style={fieldWrapper}>
              <label style={fieldLabel}>Fecha</label>
              <div style={fieldInputBox}>
                <CalendarDays size={18} color="#ff69b4" />
                <input
                  type="date"
                  name="fecha"
                  value={busqueda.fecha}
                  onChange={handleChange}
                  required
                  style={{
                    ...fieldInput,
                    paddingRight: 0,
                  }}
                />
              </div>
            </div>

            {/* Horario preferido */}
            <div style={fieldWrapper}>
              <label style={fieldLabel}>Horario preferido</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { value: "manana", label: "Mañana" },
                  { value: "tarde", label: "Tarde" },
                  { value: "noche", label: "Noche" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setBusqueda((prev) => ({ ...prev, horario: opt.value }))
                    }
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 999,
                      border:
                        busqueda.horario === opt.value
                          ? "1px solid rgba(150,255,210,0.9)"
                          : "1px solid rgba(255,255,255,0.12)",
                      background:
                        busqueda.horario === opt.value
                          ? "linear-gradient(135deg,#6dffbf,#c9ffe6)"
                          : "rgba(10,10,10,0.95)",
                      color:
                        busqueda.horario === opt.value ? "#02150b" : "#fefefe",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de partido */}
            <div style={fieldWrapper}>
              <label style={fieldLabel}>Tipo de partido</label>
              <select
                name="tipo"
                value={busqueda.tipo}
                onChange={handleChange}
                style={{
                  ...fieldInput,
                  paddingLeft: 10,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  backgroundImage:
                    "linear-gradient(135deg, rgba(255,105,180,0.2), rgba(0,0,0,0.9))",
                }}
              >
                <option value="amistoso">Amistoso entre amigos</option>
                <option value="torneo">Torneo / liga</option>
                <option value="empresa">Empresa o facultad</option>
              </select>
            </div>

            {/* Nivel */}
            <div style={fieldWrapper}>
              <label style={fieldLabel}>Nivel aproximado</label>
              <select
                name="nivel"
                value={busqueda.nivel}
                onChange={handleChange}
                style={{
                  ...fieldInput,
                  paddingLeft: 10,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  backgroundImage:
                    "linear-gradient(135deg, rgba(255,105,180,0.2), rgba(0,0,0,0.9))",
                }}
              >
                <option value="mixto">Mixto / relajado</option>
                <option value="intermedio">Intermedio</option>
                <option value="competitivo">Competitivo</option>
              </select>
            </div>

            {/* Botón buscar */}
            <button
              type="submit"
              style={submitBtn}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 22px rgba(255,105,180,0.95)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 12px rgba(255,105,180,0.65)")
              }
            >
              Buscar partidos ⚽
            </button>

            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: "0.75rem",
                color: "rgba(255,230,243,0.78)",
              }}
            >
              Ahora los resultados se cargan desde tu backend usando la tabla{" "}
              <code>partidos</code> 💾.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ===== estilos auxiliares ===== */

const chip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 10px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.85)",
  border: "1px solid rgba(255,105,180,0.7)",
  fontSize: "0.78rem",
  color: "#ffd9f0",
};

const stepCard = {
  position: "relative",
  borderRadius: 14,
  padding: "10px 10px 10px 14px",
  background:
    "linear-gradient(145deg, rgba(10,0,20,0.96), rgba(0,0,0,0.98))",
  border: "1px solid rgba(255,105,180,0.35)",
  color: "#ffe6f3",
  fontSize: "0.8rem",
};

const stepBadge = {
  width: 20,
  height: 20,
  borderRadius: 999,
  background: "linear-gradient(135deg,#ff61b6,#ffb3e1,#ff61b6)",
  color: "#2b0018",
  fontWeight: 800,
  fontSize: "0.8rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 4,
};

const stepTitle = {
  fontSize: "0.9rem",
  fontWeight: 700,
  marginBottom: 2,
  color: "#ffb3e1",
};

const stepText = {
  fontSize: "0.78rem",
  opacity: 0.92,
};

const fieldWrapper = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fieldLabel = {
  fontSize: "0.78rem",
  color: "#ffd1e8",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const fieldInputBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,105,180,0.8)",
  background: "rgba(5,0,10,0.96)",
};

const fieldInput = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#ffffff",
  fontSize: "0.9rem",
  padding: "6px 0",
};

const submitBtn = {
  marginTop: 6,
  width: "100%",
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg,#ff61b6,#ffb3e1,#ff61b6)",
  color: "#2b0018",
  fontWeight: 800,
  fontSize: "0.95rem",
  cursor: "pointer",
  letterSpacing: "0.05em",
  boxShadow: "0 0 12px rgba(255,105,180,0.65)",
};
