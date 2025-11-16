// src/pages/Perfil.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import Api from "../api"; // 👈 usamos el backend
import { Home } from "lucide-react"; // 👈 para el ícono del botón Inicio

// ===== Datos base (fuera del componente) =====
const dias = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const diasCortos = {
  Lunes: "Lun",
  Martes: "Mar",
  Miércoles: "Mié",
  Jueves: "Jue",
  Viernes: "Vie",
  Sábado: "Sáb",
  Domingo: "Dom",
};

const horas = [
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

// 👇 Mismo estilo de botón Inicio que en PublicarCancha
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

// Crea toda la matriz de disponibilidad en false
function createInitialDisponibilidad() {
  const disp = {};
  dias.forEach((d) => {
    disp[d] = {};
    horas.forEach((h) => {
      disp[d][h] = false;
    });
  });
  return disp;
}

// ✅ Normaliza un objeto de disponibilidad (o string JSON) a la matriz completa
function normalizeDisponibilidad(dispRaw) {
  let disp = dispRaw;

  // Si viene como string desde la BD, lo parseamos
  if (typeof dispRaw === "string") {
    try {
      disp = JSON.parse(dispRaw);
    } catch {
      disp = null;
    }
  }

  const base = createInitialDisponibilidad();

  if (disp && typeof disp === "object") {
    dias.forEach((d) => {
      if (disp[d] && typeof disp[d] === "object") {
        horas.forEach((h) => {
          if (typeof disp[d][h] === "boolean") {
            base[d][h] = disp[d][h];
          }
        });
      }
    });
  }

  return base;
}

// 🎨 Tema de colores por POSICIÓN (círculo + recuadro + icono)
const POSITION_THEME = {
  PT: {
    circleBg: "linear-gradient(180deg,#fef9c3,#facc15)", // amarillo
    glow: "rgba(250,204,21,0.9)",
    tooltipBg: "linear-gradient(90deg,#facc15,#f97316)",
    icon: "🧤",
  },
  LI: {
    circleBg: "linear-gradient(180deg,#cffafe,#22d3ee)", // lateral izq celeste
    glow: "rgba(34,211,238,0.9)",
    tooltipBg: "linear-gradient(90deg,#22d3ee,#0ea5e9)",
    icon: "🛡️",
  },
  DFI: {
    circleBg: "linear-gradient(180deg,#bfdbfe,#3b82f6)", // central izq azul
    glow: "rgba(59,130,246,0.9)",
    tooltipBg: "linear-gradient(90deg,#60a5fa,#3b82f6)",
    icon: "🛡️",
  },
  DFD: {
    circleBg: "linear-gradient(180deg,#bfdbfe,#3b82f6)", // central der azul
    glow: "rgba(59,130,246,0.9)",
    tooltipBg: "linear-gradient(90deg,#60a5fa,#3b82f6)",
    icon: "🛡️",
  },
  LD: {
    circleBg: "linear-gradient(180deg,#cffafe,#22d3ee)", // lateral der celeste
    glow: "rgba(34,211,238,0.9)",
    tooltipBg: "linear-gradient(90deg,#22d3ee,#0ea5e9)",
    icon: "🛡️",
  },
  MCD: {
    circleBg: "linear-gradient(180deg,#bbf7d0,#22c55e)", // el 5, verde
    glow: "rgba(34,197,94,0.9)",
    tooltipBg: "linear-gradient(90deg,#4ade80,#16a34a)",
    icon: "🛡️",
  },
  MC: {
    circleBg: "linear-gradient(180deg,#e0f2fe,#38bdf8)", // MC celeste
    glow: "rgba(56,189,248,0.9)",
    tooltipBg: "linear-gradient(90deg,#38bdf8,#0ea5e9)",
    icon: "🎯",
  },
  MCO: {
    circleBg: "linear-gradient(180deg,#ddd6fe,#8b5cf6)", // MCO violeta
    glow: "rgba(139,92,246,0.9)",
    tooltipBg: "linear-gradient(90deg,#a855f7,#7c3aed)",
    icon: "🎨",
  },
  EI: {
    circleBg: "linear-gradient(180deg,#f9a8d4,#ec4899)", // extremo izq rosa
    glow: "rgba(236,72,153,0.9)",
    tooltipBg: "linear-gradient(90deg,#fb7185,#ec4899)",
    icon: "⚡",
  },
  ED: {
    circleBg: "linear-gradient(180deg,#f9a8d4,#ec4899)", // extremo der rosa
    glow: "rgba(236,72,153,0.9)",
    tooltipBg: "linear-gradient(90deg,#fb7185,#ec4899)",
    icon: "⚡",
  },
  DC: {
    circleBg: "linear-gradient(180deg,#fecaca,#ef4444)", // el 9, rojo
    glow: "rgba(248,113,113,0.9)",
    tooltipBg: "linear-gradient(90deg,#fb7185,#ef4444)",
    icon: "🎯",
  },
};

const getPositionTheme = (id) =>
  POSITION_THEME[id] || {
    circleBg: "linear-gradient(180deg,#e5e7eb,#9ca3af)",
    glow: "rgba(148,163,184,0.9)",
    tooltipBg: "linear-gradient(90deg,#9ca3af,#6b7280)",
    icon: "⚽",
  };

// 🎨 Degradado según nivel (0 = apagado, 1 = domina, 2 = normal)
const getCircleBackground = (theme, level) => {
  if (level === 1) {
    // 1er click → domina la posición
    return `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.16), transparent),
            ${theme.circleBg}`;
  }

  if (level === 2) {
    // 2º click → la juega normal (más efecto)
    return `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent),
            radial-gradient(circle at 80% 80%, rgba(15,23,42,0.45), transparent),
            ${theme.circleBg}`;
  }

  // 0 → no la domina
  return "radial-gradient(circle at 30% 30%, #020617, #020617, #020617)";
};

// 11 posiciones en el campo (4-3-3 aprox)
const POSICIONES = [
  {
    id: "PT",
    label: "Portero",
    desc: "Último defensor, protege el arco.",
    group: "PT",
    coords: { top: "87%", left: "50%" },
  },
  {
    id: "LI",
    label: "Lateral Izquierdo",
    desc: "Defensa por banda izquierda, apoya en ataque.",
    group: "DF",
    coords: { top: "68%", left: "18%" },
  },
  {
    id: "DFI",
    label: "Defensa Central Izquierdo",
    desc: "Central que cubre el lado izquierdo del área.",
    group: "DF",
    coords: { top: "76%", left: "38%" },
  },
  {
    id: "DFD",
    label: "Defensa Central Derecho",
    desc: "Central que cubre el lado derecho del área.",
    group: "DF",
    coords: { top: "76%", left: "62%" },
  },
  {
    id: "LD",
    label: "Lateral Derecho",
    desc: "Defensa por banda derecha, apoya en ataque.",
    group: "DF",
    coords: { top: "68%", left: "82%" },
  },
  {
    id: "MCD",
    label: "Medio Centro Defensivo",
    desc: "Equilibra el equipo y ayuda en la salida.",
    group: "MC",
    coords: { top: "58%", left: "50%" },
  },
  {
    id: "MC",
    label: "Mediocentro",
    desc: "Conecta defensa y ataque, distribuye el juego.",
    group: "MC",
    coords: { top: "48%", left: "30%" },
  },
  {
    id: "MCO",
    label: "Mediapunta",
    desc: "Juega entre líneas y filtra pases de gol.",
    group: "MC",
    coords: { top: "48%", left: "70%" },
  },
  {
    id: "EI",
    label: "Extremo Izquierdo",
    desc: "Ataca por banda, busca encarar y centrar.",
    group: "DL",
    coords: { top: "26%", left: "22%" },
  },
  {
    id: "DC",
    label: "Delantero Centro",
    desc: "Referencia en el área, finaliza las jugadas.",
    group: "DL",
    coords: { top: "22%", left: "50%" },
  },
  {
    id: "ED",
    label: "Extremo Derecho",
    desc: "Ataca por banda derecha, genera peligro.",
    group: "DL",
    coords: { top: "26%", left: "78%" },
  },
];

export default function Perfil() {
  const navigate = useNavigate();

  // ===== Estado =====
  const [hoveredPos, setHoveredPos] = useState(null);
  const [selectedDia, setSelectedDia] = useState(dias[0]);
  const [footballProfile, setFootballProfile] = useState({
    imagen: null,
    nombre: "",
    edad: "",
    bio: "",
    posiciones: {},
    suscripcion: false,
    disponibilidad: createInitialDisponibilidad(), // 👈 matriz completa
    videos: [null, null, null],
  });

  // ===== Cargar / inicializar perfil (BACKEND + localStorage fallback) =====
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        // 1) Intentar cargar desde el backend
        const data = await Api.perfil(); // GET /api/perfil

        if (data) {
          const posiciones =
            data.posiciones && !Array.isArray(data.posiciones)
              ? data.posiciones
              : {};

          const disponibilidad = normalizeDisponibilidad(data.disponibilidad);

          let videos = Array.isArray(data.videos)
            ? data.videos
            : [null, null, null];
          if (videos.length < 3) {
            videos = [...videos, ...Array(3 - videos.length).fill(null)];
          }

          const perfilState = {
            imagen: data.imagen ?? null,
            nombre: data.nombre ?? "",
            edad: data.edad ?? "",
            bio: data.bio ?? "",
            posiciones,
            suscripcion: false,
            disponibilidad,
            videos,
          };

          setFootballProfile(perfilState);
          localStorage.setItem("miPerfilFutbol", JSON.stringify(perfilState));
          return;
        }
      } catch (err) {
        console.error("Error cargando perfil desde backend:", err);
      }

      // 2) Si falla o no hay perfil en backend, usamos localStorage
      try {
        const perfilGuardado = localStorage.getItem("miPerfilFutbol");
        if (perfilGuardado) {
          const perfil = JSON.parse(perfilGuardado);

          const posiciones =
            perfil.posiciones && !Array.isArray(perfil.posiciones)
              ? perfil.posiciones
              : {};

          const disponibilidad = normalizeDisponibilidad(perfil.disponibilidad);

          let videos = Array.isArray(perfil.videos)
            ? perfil.videos
            : [null, null, null];
          if (videos.length < 3) {
            videos = [...videos, ...Array(3 - videos.length).fill(null)];
          }

          setFootballProfile({
            imagen: perfil.imagen ?? null,
            nombre: perfil.nombre ?? "",
            edad: perfil.edad ?? "",
            bio: perfil.bio ?? "",
            posiciones,
            suscripcion: false,
            disponibilidad,
            videos,
          });
        } else {
          // 3) Ni backend ni localstorage → inicial limpio
          setFootballProfile((prev) => ({
            ...prev,
            disponibilidad: createInitialDisponibilidad(),
            videos: [null, null, null],
          }));
        }
      } catch (e) {
        console.error("Error leyendo localStorage de perfil:", e);
      }
    };

    cargarPerfil();
  }, []);

  // ===== Handlers =====
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setFootballProfile((prev) => ({ ...prev, imagen: reader.result }));
    reader.readAsDataURL(file);
  };

  const handlePositionClick = (id) => {
    setFootballProfile((prev) => {
      const currentLevel = prev.posiciones[id] || 0;
      // 0 → 1 → 2 → 0
      const nextLevel = (currentLevel + 1) % 3;

      const newPosiciones = { ...prev.posiciones };

      if (nextLevel === 0) {
        delete newPosiciones[id]; // 3er click → vuelve a "no la domina"
      } else {
        newPosiciones[id] = nextLevel; // 1 = domina, 2 = normal
      }

      return { ...prev, posiciones: newPosiciones };
    });
  };

  // ✅ Versión más robusta del toggle de disponibilidad
  const toggleDisponibilidad = (dia, hora) => {
    setFootballProfile((prev) => {
      // Siempre parto de una matriz completa y bien formada
      const nuevaDisp = normalizeDisponibilidad(prev.disponibilidad);

      const actual = !!nuevaDisp[dia]?.[hora];
      nuevaDisp[dia][hora] = !actual;

      return {
        ...prev,
        disponibilidad: nuevaDisp,
      };
    });
  };

  // 🔥 Guardar perfil en BACKEND + localStorage
  const guardarPerfil = async () => {
    try {
      const saved = await Api.guardarPerfil(footballProfile); // POST /api/perfil

      const posiciones =
        saved.posiciones && !Array.isArray(saved.posiciones)
          ? saved.posiciones
          : {};

      const disponibilidad = normalizeDisponibilidad(saved.disponibilidad);

      let videos = Array.isArray(saved.videos)
        ? saved.videos
        : [null, null, null];
      if (videos.length < 3) {
        videos = [...videos, ...Array(3 - videos.length).fill(null)];
      }

      const perfilState = {
        imagen: saved.imagen ?? null,
        nombre: saved.nombre ?? "",
        edad: saved.edad ?? "",
        bio: saved.bio ?? "",
        posiciones,
        suscripcion: footballProfile.suscripcion || false,
        disponibilidad,
        videos,
      };

      setFootballProfile((prev) => ({
        ...prev,
        ...perfilState,
      }));

      localStorage.setItem("miPerfilFutbol", JSON.stringify(perfilState));

      alert("Perfil guardado en la base de datos correctamente ❤️");
    } catch (err) {
      console.error("Error guardando perfil:", err);

      // Fallback: al menos queda en este navegador
      localStorage.setItem(
        "miPerfilFutbol",
        JSON.stringify(footballProfile)
      );
      alert(
        "No se pudo guardar en el servidor, pero tu perfil quedó guardado en este navegador ✅"
      );
    }
  };

  // === Horas activas para el día seleccionado (para el resumen de abajo) ===
  const daySlots = footballProfile.disponibilidad?.[selectedDia] || {};
  const horasActivas = horas.filter((h) => daySlots[h]);

  return (
    <div
      className="login-hero"
      style={{
        background:
          "url('https://elonce-media.elonce.com/fotos/2025/01/30/l_1738240613_73999.webp') no-repeat center center/cover",
        padding: "20px",
        fontFamily: "'Poppins', 'Inter', sans-serif",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <div className="login-overlay"></div>

      {/* Botón Inicio flotante (igual que en PublicarCancha) */}
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

      <div
        className="perfil-container animate-fadein"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1150px",
          margin: "40px auto 0",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* ===== Fila superior: Perfil + Horario ===== */}
        <div
          className="perfil-top"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {/* PANEL IZQUIERDO: TARJETA DEL JUGADOR */}
          <div
            className="perfil-info"
            style={{
              background:
                "radial-gradient(circle at top left, rgba(236,72,153,0.25), transparent) , rgba(15,23,42,0.92)",
              padding: "22px 20px 20px",
              borderRadius: "22px",
              boxShadow:
                "0 0 25px rgba(15,23,42,1), 0 0 30px rgba(236,72,153,0.4)",
              border: "1px solid rgba(248,113,113,0.25)",
            }}
          >
            {/* Foto + nombre/edad */}
            <div
              style={{
                display: "flex",
                gap: "18px",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "130px",
                  height: "130px",
                  flexShrink: 0,
                }}
              >
                <img
                  src={
                    footballProfile.imagen ||
                    "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                  }
                  alt="Perfil"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "26px",
                    objectFit: "cover",
                    border: "2px solid #f472b6",
                    boxShadow: "0 0 25px rgba(236,72,153,0.65)",
                  }}
                />
                <label
                  htmlFor="fileInput"
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    right: "6px",
                    background:
                      "linear-gradient(180deg,#ff69b4,#ff1493)",
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 0 12px rgba(236,72,153,0.8)",
                    border: "2px solid #0b1120",
                    fontSize: "0.95rem",
                  }}
                >
                  📷
                </label>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </div>

              {/* Nombre + edad + breve posición fija (texto) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={footballProfile.nombre}
                  onChange={(e) =>
                    setFootballProfile((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(248,113,113,0.4)",
                    background: "rgba(15,23,42,0.9)",
                    color: "#fff",
                    fontSize: "1.05rem",
                    fontWeight: 600,
                    boxSizing: "border-box",
                    marginBottom: "6px",
                  }}
                />

                <input
                  type="number"
                  placeholder="Edad"
                  value={footballProfile.edad}
                  onChange={(e) =>
                    setFootballProfile((prev) => ({
                      ...prev,
                      edad: e.target.value,
                    }))
                  }
                  style={{
                    width: "120px",
                    padding: "8px 10px",
                    borderRadius: "999px",
                    border: "1px solid rgba(248,113,113,0.4)",
                    background: "rgba(15,23,42,0.9)",
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />

                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "0.85rem",
                    color: "#f9a8d4",
                    fontWeight: 600,
                  }}
                >
                  Delantero / Mediocampista
                </div>
              </div>
            </div>

            {/* BIO */}
            <textarea
              placeholder="Describe tu estilo de juego..."
              value={footballProfile.bio}
              onChange={(e) =>
                setFootballProfile((prev) => ({
                  ...prev,
                  bio: e.target.value,
                }))
              }
              className="bio-input"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(248,113,113,0.4)",
                marginTop: "4px",
                background: "rgba(15,23,42,0.95)",
                color: "#f9fafb",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                minHeight: "90px",
                resize: "none",
                boxSizing: "border-box",
              }}
            />

            {/* Botones Guardar / Compartir */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              <button
                onClick={guardarPerfil}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(236,72,153,0.55)",
                  transition:
                    "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-1px) scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(236,72,153,0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(236,72,153,0.55)";
                }}
              >
                ❤ Guardar
              </button>
              <button
                onClick={() =>
                  alert(
                    "Pronto podrás compartir tu perfil con tus amigos 😄"
                  )
                }
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "999px",
                  border: "1px solid rgba(52,211,153,0.8)",
                  background: "rgba(15,118,110,0.25)",
                  color: "#a7f3d0",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 0 18px rgba(45,212,191,0.4)",
                  transition:
                    "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-1px) scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 0 24px rgba(45,212,191,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 0 18px rgba(45,212,191,0.4)";
                }}
              >
                ⤴ Compartir
              </button>
            </div>
          </div>

          {/* PANEL DERECHO: MI HORARIO */}
          <div
            style={{
              background:
                "radial-gradient(circle at top left, rgba(236,72,153,0.25), transparent), rgba(15,23,42,0.96)",
              borderRadius: "24px",
              border: "1px solid rgba(248,113,113,0.4)",
              boxShadow:
                "0 0 25px rgba(15,23,42,1), 0 0 35px rgba(236,72,153,0.4)",
              padding: "20px 22px 22px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Título */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle at top left, rgba(236,72,153,0.6), rgba(15,23,42,0.9))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "1.1rem",
                  boxShadow: "0 0 16px rgba(236,72,153,0.9)",
                }}
              >
                ⏱
              </div>
              <h2
                style={{
                  margin: 0,
                  color: "#f9fafb",
                  fontSize: "1.35rem",
                  letterSpacing: "0.4px",
                }}
              >
                Mi Horario
              </h2>
            </div>

            {/* Tabs de días */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "10px",
                marginBottom: "18px",
              }}
            >
              {dias.map((dia) => {
                const active = dia === selectedDia;
                return (
                  <button
                    key={dia}
                    onClick={() => setSelectedDia(dia)}
                    style={{
                      borderRadius: "999px",
                      padding: "10px 0",
                      border: active
                        ? "1px solid rgba(251,113,133,1)"
                        : "1px solid rgba(148,163,184,0.35)",
                      background: active
                        ? "linear-gradient(90deg,#fb7185,#ec4899,#8b5cf6)"
                        : "rgba(15,23,42,0.95)",
                      color: active ? "#fff" : "#e5e7eb",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      boxShadow: active
                        ? "0 0 22px rgba(236,72,153,0.9)"
                        : "0 0 10px rgba(15,23,42,0.9)",
                      transition:
                        "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.boxShadow =
                          "0 0 18px rgba(148,163,184,0.7)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = active
                        ? "0 0 22px rgba(236,72,153,0.9)"
                        : "0 0 10px rgba(15,23,42,0.9)";
                    }}
                  >
                    {diasCortos[dia]}
                  </button>
                );
              })}
            </div>

            {/* Grid de horas */}
            <div
              style={{
                flex: 1,
                borderRadius: "20px",
                background:
                  "radial-gradient(circle at top left, rgba(15,23,42,0.9), rgba(15,23,42,0.98))",
                padding: "16px 14px 14px",
                border: "1px solid rgba(30,64,175,0.7)",
                boxShadow: "0 0 20px rgba(15,23,42,1)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(80px, 1fr))",
                  gap: "10px",
                }}
              >
                {horas.map((hora) => {
                  const activa =
                    footballProfile.disponibilidad?.[selectedDia]?.[hora];
                  return (
                    <button
                      key={hora}
                      onClick={() => toggleDisponibilidad(selectedDia, hora)}
                      style={{
                        height: "64px",
                        borderRadius: "18px",
                        border: activa
                          ? "2px solid rgba(251,113,133,1)"
                          : "1px solid rgba(148,163,184,0.35)",
                        background: activa
                          ? "radial-gradient(circle at top left, rgba(251,113,133,0.2), rgba(15,23,42,0.98))"
                          : "rgba(15,23,42,0.98)",
                        color: "#e5e7eb",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        boxShadow: activa
                          ? "0 0 22px rgba(236,72,153,0.85)"
                          : "0 0 12px rgba(15,23,42,0.9)",
                        transition:
                          "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(-2px)";
                        e.currentTarget.style.boxShadow = activa
                          ? "0 0 26px rgba(236,72,153,1)"
                          : "0 0 18px rgba(148,163,184,0.9)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(0)";
                        e.currentTarget.style.boxShadow = activa
                          ? "0 0 22px rgba(236,72,153,0.85)"
                          : "0 0 12px rgba(15,23,42,0.9)";
                      }}
                    >
                      {hora}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumen de horas disponibles */}
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: "0.9rem",
                }}
              >
                {horasActivas.length > 0
                  ? `Disponible ${horasActivas.length} hora${
                      horasActivas.length === 1 ? "" : "s"
                    }:`
                  : "Elige tus horas disponibles:"}
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {horasActivas.map((h) => (
                  <span
                    key={h}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      background:
                        "linear-gradient(90deg,#fb7185,#ec4899,#8b5cf6)",
                      color: "#fff",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      boxShadow: "0 0 18px rgba(236,72,153,0.9)",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Tarjeta de Highlights ===== */}
        <div
          style={{
            position: "relative",
            overflow: "visible",
            borderRadius: "26px",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
            border: "1px solid rgba(248,113,113,0.5)",
            boxShadow: "0 16px 40px rgba(15,23,42,0.95)",
            padding: "40px 24px 26px",
          }}
        >
          {/* Brillo suave de fondo */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top left, rgba(236,72,153,0.18), transparent)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Título Highlights */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "18px",
              }}
            >
              <span
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle at top left, #ec4899, #fb7185)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "1rem",
                  boxShadow: "0 0 18px rgba(236,72,153,1)",
                }}
              >
                ▶
              </span>
              <h3
                style={{
                  margin: 0,
                  color: "#f9fafb",
                  fontSize: "1.1rem",
                  letterSpacing: "0.35px",
                }}
              >
                Highlights
              </h3>
            </div>

            {/* Fila de tarjetas */}
            <div
              className="highlight-row"
              style={{
                display: "flex",
                gap: "20px",
                justifyContent: "space-between",
                flexWrap: "nowrap",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              {[
                { titulo: "Minuto 45", subtitulo: "Gol de tiro libre" },
                {
                  titulo: "Minuto 67",
                  subtitulo: "Definición dentro del área",
                },
                {
                  titulo: "Minuto 89",
                  subtitulo: "Gol en contra del juego",
                },
              ].map((meta, idx) => {
                const hasVideo =
                  footballProfile.videos && footballProfile.videos[idx];

                return (
                  <div
                    key={idx}
                    className="highlight-video-card"
                    style={{
                      minWidth: "260px",
                      maxWidth: "280px",
                      height: "130px",
                      borderRadius: "22px",
                      border: "1px solid rgba(248,113,113,0.8)",
                      background:
                        "radial-gradient(circle at top left, #020617, #020617)",
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                      flexShrink: 0,
                      boxShadow: "0 10px 26px rgba(15,23,42,0.9)",
                      transition:
                        "transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, border-color 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 14px 40px rgba(236,72,153,0.9)";
                      e.currentTarget.style.background =
                        "radial-gradient(circle at top left, #0b1120, #020617)";
                      e.currentTarget.style.borderColor =
                        "rgba(251,113,133,1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 10px 26px rgba(15,23,42,0.9)";
                      e.currentTarget.style.background =
                        "radial-gradient(circle at top left, #020617, #020617)";
                      e.currentTarget.style.borderColor =
                        "rgba(248,113,113,0.8)";
                    }}
                    onClick={() =>
                      !hasVideo &&
                      document.getElementById(`videoInput-${idx}`)?.click()
                    }
                  >
                    {/* Video de fondo si existe */}
                    {hasVideo && (
                      <video
                        src={footballProfile.videos[idx]}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: "brightness(0.7)",
                        }}
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                        muted
                        loop
                      />
                    )}

                    {/* Overlay oscuro */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.8))",
                      }}
                    />

                    {/* Contenido principal */}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 2,
                        width: "100%",
                        height: "100%",
                        padding: "18px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      {/* Botón play */}
                      <div
                        style={{
                          width: "58px",
                          height: "58px",
                          borderRadius: "999px",
                          background:
                            "radial-gradient(circle at top left, #fb7185, #ec4899)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow:
                            "0 0 24px rgba(236,72,153,0.95), 0 0 6px rgba(15,23,42,1)",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            borderTop: "9px solid transparent",
                            borderBottom: "9px solid transparent",
                            borderLeft: "15px solid white",
                            marginLeft: "2px",
                          }}
                        />
                      </div>

                      {/* Textos */}
                      <div>
                        <div
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            color: "#f9fafb",
                            marginBottom: "3px",
                          }}
                        >
                          {meta.titulo}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#e5e7eb",
                            opacity: 0.95,
                          }}
                        >
                          {meta.subtitulo}
                        </div>
                      </div>
                    </div>

                    {/* Input de video oculto */}
                    <input
                      type="file"
                      accept="video/*"
                      id={`videoInput-${idx}`}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          const videosCopy = footballProfile.videos
                            ? [...footballProfile.videos]
                            : [null, null, null];
                          videosCopy[idx] = url;
                          setFootballProfile((prev) => ({
                            ...prev,
                            videos: videosCopy,
                          }));
                        }
                      }}
                    />

                    {/* Botón eliminar cuando hay video */}
                    {hasVideo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const confirmDelete = window.confirm(
                            "¿Estás seguro que deseas eliminar este video?"
                          );
                          if (confirmDelete) {
                            const videosCopy = [
                              ...footballProfile.videos,
                            ];
                            videosCopy[idx] = null;
                            setFootballProfile((prev) => ({
                              ...prev,
                              videos: videosCopy,
                            }));
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "rgba(239,68,68,0.9)",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#fff",
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          zIndex: 3,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== Tarjeta de Posición en Campo / Cancha ===== */}
        <div
          style={{
            background:
              "radial-gradient(circle at top left, rgba(34,197,94,0.2), transparent), rgba(6,78,59,0.9)",
            borderRadius: "22px",
            border: "1px solid rgba(45,212,191,0.8)",
            boxShadow:
              "0 0 35px rgba(34,197,94,0.6), 0 0 25px rgba(15,23,42,1)",
            padding: "18px 20px 18px",
          }}
        >
          {/* Header de la tarjeta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle at top left, #22c55e, #14b8a6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#022c22",
                  fontSize: "1rem",
                  fontWeight: 700,
                  boxShadow: "0 0 18px rgba(34,197,94,0.9)",
                }}
              >
                🎯
              </span>
              <h3
                style={{
                  margin: 0,
                  color: "#ecfdf5",
                  fontSize: "1.1rem",
                  letterSpacing: "0.3px",
                }}
              >
                Posición en campo
              </h3>
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                color: "#a7f3d0",
              }}
            >
              Haz clic para seleccionar tu posición
            </span>
          </div>

          {/* CANCHA AMPLIA */}
          <div
            className="cancha-container"
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "700px",
              minHeight: "320px",
              borderRadius: "22px",
              position: "relative",
              overflow: "hidden",
              background:
                "radial-gradient(circle at top, rgba(16,185,129,0.35), rgba(6,78,59,1))",
              boxShadow:
                "0 0 38px rgba(34,197,94,0.7), 0 0 20px rgba(15,23,42,1) inset",
            }}
          >
            {/* MARCO GENERAL */}
            <div
              style={{
                position: "absolute",
                top: "40px",
                bottom: "40px",
                left: "52px",
                right: "52px",
                border: "2px solid rgba(209,250,229,0.9)",
                borderRadius: "26px",
              }}
            />

            {/* LÍNEA CENTRAL HORIZONTAL */}
            <div
              style={{
                position: "absolute",
                left: "52px",
                right: "52px",
                top: "50%",
                height: "2px",
                background: "rgba(209,250,229,0.9)",
                transform: "translateY(-50%)",
              }}
            />

            {/* CÍRCULO CENTRAL */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                border: "2px solid rgba(209,250,229,0.9)",
              }}
            />

            {/* PUNTO CENTRAL */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "6px",
                height: "6px",
                borderRadius: "999px",
                background: "rgba(209,250,229,0.9)",
              }}
            />

            {/* ÁREA GRANDE ARRIBA */}
            <div
              style={{
                position: "absolute",
                top: "40px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "48%",
                height: "140px",
                borderRadius: "0 0 24px 24px",
                border: "2px solid rgba(209,250,229,0.9)",
              }}
            />

            {/* ÁREA CHICA ARRIBA */}
            <div
              style={{
                position: "absolute",
                top: "40px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "22%",
                height: "70px",
                borderRadius: "0px 0px 18px 18px",
                border: "2px solid rgba(209,250,229,0.9)",
              }}
            />

            {/* ÁREA GRANDE ABAJO */}
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "48%",
                height: "140px",
                borderRadius: "24px 24px 0 0",
                border: "2px solid rgba(209,250,229,0.9)",
              }}
            />

            {/* ÁREA CHICA ABAJO */}
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "22%",
                height: "70px",
                borderRadius: "18px 18px 0px 0px",
                border: "2px solid rgba(209,250,229,0.9)",
              }}
            />

            {/* 11 POSICIONES USANDO coords Y COLORES POR ROL */}
            {POSICIONES.map((pos) => {
              const level = footballProfile.posiciones[pos.id] || 0;
              const theme = getPositionTheme(pos.id);

              const boxShadow =
                level === 0
                  ? "0 0 12px rgba(15,23,42,0.9)"
                  : level === 1
                  ? `0 0 18px ${theme.glow}`
                  : `0 0 24px ${theme.glow}`;

              const background = getCircleBackground(theme, level);

              return (
                <div
                  key={pos.id}
                  onClick={() => handlePositionClick(pos.id)}
                  onMouseEnter={() => setHoveredPos(pos)}
                  onMouseLeave={() => setHoveredPos(null)}
                  style={{
                    position: "absolute",
                    top: pos.coords.top,
                    left: pos.coords.left,
                    transform: "translate(-50%, -50%)",
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: level ? "#fff" : "#e5e7eb",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    border: "2px solid rgba(248,250,252,0.95)",
                    boxShadow,
                    transition:
                      "transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform =
                      "translate(-50%, -50%) scale(1.08)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform =
                      "translate(-50%, -50%) scale(1)";
                  }}
                >
                  {pos.id}
                  {hoveredPos?.id === pos.id && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "88px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: theme.tooltipBg,
                        color: "#fff",
                        padding: "10px 18px",
                        borderRadius: "18px",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                        boxShadow: `0 14px 34px ${theme.glow}`,
                        zIndex: 15,
                        pointerEvents: "none",
                        animation: "fadeUp 0.25s ease-out forwards",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "999px",
                          background:
                            "radial-gradient(circle at top left,rgba(255,255,255,0.95),rgba(248,250,252,0.8))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.95rem",
                          boxShadow: "0 0 8px rgba(0,0,0,0.25)",
                        }}
                      >
                        {theme.icon}
                      </span>

                      <div style={{ textAlign: "left" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.8rem",
                          }}
                        >
                          {pos.label}
                        </div>
                        <div
                          style={{
                            marginTop: "2px",
                            fontSize: "0.7rem",
                            opacity: 0.96,
                          }}
                        >
                          {pos.desc}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mensaje inferior */}
          <div
            style={{
              marginTop: "14px",
              textAlign: "center",
              fontSize: "0.8rem",
              color: "#a7f3d0",
              padding: "6px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(45,212,191,0.7)",
              background: "rgba(6,95,70,0.8)",
            }}
          >
            Pasa el ratón sobre las posiciones para ver detalles. Haz clic
            para subir de nivel.
          </div>
        </div>
      </div>

      {/* Estilos extra y animaciones */}
      <style>
        {`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateX(-50%) translateY(10px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }

          @keyframes fadeInUp {
            0%   { opacity: 0; transform: translateY(50px); filter: blur(4px); }
            100% { opacity: 1; transform: translateY(0);   filter: blur(0); }
          }

          .animate-fadein {
            animation: fadeInUp 0.8s ease-out forwards;
          }

          .bio-input::placeholder {
            color: #c9c9c9;
            opacity: .8;
          }

          .highlight-row::-webkit-scrollbar {
            height: 8px;
          }
          .highlight-row::-webkit-scrollbar-track {
            background: rgba(15,23,42,0.95);
            border-radius: 999px;
          }
          .highlight-row::-webkit-scrollbar-thumb {
            background: linear-gradient(90deg,#fb7185,#ec4899,#8b5cf6);
            border-radius: 999px;
          }
          .highlight-row {
            scrollbar-width: thin;
            scrollbar-color: #ec4899 rgba(15,23,42,0.95);
          }

          /* 👇 MUY IMPORTANTE: que la capa oscura no bloquee los clics */
          .login-overlay {
            pointer-events: none;
          }
        `}
      </style>
    </div>
  );
}
