// src/pages/PublicarCancha.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, DollarSign, CalendarDays, Home } from "lucide-react";
import { apiGet, apiPost } from "../api";
import { useNavigate } from "react-router-dom";

// Formateador CLP para mostrar precios igual que en ReservarCancha
const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function HoraSelect({ valor, onChange, abierto, onToggle, opciones }) {
  const boxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        if (abierto) onToggle();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [abierto, onToggle]);

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div
        onClick={onToggle}
        style={{
          ...selectWheel,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {valor}
      </div>
      {abierto && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            top: 42,
            width: "100%",
            maxHeight: 160,
            overflowY: "auto",
            backgroundColor: "#000",
            border: "1px solid #ff69b4",
            borderRadius: 8,
            zIndex: 999,
          }}
        >
          {opciones.map((h) => (
            <motion.div
              key={h}
              onClick={() => {
                onChange(h);
                onToggle();
              }}
              whileHover={{ backgroundColor: "#ff69b4", color: "#000" }}
              animate={{
                backgroundColor: valor === h ? "#ff69b4" : "#000",
                color: valor === h ? "#000" : "#fff",
              }}
              transition={{ duration: 0.15 }}
              style={{
                padding: 8,
                cursor: "pointer",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              {h}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function PublicarCancha() {
  const navigate = useNavigate();

  const [cancha, setCancha] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    precio: "",
    disponibilidad: {
      L: { habilitado: false, inicio: "08:00", fin: "22:00" },
      M: { habilitado: false, inicio: "08:00", fin: "22:00" },
      X: { habilitado: false, inicio: "08:00", fin: "22:00" },
      J: { habilitado: false, inicio: "08:00", fin: "22:00" },
      V: { habilitado: false, inicio: "08:00", fin: "22:00" },
      S: { habilitado: false, inicio: "08:00", fin: "22:00" },
      D: { habilitado: false, inicio: "08:00", fin: "22:00" },
    },
  });

  const [canchas, setCanchas] = useState([]);
  const [selectAbierto, setSelectAbierto] = useState(null);

  const dias = [
    { key: "L", label: "L" },
    { key: "M", label: "M" },
    { key: "X", label: "X" },
    { key: "J", label: "J" },
    { key: "V", label: "V" },
    { key: "S", label: "S" },
    { key: "D", label: "D" },
  ];
  const horas = Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, "0")}:00`
  );

  // Cargar SOLO mis canchas (con disponibilidad desde BD)
  useEffect(() => {
    (async () => {
      try {
        const lista = await apiGet("/api/canchas/mis", true);
        setCanchas(lista);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCancha((prev) => ({ ...prev, [name]: value }));
  };

  const handleDisponibilidadChange = (dia, campo, valor) => {
    setCancha((prev) => ({
      ...prev,
      disponibilidad: {
        ...prev.disponibilidad,
        [dia]: { ...prev.disponibilidad[dia], [campo]: valor },
      },
    }));
  };

  const toggleDia = (dia) => {
    setCancha((prev) => ({
      ...prev,
      disponibilidad: {
        ...prev.disponibilidad,
        [dia]: {
          ...prev.disponibilidad[dia],
          habilitado: !prev.disponibilidad[dia].habilitado,
        },
      },
    }));
  };

  const handlePublicar = async () => {
    try {
      const precioNum = Number(cancha.precio);
      if (!cancha.nombre || !precioNum) {
        alert("Faltan nombre o precio");
        return;
      }

      const creada = await apiPost(
        "/api/canchas",
        {
          nombre: cancha.nombre,
          ubicacion: cancha.direccion || null,
          tipo: "futbol7",
          precio_base: precioNum,
          foto: null,
          disponibilidad: cancha.disponibilidad,
        },
        true
      );

      setCanchas((prev) => [creada, ...prev]);

      setCancha({
        nombre: "",
        direccion: "",
        telefono: "",
        precio: "",
        disponibilidad: {
          L: { habilitado: false, inicio: "08:00", fin: "22:00" },
          M: { habilitado: false, inicio: "08:00", fin: "22:00" },
          X: { habilitado: false, inicio: "08:00", fin: "22:00" },
          J: { habilitado: false, inicio: "08:00", fin: "22:00" },
          V: { habilitado: false, inicio: "08:00", fin: "22:00" },
          S: { habilitado: false, inicio: "08:00", fin: "22:00" },
          D: { habilitado: false, inicio: "08:00", fin: "22:00" },
        },
      });
      alert("Cancha publicada ✅");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={pageWrapper}>
      {/* overlay degradado como en ReservarCancha */}
      <div style={bgOverlay} />

      {/* Botón Inicio flotante */}
      <button
        type="button"
        onClick={() => navigate("/")}
        style={homeBtn}
        aria-label="Ir a inicio"
        title="Inicio"
      >
        <Home size={18} />
        <span>Inicio</span>
      </button>

      <main style={mainWrapper}>
        <div style={layout}>
          {/* HERO SUPERIOR TIPO MODO DUEÑO */}
          <header style={pageHeader}>
            <div style={heroBadgeRow}>
              <span style={heroDot} />
              <span style={heroBadgeText}>Modo dueño</span>
            </div>

            <h1 style={heroTitle}>
              Publica tu cancha,
              <br />
              llena tu calendario de partidos
            </h1>

            <p style={heroSubtitle}>
              Sube tu cancha, define tus horarios y deja que los equipos la
              reserven desde cualquier parte. Todo con el mismo estilo rosa
              futbolero de TeamUp.
            </p>

            <div style={heroPillsRow}>
              <span style={heroPill}>Administra horarios por día</span>
              <span style={heroPill}>Precio por hora en CLP</span>
              <span style={heroPill}>Panel de tus canchas</span>
            </div>
          </header>

          {/* DOS COLUMNAS: FORM + MIS CANCHAS */}
          <div style={columnsRow}>
            {/* FORMULARIO PUBLICAR */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={formCard}
            >
              <h2 style={formTitle}>Publicar nueva cancha</h2>
              <p style={formSubtitle}>
                Completa los datos básicos, marca los días y horarios
                disponibles y publica tu cancha para que los equipos la puedan
                reservar.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <input
                  type="text"
                  placeholder="Nombre de la cancha"
                  name="nombre"
                  value={cancha.nombre}
                  onChange={handleChange}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Dirección / sector"
                  name="direccion"
                  value={cancha.direccion}
                  onChange={handleChange}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Teléfono de contacto (opcional)"
                  name="telefono"
                  value={cancha.telefono}
                  onChange={handleChange}
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Precio por hora (CLP)"
                  name="precio"
                  value={cancha.precio}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <h3 style={disponibilidadTitle}>Disponibilidad semanal</h3>
              <p style={disponibilidadSubtitle}>
                Activa los días y elige rango de inicio y término para cada uno.
              </p>

              <div style={diasRow}>
                {dias.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDia(d.key)}
                    style={{
                      ...diaChip,
                      backgroundColor: cancha.disponibilidad[d.key].habilitado
                        ? "#ff69b4"
                        : "rgba(0,0,0,0.9)",
                      color: cancha.disponibilidad[d.key].habilitado
                        ? "#000"
                        : "#ffe6f3",
                      boxShadow: cancha.disponibilidad[d.key].habilitado
                        ? "0 0 15px rgba(255,105,180,0.8)"
                        : "none",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                {Object.entries(cancha.disponibilidad).map(([dia, data]) =>
                  data.habilitado ? (
                    <motion.div
                      key={dia}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      style={filaDia}
                    >
                      <span style={filaDiaLabel}>{dia}</span>
                      <div style={filaDiaHoras}>
                        <HoraSelect
                          valor={data.inicio}
                          onChange={(val) =>
                            handleDisponibilidadChange(dia, "inicio", val)
                          }
                          abierto={selectAbierto === `${dia}-inicio`}
                          onToggle={() =>
                            setSelectAbierto(
                              selectAbierto === `${dia}-inicio`
                                ? null
                                : `${dia}-inicio`
                            )
                          }
                          opciones={horas}
                        />
                        <span style={{ color: "#888", fontSize: 13 }}>a</span>
                        <HoraSelect
                          valor={data.fin}
                          onChange={(val) =>
                            handleDisponibilidadChange(dia, "fin", val)
                          }
                          abierto={selectAbierto === `${dia}-fin`}
                          onToggle={() =>
                            setSelectAbierto(
                              selectAbierto === `${dia}-fin`
                                ? null
                                : `${dia}-fin`
                            )
                          }
                          opciones={horas}
                        />
                      </div>
                    </motion.div>
                  ) : null
                )}
              </div>

              <button type="button" onClick={handlePublicar} style={botonPublicar}>
                Publicar cancha
              </button>
            </motion.div>

            {/* LISTA DE MIS CANCHAS */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={misCanchasPanel}
            >
              <div style={misCanchasHeaderRow}>
                <div>
                  <h2 style={misCanchasTitle}>Mis canchas publicadas</h2>
                  <p style={misCanchasSubtitle}>
                    {canchas.length === 0
                      ? "Aún no has publicado ninguna cancha."
                      : `Tienes ${canchas.length} cancha${
                          canchas.length === 1 ? "" : "s"
                        } activas.`}
                  </p>
                </div>
              </div>

              {canchas.length === 0 ? (
                <p style={{ textAlign: "center", color: "#bbb", marginTop: 20 }}>
                  Publica tu primera cancha y comenzará a aparecer acá ⚽
                </p>
              ) : (
                <div style={misCanchasGrid}>
                  {canchas.map((c, i) => (
                    <motion.article
                      key={i}
                      whileHover={{ scale: 1.03, translateY: -2 }}
                      transition={{ duration: 0.2 }}
                      onClick={() =>
                        navigate(`/mis-canchas/${c.id}`, { state: { cancha: c } })
                      }
                      style={misCanchaCard}
                    >
                      <div style={misCanchaHeader}>
                        <h3 style={misCanchaName}>{c.nombre}</h3>
                        <span style={misCanchaId}>ID {c.id}</span>
                      </div>

                      <p style={misCanchaLine}>
                        <MapPin size={16} color="#ff69b4" />{" "}
                        {c.ubicacion || "-"}
                      </p>

                      {c.telefono ? (
                        <p style={misCanchaLine}>
                          <Phone size={16} color="#ff69b4" /> {c.telefono}
                        </p>
                      ) : null}

                      <p style={misCanchaLine}>
                        <DollarSign size={16} color="#ff69b4" />{" "}
                        {typeof c.precio_base === "number"
                          ? `${CLP.format(c.precio_base)} / hora`
                          : "-"}
                      </p>

                      <div style={{ marginTop: 8 }}>
                        <p style={misCanchaHorarioLabel}>
                          <CalendarDays size={16} color="#ff69b4" /> Horario
                          disponible
                        </p>

                        {c.disponibilidad &&
                        Object.values(c.disponibilidad).some(
                          (d) => d && d.habilitado
                        ) ? (
                          <div style={misCanchaHorarioGrid}>
                            {Object.entries(c.disponibilidad)
                              .filter(([, d]) => d && d.habilitado)
                              .map(([dia, d]) => (
                                <div key={dia} style={misCanchaHorarioChip}>
                                  <strong
                                    style={{
                                      color: "#ffb3e1",
                                      marginRight: 2,
                                    }}
                                  >
                                    {dia}:
                                  </strong>
                                  {d.inicio} – {d.fin}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p style={misCanchaSinHorario}>
                            Sin horario cargado
                          </p>
                        )}
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ===== Estilos ===== */

/* Fondo + overlay, mismo estilo que ReservarCancha */
const pageWrapper = {
  position: "relative",
  minHeight: "100vh",
  overflow: "hidden",
  backgroundImage:
    'url("https://e00-xlk-ue-marca.uecdn.es/uploads/2025/03/30/67e8ec71c293f.jpeg")',
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

const bgOverlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(120deg, rgba(0,0,0,0.96), rgba(10,0,20,0.94), rgba(60,0,80,0.9))",
  zIndex: 1,
};

const mainWrapper = {
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  position: "relative",
  zIndex: 2,
};

const layout = {
  width: "100%",
  maxWidth: 1200,
  margin: "0 auto",
  padding: "40px 20px 32px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

/* Botón Inicio igual al de ReservarCancha */
const homeBtn = {
  position: "absolute",
  top: 18,
  left: 18,
  cursor: "pointer",
  color: "#ffb3e1",
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
};

const pageHeader = {
  color: "#ffe6f3",
  maxWidth: 720,
};

const heroBadgeRow = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 14px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.85)",
  border: "1px solid rgba(255,105,180,0.7)",
  fontSize: "0.75rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  marginBottom: 14,
};

const heroDot = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#32ffb5",
  boxShadow: "0 0 10px rgba(50,255,181,0.9)",
};

const heroBadgeText = {
  color: "#ffd1e8",
};

const heroTitle = {
  margin: 0,
  fontSize: "2.5rem",
  lineHeight: 1.1,
  fontWeight: 900,
  backgroundImage:
    "linear-gradient(120deg,#ffffff,#ffb3e1,#ff69b4,#ffd1e8)",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const heroSubtitle = {
  marginTop: 12,
  marginBottom: 12,
  fontSize: "0.95rem",
  maxWidth: 560,
  color: "#ffe6f3",
  opacity: 0.92,
};

const heroPillsRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 4,
};

const heroPill = {
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,0.7)",
  background: "rgba(0,0,0,0.9)",
  fontSize: "0.8rem",
  color: "#ffd1e8",
  fontWeight: 600,
};

const columnsRow = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 460px) 1fr",
  gap: 24,
  alignItems: "start",
};

/* Tarjeta formulario */
const formCard = {
  background: "#000000",
  padding: 24,
  borderRadius: 22,
  border: "2px solid #ff69b4",
  boxShadow: "0 0 25px rgba(255,105,180,0.4)",
  minHeight: 560,
};

const formTitle = {
  color: "#ff79c4",
  fontSize: "1.4rem",
  fontWeight: 800,
  margin: 0,
};

const formSubtitle = {
  color: "#ffe6f3",
  fontSize: "0.85rem",
  marginTop: 6,
  marginBottom: 12,
  opacity: 0.9,
};

const disponibilidadTitle = {
  color: "#ff66b2",
  marginTop: 18,
  marginBottom: 2,
  fontSize: "0.95rem",
};

const disponibilidadSubtitle = {
  color: "#ffe6f3",
  fontSize: "0.8rem",
  opacity: 0.8,
  marginBottom: 8,
};

const diasRow = {
  display: "flex",
  justifyContent: "space-between",
  margin: "10px 0 14px",
};

const diaChip = {
  borderRadius: 999,
  width: 40,
  height: 40,
  border: "1px solid #ff69b4",
  fontWeight: "bold",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "0.2s",
};

const filaDia = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#111",
  padding: "8px 12px",
  borderRadius: 10,
  marginBottom: 8,
  fontSize: 13,
  border: "1px solid rgba(255,105,180,0.2)",
};

const filaDiaLabel = {
  color: "#ffb3e1",
  width: 32,
  fontWeight: 700,
  textAlign: "center",
};

const filaDiaHoras = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

/* Inputs */
const inputStyle = {
  padding: 10,
  borderRadius: 12,
  border: "2px solid #ff69b4",
  backgroundColor: "#000000",
  color: "#fff",
  outline: "none",
  fontSize: 14,
  boxShadow: "0 0 12px rgba(255,105,180,0.25)",
};

/* Select estilo rueda simple */
const selectWheel = {
  backgroundColor: "#000",
  color: "#fff",
  border: "2px solid #ff69b4",
  borderRadius: 14,
  padding: "5px 6px",
  fontSize: 13,
  width: 80,
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "0 0 12px rgba(255,105,180,0.3)",
};

const botonPublicar = {
  marginTop: 18,
  width: "100%",
  padding: 12,
  background:
    "linear-gradient(90deg, rgba(255,105,180,1), rgba(255,20,147,1))",
  border: "none",
  borderRadius: 16,
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: 16,
  boxShadow: "0 0 20px rgba(255,105,180,0.7)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

/* Panel Mis canchas */
const misCanchasPanel = {
  background:
    "linear-gradient(145deg, rgba(10,0,20,0.96), rgba(0,0,0,0.98))",
  padding: 22,
  borderRadius: 24,
  boxShadow: "0 25px 60px rgba(0,0,0,0.9)",
  border: "1px solid rgba(255,105,180,0.4)",
  minHeight: 350,
  maxHeight: "85vh",
  overflowY: "auto",
  color: "#fff",
};

const misCanchasHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 12,
};

const misCanchasTitle = {
  color: "#ff79c4",
  textAlign: "left",
  margin: 0,
  fontSize: "1.2rem",
  fontWeight: 800,
};

const misCanchasSubtitle = {
  color: "#ffe6f3",
  fontSize: "0.8rem",
  marginTop: 4,
  opacity: 0.85,
};

const misCanchasGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 15,
  marginTop: 10,
};

const misCanchaCard = {
  backgroundColor: "#050308",
  padding: 16,
  borderRadius: 16,
  boxShadow: "0 0 18px rgba(255,105,180,0.15)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  cursor: "pointer",
  border: "1px solid rgba(255,105,180,0.35)",
};

const misCanchaHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 4,
};

const misCanchaName = {
  color: "#fff",
  fontSize: 17,
  fontWeight: 700,
  margin: 0,
};

const misCanchaId = {
  fontSize: 11,
  color: "#ffd1e8",
};

const misCanchaLine = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#fff",
  fontSize: 13,
  margin: "2px 0",
};

const misCanchaHorarioLabel = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#fff",
  fontSize: 13,
  marginBottom: 4,
};

const misCanchaHorarioGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  fontSize: 12,
};

const misCanchaHorarioChip = {
  backgroundColor: "#151120",
  color: "#fff",
  padding: "4px 8px",
  borderRadius: 8,
  border: "1px solid rgba(255,105,180,0.4)",
};

const misCanchaSinHorario = {
  color: "#bbb",
  fontSize: 12,
};
