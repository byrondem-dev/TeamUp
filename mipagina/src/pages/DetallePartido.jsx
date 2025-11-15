// src/pages/PartidoDetalle.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Home,
  Users,
  MapPin,
  CalendarDays,
  Clock,
  Info,
  ChevronLeft,
  AlertCircle,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { Api } from "../api";

// Formato nice para la fecha
function formatFechaLarga(fechaRaw) {
  if (!fechaRaw) return "";
  const soloFecha = String(fechaRaw).split("T")[0]; // "2025-11-17"
  const d = new Date(soloFecha + "T00:00:00");
  try {
    return d.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return soloFecha;
  }
}

export default function PartidoDetalle() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  // Si vengo desde Resultados con state
  const partidoInicial = location.state?.partido || null;

  const [partido, setPartido] = useState(partidoInicial);
  const [loading, setLoading] = useState(!partidoInicial);
  const [errorMsg, setErrorMsg] = useState("");
  const [inscrito, setInscrito] = useState(false);

  // 👉 Si NO viene partido por state, lo pedimos al backend
  useEffect(() => {
    if (partido || !id) return; // ya tengo datos o no hay id

    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const data = await Api.partidoDetalle(id);
        setPartido(data || null);
        // si el backend algún día manda "ya_estas_inscrito", lo usamos
        if (data && data.ya_estas_inscrito) {
          setInscrito(true);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(
          err.message || "No se pudo cargar la información del partido."
        );
        setPartido(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, partido]);

  // Si todavía está cargando
  if (loading) {
    return (
      <div style={pageBg}>
        <div style={simpleOverlay} />
        <div style={fallbackCard}>
          <h1 style={titleText}>Cargando partido…</h1>
          <p style={fallbackText}>Espera un momento mientras traemos los datos.</p>
        </div>
      </div>
    );
  }

  // Si hubo error o no hay partido
  if (!partido || errorMsg) {
    return (
      <div style={pageBg}>
        <div style={simpleOverlay} />
        <div style={fallbackCard}>
          <h1 style={titleText}>Partido no encontrado</h1>
          <p style={fallbackText}>
            {errorMsg ||
              "No encontramos los datos del partido. Vuelve a buscar uno y selecciona su detalle."}
          </p>
          <button style={primaryBtn} onClick={() => navigate("/buscar")}>
            Volver a buscar partidos 🔎
          </button>
        </div>
      </div>
    );
  }

  // ==== cálculos a partir del partido ====
  const fechaBonita = formatFechaLarga(partido.fecha);
  const vacantes = Number(partido.vacantes ?? 0);
  const confirmados = Number(partido.confirmados ?? 0);
  const disponibles = Math.max(vacantes - confirmados, 0);

  let estadoTexto = "Buscando jugadores";
  let estadoColor = "#ffebf8";
  if (disponibles <= 0) {
    estadoTexto = "Partido completo";
    estadoColor = "#b4ffe3";
  } else if (disponibles === 1) {
    estadoTexto = "Falta 1 jugador";
    estadoColor = "#fff3c4";
  } else if (disponibles > 1) {
    estadoTexto = `Faltan ${disponibles} jugadores`;
    estadoColor = "#fff3c4";
  }

  // 👉 Inscribirse de verdad usando backend
  const handleInscribirme = async () => {
    if (disponibles <= 0 || inscrito || !partido) return;

    try {
      // POST /api/partidos/:id/unirse
      await Api.unirsePartido(partido.id);
      setInscrito(true);
      // actualizamos contador localmente
      setPartido((prev) =>
        prev
          ? { ...prev, confirmados: (prev.confirmados || 0) + 1 }
          : prev
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo inscribirte en el partido.");
    }
  };

  return (
    <div style={pageBg}>
      <div style={overlay} />

      {/* Home fijo arriba */}
      <button style={homeBtn} onClick={() => navigate("/")}>
        <Home size={20} />
        <span>Inicio</span>
      </button>

      <div style={shellCard}>
        {/* Barra superior */}
        <div style={headerRow}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={18} />
            <span>Volver</span>
          </button>

          <div style={{ textAlign: "right" }}>
            <div style={smallLabel}>Detalle del partido</div>
            <h1 style={titleText}>
              {partido.titulo ||
                `Partido en ${partido.cancha_nombre || "cancha"}`}
            </h1>
          </div>
        </div>

        {/* Contenido principal: 2 columnas */}
        <div style={contentGrid}>
          {/* Izquierda: imagen + info cancha */}
          <div style={leftCol}>
            <div style={photoCard}>
              <img
                src={
                  partido.foto ||
                  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1600&auto=format&fit=crop"
                }
                alt={partido.cancha_nombre || "Cancha"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div style={photoGradient} />
              <div style={photoBadgeTopLeft}>
                {partido.cancha_nombre || "Cancha"}
              </div>
              <div style={photoBadgeBottomRight}>
                <Users size={15} />
                <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>
                  {confirmados}/{vacantes || "?"} jugadores
                </span>
              </div>
              <div
                style={{
                  ...photoChipEstado,
                  borderColor:
                    disponibles <= 0
                      ? "rgba(150,255,210,.95)"
                      : "rgba(255,240,180,.95)",
                  color: estadoColor,
                }}
              >
                <AlertCircle size={14} />
                <span>{estadoTexto}</span>
              </div>
            </div>

            {/* Info cancha / partido */}
            <div style={infoCard}>
              <div style={infoRow}>
                <MapPin size={18} style={{ color: "#ffb3e1" }} />
                <div>
                  <div style={infoLabel}>Lugar</div>
                  <div style={infoValue}>
                    {partido.ubicacion || "Ubicación por confirmar"}
                  </div>
                </div>
              </div>

              <div style={infoRow}>
                <CalendarDays size={18} style={{ color: "#c5ffe8" }} />
                <div>
                  <div style={infoLabel}>Fecha</div>
                  <div style={infoValue}>
                    {fechaBonita} ({String(partido.fecha).split("T")[0]})
                  </div>
                </div>
              </div>

              <div style={infoRow}>
                <Clock size={18} style={{ color: "#ffd5ec" }} />
                <div>
                  <div style={infoLabel}>Horario</div>
                  <div style={infoValue}>
                    {partido.hora_inicio} – {partido.hora_fin}
                  </div>
                </div>
              </div>

              {partido.organizador_nombre && (
                <div style={infoRow}>
                  <Shield size={18} style={{ color: "#ffea9f" }} />
                  <div>
                    <div style={infoLabel}>Organizador</div>
                    <div style={infoValue}>
                      {partido.organizador_nombre}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div style={descriptionCard}>
              <div style={descriptionHeader}>
                <Info size={16} />
                <span>Descripción del partido</span>
              </div>
              <p style={descriptionText}>
                {partido.descripcion ||
                  "Partido amistoso para pasarlo bien, mover las piernas y después quizá una piscola deportiva. Nivel mixto, se respeta al que va a divertirse y al que va a darlo todo."}
              </p>
            </div>
          </div>

          {/* Derecha: tarjeta de inscripción */}
          <div style={rightCol}>
            <div style={ctaCard}>
              <div style={ctaHeader}>
                <h2 style={ctaTitle}>Inscribirme a este partido</h2>
                <span style={ctaChip}>Confirmación</span>
              </div>

              <p style={ctaIntroText}>
                Revísalo rápido y confirma si te sumas. Luego podrás coordinar
                con el organizador.
              </p>

              <div style={ctaStatsRow}>
                <div style={ctaStatBox}>
                  <span style={ctaStatLabel}>Vacantes totales</span>
                  <span style={ctaStatValue}>{vacantes || "?"}</span>
                </div>
                <div style={ctaStatBox}>
                  <span style={ctaStatLabel}>Confirmados</span>
                  <span style={ctaStatValue}>{confirmados}</span>
                </div>
                <div style={ctaStatBox}>
                  <span style={ctaStatLabel}>Cupos libres</span>
                  <span
                    style={{
                      ...ctaStatValue,
                      color:
                        disponibles <= 0
                          ? "#ffb3c7"
                          : disponibles === 1
                          ? "#fff3c4"
                          : "#b4ffe3",
                    }}
                  >
                    {disponibles}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={miniBulletRow}>
                  <span style={miniDot} />
                  <span style={miniText}>
                    Llega 10–15 min antes para armar los equipos y calentar.
                  </span>
                </div>
                <div style={miniBulletRow}>
                  <span style={miniDot} />
                  <span style={miniText}>
                    Lleva camiseta oscura o clara (el organizador avisará).
                  </span>
                </div>
                <div style={miniBulletRow}>
                  <span style={miniDot} />
                  <span style={miniText}>
                    Respeto máximo: cero mala leche, la idea es disfrutar.
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <button
                  style={{
                    ...primaryBtn,
                    opacity: disponibles <= 0 || inscrito ? 0.75 : 1,
                    cursor:
                      disponibles <= 0 || inscrito ? "not-allowed" : "pointer",
                  }}
                  disabled={disponibles <= 0 || inscrito}
                  onClick={handleInscribirme}
                >
                  {disponibles <= 0
                    ? "Partido completo"
                    : inscrito
                    ? "Ya estás inscrito ✅"
                    : "Inscribirme al partido 💥"}
                </button>
              </div>

              <p style={ctaFootnote}>
                Este botón ya llama a la API (<code>unirsePartido</code>). Si
                el backend acepta tu inscripción, el contador se actualiza.
              </p>

              {inscrito && (
                <div style={successBox}>
                  <CheckCircle2 size={18} style={{ marginRight: 8 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      ¡Inscripción confirmada! 🎉
                    </div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                      Ahora este partido debería aparecer en{" "}
                      <strong>“Mis partidos”</strong>.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={secondaryCard}>
              <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                <b>Tip TeamUp:</b> si tú publicas el partido, acá vas a poder
                editar cupos, borrar el partido o cerrarlo cuando se llene. Esta
                vista será la misma, pero con botones extra para organizadores.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* === estilos === */

// (todos los estilos que ya tenías, iguales)
const pageBg = {
  minHeight: "100vh",
  padding: "80px 16px 32px",
  backgroundImage:
    'linear-gradient(120deg, rgba(0,0,0,.96), rgba(10,0,25,.94), rgba(60,0,80,.9)), url("https://static.independentespanol.com/2024/02/22/04/MLS-RESUMEN_56820.jpg")',
  backgroundSize: "cover",
  backgroundPosition: "center 20%",
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  fontFamily: "'Poppins', sans-serif",
};

const overlay = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at top, rgba(255,105,180,.14), transparent 55%)",
  zIndex: 0,
};

const simpleOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,.7)",
  zIndex: 0,
};

const shellCard = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: 1120,
  background: "rgba(0,0,0,.9)",
  borderRadius: 24,
  padding: 22,
  border: "1px solid rgba(255,105,180,.55)",
  boxShadow: "0 24px 70px rgba(0,0,0,.9)",
  backdropFilter: "blur(10px)",
};

const headerRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 16,
};

const titleText = {
  margin: 0,
  fontSize: "1.7rem",
  color: "#ff79c4",
  textShadow: "0 0 18px rgba(255,105,180,.9)",
};

const smallLabel = {
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "rgba(255,192,222,.9)",
};

const backBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.7)",
  background:
    "radial-gradient(circle at top left, rgba(255,105,180,.24), rgba(0,0,0,.95))",
  color: "#ffe6f3",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
};

const homeBtn = {
  position: "fixed",
  top: 18,
  left: 18,
  zIndex: 2,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.7)",
  background: "rgba(0,0,0,.9)",
  color: "#ffb3e1",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
};

const contentGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1.4fr)",
  gap: 20,
  alignItems: "flex-start",
};

const leftCol = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const rightCol = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const photoCard = {
  position: "relative",
  borderRadius: 18,
  overflow: "hidden",
  height: 220,
  boxShadow: "0 18px 40px rgba(0,0,0,.9)",
};

const photoGradient = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(0,0,0,.9), rgba(0,0,0,.2), rgba(0,0,0,0))",
};

const photoBadgeTopLeft = {
  position: "absolute",
  top: 10,
  left: 12,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(0,0,0,.85)",
  color: "#ffe6f3",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const photoBadgeBottomRight = {
  position: "absolute",
  bottom: 12,
  right: 12,
  padding: "5px 11px",
  borderRadius: 999,
  background:
    "linear-gradient(135deg, rgba(109,255,191,.95), rgba(201,255,230,.95))",
  color: "#02150b",
  fontSize: "0.8rem",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const photoChipEstado = {
  position: "absolute",
  bottom: 12,
  left: 12,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,240,180,.9)",
  background: "rgba(0,0,0,.85)",
  fontSize: "0.75rem",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const infoCard = {
  borderRadius: 18,
  padding: 12,
  background:
    "linear-gradient(145deg, rgba(15,0,25,.96), rgba(5,0,10,.98))",
  border: "1px solid rgba(255,105,180,.3)",
  color: "#ffe6f3",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontSize: "0.9rem",
};

const infoRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
};

const infoLabel = {
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "rgba(255,192,222,.9)",
};

const infoValue = {
  fontSize: "0.9rem",
  color: "#ffeef7",
};

const descriptionCard = {
  borderRadius: 16,
  padding: 12,
  background:
    "linear-gradient(145deg, rgba(4,15,10,.98), rgba(7,0,15,.98))",
  border: "1px solid rgba(150,255,210,.55)",
  color: "#e4fdf4",
  fontSize: "0.88rem",
};

const descriptionHeader = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#b4ffe3",
  marginBottom: 4,
};

const descriptionText = {
  margin: 0,
  fontSize: "0.88rem",
  lineHeight: 1.4,
};

const ctaCard = {
  borderRadius: 20,
  padding: 16,
  background:
    "linear-gradient(145deg, rgba(18,0,26,.98), rgba(0,0,0,.98))",
  border: "1px solid rgba(255,105,180,.4)",
  color: "#ffe6f3",
};

const ctaHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const ctaTitle = {
  margin: 0,
  fontSize: "1.1rem",
  color: "#ffb3e1",
};

const ctaChip = {
  padding: "3px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.8)",
  background: "rgba(255,105,180,.15)",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#ffd5ec",
};

const ctaIntroText = {
  marginTop: 6,
  fontSize: "0.88rem",
  opacity: 0.95,
};

const ctaStatsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
  gap: 8,
  marginTop: 10,
};

const ctaStatBox = {
  borderRadius: 12,
  padding: 8,
  background: "rgba(0,0,0,.8)",
  border: "1px solid rgba(255,255,255,.08)",
  textAlign: "center",
};

const ctaStatLabel = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "rgba(255,220,244,.86)",
};

const ctaStatValue = {
  display: "block",
  marginTop: 4,
  fontSize: "1rem",
  fontWeight: 700,
  color: "#b4ffe3",
};

const miniBulletRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  marginTop: 4,
};

const miniDot = {
  width: 6,
  height: 6,
  borderRadius: 999,
  marginTop: 5,
  background:
    "conic-gradient(from 120deg, #ff61b6, #ffb3e1, #6dffbf, #ff61b6)",
};

const miniText = {
  fontSize: "0.8rem",
  color: "#ffe6f3",
  opacity: 0.92,
};

const primaryBtn = {
  width: "100%",
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

const ctaFootnote = {
  marginTop: 8,
  fontSize: "0.78rem",
  color: "rgba(210,255,238,.9)",
  fontStyle: "italic",
};

const successBox = {
  marginTop: 10,
  padding: 8,
  borderRadius: 12,
  background: "rgba(96,255,190,.08)",
  border: "1px solid rgba(150,255,210,.85)",
  display: "flex",
  alignItems: "flex-start",
  color: "#e4fdf4",
};

const secondaryCard = {
  borderRadius: 14,
  padding: 10,
  background: "rgba(10,10,20,.96)",
  border: "1px dashed rgba(255,105,180,.5)",
  color: "#ffe6f3",
};

const fallbackCard = {
  position: "relative",
  zIndex: 1,
  maxWidth: 480,
  margin: "120px auto 0",
  padding: 20,
  borderRadius: 18,
  background: "rgba(0,0,0,.9)",
  border: "1px solid rgba(255,105,180,.6)",
  textAlign: "center",
  color: "#ffe6f3",
};

const fallbackText = {
  fontSize: "0.9rem",
  marginBottom: 14,
};
