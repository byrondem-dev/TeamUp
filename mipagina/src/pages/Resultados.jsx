// src/pages/Resultados.jsx
import React, { useState, useEffect, useRef } from "react";
import { Home, MapPin, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Api } from "../api";

function formatFechaCorta(ymd) {
  if (!ymd) return "";
  const solo = String(ymd).split("T")[0]; // por si viene con T
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

export default function Resultados() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  // vienen desde BuscarPartido: /resultados?fecha=YYYY-MM-DD&q=texto
  const fecha = params.get("fecha") || "";
  const q = params.get("q") || "";

  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [hoveredRec, setHoveredRec] = useState(null);
  const [hoveredRes, setHoveredRes] = useState(null);

  // carrusel recomendado
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef(null);

  const partidosRecomendados = [
    {
      nombre: "Clásico nocturno",
      direccion: "Maipú · Complejo Estadio City",
      fecha: "2025-09-10",
      hora: "21:00",
      jugadores: 4,
    },
    {
      nombre: "7 vs 7 mixto",
      direccion: "Ñuñoa · Campus Deportivo",
      fecha: "2025-09-10",
      hora: "20:00",
      jugadores: 3,
    },
    {
      nombre: "Fútbol empresa",
      direccion: "Santiago Centro · Tech Arena",
      fecha: "2025-09-11",
      hora: "19:30",
      jugadores: 5,
    },
    {
      nombre: "Partido tranqui",
      direccion: "La Florida · Canchas El Bosque",
      fecha: "2025-09-12",
      hora: "19:00",
      jugadores: 2,
    },
  ];

  // 🧠 Cargar partidos reales desde /api/partidos
  useEffect(() => {
    (async () => {
      try {
        // si no hay fecha, no llamamos al backend
        if (!fecha) {
          setPartidos([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        setErrorMsg("");
        const data = await Api.partidos({ fecha, q });
        setPartidos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "No se pudieron cargar los partidos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [fecha, q]);

  // 🎠 Scroll automático del carrusel recomendado
  useEffect(() => {
    const interval = setInterval(() => {
      const cardWidth = 260 + 15; // ancho tarjeta + gap
      setScrollPosition((prev) => {
        const totalCards = partidosRecomendados.length * 2;
        const maxScroll = cardWidth * (totalCards - 1);
        const next = prev + cardWidth;
        return next >= maxScroll ? 0 : next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.hero}>
      <div style={styles.overlay} />

      {/* Botón Inicio */}
      <div style={styles.homeBtn} onClick={() => navigate("/")}>
        <Home size={22} />
        <span>Inicio</span>
      </div>

      <div style={styles.content}>
        {/* Partidos recomendados (maqueta) */}
        <div style={styles.window}>
          <h2 style={styles.windowTitle}>Partidos destacados</h2>
          <p style={styles.windowSub}>
            Sugerencias según la comunidad. Tus partidos reales aparecerán
            abajo cuando los publiques con <strong>“Me falta uno”</strong>.
          </p>
          <div style={styles.recommendedWrapper}>
            <div
              ref={carouselRef}
              style={{
                display: "flex",
                transform: `translateX(-${scrollPosition}px)`,
                transition: "transform 1s ease-in-out",
              }}
            >
              {[...partidosRecomendados, ...partidosRecomendados].map(
                (partido, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.recommendedCard,
                      transform:
                        hoveredRec === index ? "scale(1.05)" : "scale(1)",
                      boxShadow:
                        hoveredRec === index
                          ? "0 0 20px 5px rgba(255,20,147,0.7)"
                          : "0 4px 10px rgba(0,0,0,0.4)",
                    }}
                    onMouseEnter={() => setHoveredRec(index)}
                    onMouseLeave={() => setHoveredRec(null)}
                  >
                    <span
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {partido.nombre}
                    </span>
                    <span style={{ fontSize: "0.95rem", marginBottom: 4 }}>
                      📍 {partido.direccion}
                    </span>
                    <span style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                      📅 {partido.fecha} · ⏰ {partido.hora}
                    </span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        marginTop: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(150,255,210,0.7)",
                        background: "rgba(0,0,0,0.85)",
                      }}
                    >
                      <Users size={14} />
                      Faltan {partido.jugadores} jugadores
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Resultados reales desde backend */}
        <div style={styles.resultadosWrapper}>
          <div style={styles.resultadosHeader}>
            <div>
              <h2 style={styles.windowTitle}>Partidos encontrados</h2>
              <p style={styles.windowSub}>
                {fecha
                  ? `Fecha: ${formatFechaCorta(fecha)}${
                      q ? ` · Zona: ${q}` : ""
                    }`
                  : "Usa el buscador para escoger fecha y zona."}
              </p>
            </div>
            <button
              style={styles.refilterBtn}
              onClick={() => navigate("/buscar")}
            >
              Cambiar búsqueda
            </button>
          </div>

          {loading && (
            <p style={styles.infoText}>Buscando partidos disponibles… ⏳</p>
          )}

          {!loading && errorMsg && (
            <p style={{ ...styles.infoText, color: "#ff9fbf" }}>
              {errorMsg}
            </p>
          )}

          {!loading && !errorMsg && !loading && !fecha && (
            <p style={styles.infoText}>
              Primero elige una fecha en <strong>“Buscar partido”</strong>.
            </p>
          )}

          {!loading && !errorMsg && partidos.length === 0 && fecha && (
            <p style={styles.infoText}>
              No encontramos partidos publicados para esta fecha.  
              Publica uno desde <strong>“Mis reservas → Me falta uno”</strong>{" "}
              y aparecerá aquí.
            </p>
          )}

          {!loading && !errorMsg && partidos.length > 0 && (
            <div style={styles.resultadosGrid}>
              {partidos.map((p, index) => {
                const cuposUsados = p.confirmados || 0;
                const vacantes = p.vacantes ?? 0;
                const cuposRestantes =
                  vacantes - cuposUsados >= 0 ? vacantes - cuposUsados : 0;

                return (
                  <div
                    key={p.id}
                    style={{
                      ...styles.repertorioCard,
                      transform:
                        hoveredRes === index ? "scale(1.05)" : "scale(1)",
                      boxShadow:
                        hoveredRes === index
                          ? "0 0 25px 5px rgba(255,20,147,0.7)"
                          : "0 2px 10px rgba(0,0,0,0.6)",
                    }}
                    onMouseEnter={() => setHoveredRes(index)}
                    onMouseLeave={() => setHoveredRes(null)}
                    onClick={() => navigate(`/partido/${p.id}`)}
                  >
                    <span style={styles.repertorioNombre}>
                      {p.cancha_nombre || "Cancha sin nombre"}
                    </span>

                    <span style={styles.repertorioUbicacion}>
                      <MapPin size={14} />{" "}
                      {p.ubicacion || "Ubicación no especificada"}
                    </span>

                    <span style={styles.repertorioFecha}>
                      {formatFechaCorta(p.fecha)} · {p.hora_inicio} –{" "}
                      {p.hora_fin}
                    </span>

                    <span style={styles.repertorioVacantes}>
                      <Users size={14} />
                      {cuposRestantes > 0
                        ? ` Faltan ${cuposRestantes} jugadores`
                        : " Cupos completos"}
                    </span>

                    {p.descripcion && (
                      <span style={styles.repertorioDescripcion}>
                        {p.descripcion}
                      </span>
                    )}

                    {p.organizador_nombre && (
                      <span style={styles.repertorioOrganizador}>
                        Organiza: {p.organizador_nombre}
                      </span>
                    )}

                    <span style={styles.verDetalle}>
                      Ver detalle e inscribirme →
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  hero: {
    backgroundImage:
      "url('https://static.independentespanol.com/2024/02/22/04/MLS-RESUMEN_56820.jpg')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center 20%",
    backgroundSize: "cover",
    minHeight: "100vh",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Poppins', sans-serif",
    padding: "20px 10px 40px",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(130deg, rgba(0,0,0,0.96), rgba(15,0,25,0.96), rgba(50,0,70,0.9))",
    zIndex: 0,
  },
  homeBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    cursor: "pointer",
    color: "#ff1493",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: "bold",
    zIndex: 10,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,105,180,0.8)",
    background:
      "radial-gradient(circle at top left, rgba(255,105,180,.25), rgba(0,0,0,.9))",
    fontSize: "0.85rem",
  },
  content: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 1180,
    margin: "0 auto",
    marginTop: 50,
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  window: {
    background: "rgba(10,10,10,0.96)",
    borderRadius: 18,
    padding: 16,
    width: "100%",
    marginBottom: 10,
    boxShadow: "0 10px 28px rgba(0,0,0,0.8)",
    border: "1px solid rgba(255,105,180,0.6)",
  },
  windowTitle: {
    color: "#ff1493",
    fontSize: "1.4rem",
    marginBottom: 4,
    textAlign: "left",
  },
  windowSub: {
    margin: 0,
    marginBottom: 10,
    fontSize: "0.9rem",
    color: "#ffe6f3",
    opacity: 0.9,
  },
  recommendedWrapper: {
    overflow: "hidden",
    width: "100%",
    display: "flex",
    padding: "10px 0",
  },
  recommendedCard: {
    flex: "0 0 260px",
    height: "220px",
    background:
      "radial-gradient(circle at top, #1a1a1a, #050509, #050008)",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    textAlign: "center",
    cursor: "pointer",
    marginRight: 15,
    transition: "all 0.3s ease",
  },
  resultadosWrapper: {
    width: "100%",
    maxWidth: 1180,
    background: "rgba(7,7,7,0.96)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 32px rgba(0,0,0,0.85)",
    border: "1px solid rgba(255,105,180,0.6)",
  },
  resultadosHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  refilterBtn: {
    padding: "6px 14px",
    borderRadius: 999,
    border: "1px solid rgba(150,255,210,0.9)",
    background:
      "linear-gradient(135deg, rgba(0,40,20,.96), rgba(5,0,20,.96))",
    color: "#b4ffe3",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.04em",
  },
  infoText: {
    marginTop: 6,
    fontSize: "0.9rem",
    color: "#ffe6f3",
    opacity: 0.9,
  },
  resultadosGrid: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 14,
  },
  repertorioCard: {
    width: "100%",
    background: "linear-gradient(135deg, #141414, #050507)",
    padding: 14,
    borderRadius: 12,
    color: "#fff",
    textAlign: "left",
    fontSize: "0.9rem",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    border: "1px solid rgba(255,105,180,0.45)",
    transition: "all 0.25s ease",
  },
  repertorioNombre: {
    display: "block",
    fontWeight: 700,
    marginBottom: 2,
    fontSize: "1rem",
    color: "#ffb3e1",
  },
  repertorioUbicacion: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: "0.8rem",
    color: "#ffe6f3",
    opacity: 0.9,
  },
  repertorioFecha: {
    display: "block",
    fontSize: "0.85rem",
    color: "#e4fdf4",
  },
  repertorioVacantes: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    fontSize: "0.8rem",
    color: "#c8ffe8",
  },
  repertorioDescripcion: {
    marginTop: 4,
    fontSize: "0.8rem",
    color: "#fefefe",
    opacity: 0.9,
  },
  repertorioOrganizador: {
    marginTop: 2,
    fontSize: "0.78rem",
    color: "#ffd5ec",
  },
  verDetalle: {
    marginTop: 6,
    fontSize: "0.78rem",
    color: "#ff79c4",
    textAlign: "right",
  },
};
