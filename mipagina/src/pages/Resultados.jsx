// src/pages/Resultados.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  MapPin,
  Users,
  CalendarDays,
  Clock3,
} from "lucide-react";
import { Api } from "../api";
import "../App.css";

// ==== Helpers de formato =====
function formatFechaBonita(fechaRaw) {
  if (!fechaRaw) return "";
  const solo = String(fechaRaw).split("T")[0]; // "2025-11-16"
  const [y, m, d] = solo.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return solo;
  const dt = new Date(y, m - 1, d);
  try {
    return dt.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return solo;
  }
}

function recortarHora(h) {
  if (!h) return "";
  return String(h).slice(0, 5); // "HH:MM"
}

export default function Resultados() {
  const location = useLocation();
  const navigate = useNavigate();

  // 👇 Leemos filtros del querystring (solo una vez y memorizamos)
  const filtros = useMemo(() => {
    const searchParams = new URLSearchParams(location.search || "");
    return {
      fecha: searchParams.get("fecha") || "",
      q: searchParams.get("q") || "",
      horario: searchParams.get("horario") || "",
      tipo: searchParams.get("tipo") || "",
      nivel: searchParams.get("nivel") || "",
    };
  }, [location.search]);

  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function fetchPartidos() {
      try {
        setLoading(true);
        setError("");

        const data = await Api.buscarPartidos({
          fecha: filtros.fecha || undefined,
          q: filtros.q || undefined,
          horario: filtros.horario || undefined,
          tipo: filtros.tipo || undefined,
          nivel: filtros.nivel || undefined,
        });

        if (!cancelado) {
          setPartidos(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("ERROR CARGANDO PARTIDOS:", e);
        const msg =
          e?.response?.data?.error ||
          e.message ||
          "No se pudieron cargar los partidos. Intenta de nuevo.";
        if (!cancelado) setError(msg);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    fetchPartidos();
    return () => {
      cancelado = true;
    };
  }, [filtros.fecha, filtros.q, filtros.horario, filtros.tipo, filtros.nivel]);

  const hayFiltrosActivos =
    filtros.q || filtros.fecha || filtros.horario || filtros.tipo || filtros.nivel;

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundImage:
          "url('https://wallpapercave.com/wp/wp13056831.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay oscuro */}
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
          boxShadow: "0 0 12px rgba(255,105,180,0.55)",
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
        }}
      >
        {/* Encabezado */}
        <header
          style={{
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            color: "#ffe6f3",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.9rem",
              color: "#ff79c4",
              textShadow: "0 0 18px rgba(255,105,180,0.85)",
              letterSpacing: "0.6px",
            }}
          >
            Resultados de partidos
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              maxWidth: 620,
              opacity: 0.9,
            }}
          >
            {hayFiltrosActivos
              ? "Mostrando partidos según tus filtros seleccionados en el buscador."
              : "Mostrando partidos disponibles sin filtros específicos."}
          </p>

          {/* Fila: chips + contador */}
          <div
            style={{
              marginTop: 6,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {filtros.q && (
                <FiltroChip icon={<MapPin size={14} />} label={filtros.q} />
              )}
              {filtros.fecha && (
                <FiltroChip
                  icon={<CalendarDays size={14} />}
                  label={formatFechaBonita(filtros.fecha)}
                />
              )}
              {filtros.horario && (
                <FiltroChip icon={<Clock3 size={14} />} label={filtros.horario} />
              )}
              {filtros.tipo && (
                <FiltroChip icon={<Users size={14} />} label={filtros.tipo} />
              )}
              {filtros.nivel && (
                <FiltroChip icon={<Users size={14} />} label={filtros.nivel} />
              )}
            </div>

            {/* Resumen resultados */}
            {!loading && !error && (
              <div
                style={{
                  fontSize: "0.8rem",
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,105,180,0.7)",
                  background: "rgba(0,0,0,0.7)",
                  color: "#ffd9f0",
                  whiteSpace: "nowrap",
                }}
              >
                {partidos.length === 1
                  ? "1 partido encontrado"
                  : `${partidos.length} partidos encontrados`}
              </div>
            )}
          </div>
        </header>

        {/* Estados de carga / error */}
        {loading && (
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: "rgba(0,0,0,0.88)",
              border: "1px solid rgba(255,105,180,0.6)",
              color: "#ffe6f3",
              fontSize: "0.88rem",
            }}
          >
            Cargando partidos…
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: "rgba(40,0,20,0.9)",
              border: "1px solid rgba(255,105,180,0.8)",
              color: "#ffe6f3",
              fontSize: "0.88rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && !error && partidos.length === 0 && (
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: "rgba(0,0,0,0.9)",
              border: "1px solid rgba(255,105,180,0.4)",
              color: "#ffe6f3",
              fontSize: "0.9rem",
            }}
          >
            No encontramos partidos con esos filtros. Prueba cambiando la fecha,
            el horario o la zona.
          </div>
        )}

        {/* Lista de partidos */}
        {!loading && !error && partidos.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 18,
              marginTop: 8,
            }}
          >
            {partidos.map((p) => {
              const fechaFmt = p.fecha ? formatFechaBonita(p.fecha) : "";
              const horaIni = recortarHora(p.hora_inicio);
              const horaFin = recortarHora(p.hora_fin);

              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/partido/${p.id}`)}
                  style={{
                    borderRadius: 20,
                    padding: 14,
                    background:
                      "radial-gradient(circle at top left, rgba(255,105,180,0.12), rgba(0,0,0,0.95))",
                    border: "1px solid rgba(255,105,180,0.55)",
                    color: "#ffe6f3",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    boxShadow: "0 0 14px rgba(0,0,0,0.65)",
                    cursor: "pointer",
                    transition: "transform 0.16s ease, box-shadow 0.16s ease, border 0.16s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 0 22px rgba(255,105,180,0.55)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255,182,220,0.95)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 0 14px rgba(0,0,0,0.65)";
                    e.currentTarget.style.border =
                      "1px solid rgba(255,105,180,0.55)";
                  }}
                >
                  {/* Título + vacantes */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#ffb3e1",
                      }}
                    >
                      {p.nombre_partido || p.titulo || "Partido de fútbol"}
                    </div>

                    {typeof p.vacantes === "number" && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "3px 8px",
                          borderRadius: 999,
                          background:
                            p.vacantes > 0
                              ? "rgba(0,200,120,0.18)"
                              : "rgba(200,0,80,0.25)",
                          border:
                            p.vacantes > 0
                              ? "1px solid rgba(0,220,140,0.8)"
                              : "1px solid rgba(255,120,180,0.9)",
                          color: p.vacantes > 0 ? "#aaffdd" : "#ffc0d9",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.vacantes > 0
                          ? `${p.vacantes} vacantes`
                          : "Sin vacantes"}
                      </span>
                    )}
                  </div>

                  {/* Fila de badges tipo / nivel */}
                  {(p.tipo || p.nivel) && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 2,
                        fontSize: "0.72rem",
                      }}
                    >
                      {p.tipo && (
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 999,
                            background: "rgba(0,0,0,0.8)",
                            border: "1px solid rgba(255,105,180,0.7)",
                            color: "#ffd9f0",
                          }}
                        >
                          {p.tipo}
                        </span>
                      )}
                      {p.nivel && (
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 999,
                            background: "rgba(0,0,0,0.8)",
                            border: "1px solid rgba(180,160,255,0.7)",
                            color: "#e0d9ff",
                          }}
                        >
                          Nivel: {p.nivel}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Datos básicos estructurados */}
                  <div
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.96,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    {p.fecha && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <CalendarDays size={14} />
                        <span>{fechaFmt}</span>
                      </div>
                    )}

                    {horaIni && horaFin && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Clock3 size={14} />
                        <span>
                          {horaIni} - {horaFin}
                        </span>
                      </div>
                    )}

                    {(p.ubicacion || p.nombre_cancha) && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                          <MapPin size={14} />
                          <span>{p.ubicacion || p.nombre_cancha}</span>
                      </div>
                    )}

                    {typeof p.vacantes === "number" && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Users size={14} />
                        <span>
                          Vacantes:{" "}
                          <strong style={{ fontWeight: 600 }}>
                            {p.vacantes}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Descripción corta */}
                  {p.descripcion && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: "0.76rem",
                        lineHeight: 1.35,
                        opacity: 0.9,
                      }}
                    >
                      <strong style={{ fontWeight: 600 }}>Detalle: </strong>
                      <span>
                        {String(p.descripcion).length > 140
                          ? String(p.descripcion).slice(0, 140) + "…"
                          : p.descripcion}
                      </span>
                    </div>
                  )}

                  {/* Botón detalle */}
                  <button
                    style={{
                      marginTop: 10,
                      alignSelf: "flex-start",
                      padding: "6px 14px",
                      borderRadius: 999,
                      border: "none",
                      background:
                        "linear-gradient(135deg,#ff61b6,#ffb3e1,#ff61b6)",
                      color: "#2b0018",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 0 12px rgba(255,105,180,0.7)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // para que no dispare el onClick de la tarjeta
                      navigate(`/partido/${p.id}`);
                    }}
                  >
                    Ver detalle
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Chip reutilizable para filtros */
function FiltroChip({ icon, label }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.85)",
        border: "1px solid rgba(255,105,180,0.7)",
        fontSize: "0.78rem",
        color: "#ffd9f0",
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
