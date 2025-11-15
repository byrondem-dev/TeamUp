// src/pages/PublicarCancha.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, DollarSign, CalendarDays, Home } from "lucide-react";
import { apiGet, apiPost } from "../api";
import { useNavigate } from "react-router-dom";

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
            border: "1px solid #ff1493",
            borderRadius: 6,
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
              whileHover={{ backgroundColor: "#ff1493", color: "#000" }}
              animate={{
                backgroundColor: valor === h ? "#ff1493" : "#000",
                color: valor === h ? "#000" : "#fff",
              }}
              transition={{ duration: 0.15 }}
              style={{ padding: 8, cursor: "pointer", fontSize: 13 }}
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
          disponibilidad: cancha.disponibilidad, // <-- se guarda en BD
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
      {/* overlay degradado como en BuscarPartido / ReservarCancha */}
      <div style={bgOverlay} />

      {/* Botón Inicio por encima del overlay */}
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
          {/* FORMULARIO PUBLICAR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: "#1a1a1a",
              padding: 24,
              borderRadius: 14,
              boxShadow: "0 0 15px rgba(255, 20, 147, 0.25)",
              minHeight: 600,
            }}
          >
            <h2
              style={{
                color: "#ff1493",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Publicar cancha
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                placeholder="Dirección"
                name="direccion"
                value={cancha.direccion}
                onChange={handleChange}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Teléfono"
                name="telefono"
                value={cancha.telefono}
                onChange={handleChange}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Precio por hora"
                name="precio"
                value={cancha.precio}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <h3 style={{ color: "#ff66b2", marginTop: 20 }}>Disponibilidad</h3>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "10px 0 20px",
              }}
            >
              {dias.map((d) => (
                <button
                  key={d.key}
                  onClick={() => toggleDia(d.key)}
                  style={{
                    backgroundColor: cancha.disponibilidad[d.key].habilitado
                      ? "#ff1493"
                      : "#333",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 42,
                    height: 42,
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "0.2s",
                    fontSize: 15,
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {Object.entries(cancha.disponibilidad).map(([dia, data]) =>
              data.habilitado ? (
                <motion.div
                  key={dia}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#111",
                    padding: "8px 12px",
                    borderRadius: 6,
                    marginBottom: 8,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#ff66b2", width: 40 }}>{dia}</span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
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
                    <span style={{ color: "#888" }}>a</span>
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

            <button onClick={handlePublicar} style={botonPublicar}>
              Publicar cancha
            </button>
          </motion.div>

          {/* LISTA DE MIS CANCHAS */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: "#1a1a1a",
              padding: 24,
              borderRadius: 14,
              boxShadow: "0 0 18px rgba(255, 20, 147, 0.15)",
              minHeight: 350,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <h2
              style={{
                color: "#ff1493",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Mis canchas
            </h2>

            {canchas.length === 0 ? (
              <p style={{ textAlign: "center", color: "#bbb" }}>
                Aún no has publicado canchas.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 15,
                }}
              >
                {canchas.map((c, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                    onClick={() =>
                      navigate(`/mis-canchas/${c.id}`, { state: { cancha: c } })
                    }
                    style={{
                      backgroundColor: "#111",
                      padding: 18,
                      borderRadius: 10,
                      boxShadow: "0 0 12px rgba(255, 20, 147, 0.15)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <h3
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: 600,
                      }}
                    >
                      {c.nombre}
                    </h3>

                    <p
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#fff",
                      }}
                    >
                      <MapPin size={16} color="#ff1493" />{" "}
                      {c.ubicacion || "-"}
                    </p>

                    {c.telefono ? (
                      <p
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#fff",
                        }}
                      >
                        <Phone size={16} color="#ff1493" /> {c.telefono}
                      </p>
                    ) : null}

                    <p
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#fff",
                      }}
                    >
                      <DollarSign size={16} color="#ff1493" />{" "}
                      {typeof c.precio_base === "number"
                        ? `$${c.precio_base}`
                        : "-"}{" "}
                      / hora
                    </p>

                    <div style={{ marginTop: 6 }}>
                      <p
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#fff",
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        <CalendarDays size={16} color="#ff1493" /> Horario
                        disponible
                      </p>

                      {c.disponibilidad &&
                      Object.values(c.disponibilidad).some(
                        (d) => d?.habilitado
                      ) ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            fontSize: 12,
                          }}
                        >
                          {Object.entries(c.disponibilidad)
                            .filter(([_, d]) => d?.habilitado)
                            .map(([dia, d]) => (
                              <div
                                key={dia}
                                style={{
                                  backgroundColor: "#222",
                                  color: "#fff",
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                }}
                              >
                                <strong style={{ color: "#ff66b2" }}>
                                  {dia}:
                                </strong>{" "}
                                {d.inicio} - {d.fin}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p style={{ color: "#bbb", fontSize: 12 }}>
                          Sin horario cargado
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

const inputStyle = {
  padding: 10,
  borderRadius: 6,
  border: "none",
  backgroundColor: "#111",
  color: "#fff",
  outline: "none",
};

const selectWheel = {
  backgroundColor: "#000",
  color: "#fff",
  border: "1px solid #ff1493",
  borderRadius: 6,
  padding: "5px 6px",
  fontSize: 13,
  width: 80,
  cursor: "pointer",
  textAlign: "center",
};

const botonPublicar = {
  marginTop: 20,
  width: "100%",
  padding: 12,
  backgroundColor: "#ff1493",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: 16,
  transition: "0.25s",
};

/* FONDO + OVERLAY (igual estilo que ReservarCancha / BuscarPartido) */
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
  padding: "40px 20px",
  display: "grid",
  gridTemplateColumns: "minmax(320px, 480px) 1fr",
  gap: 24,
  alignItems: "start",
};

/* Botón Inicio igual al de MisPartidos / ReservarCancha */
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
