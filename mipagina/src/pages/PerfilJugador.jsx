// src/pages/PerfilJugador.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Home, ArrowLeft, Users } from "lucide-react";
import { Api } from "../api";

export default function PerfilJugador() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!id) {
        setErrorMsg("ID de jugador inválido");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMsg("");
        const data = await Api.perfilDeUsuario(id);
        setPerfil(data);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "No se pudo cargar el perfil del jugador.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const renderContenido = () => {
    if (loading) {
      return (
        <div style={fallbackBox}>
          <h2 style={{ margin: 0, marginBottom: 8, color: "#ff79c4" }}>
            Cargando perfil…
          </h2>
          <p style={fallbackText}>
            Estamos trayendo la info del jugador desde tu API.
          </p>
        </div>
      );
    }

    if (errorMsg || !perfil) {
      return (
        <div style={fallbackBox}>
          <h2 style={{ margin: 0, marginBottom: 8, color: "#ff79c4" }}>
            No se pudo cargar el perfil
          </h2>
          <p style={fallbackText}>
            {errorMsg || "Este jugador aún no tiene perfil configurado."}
          </p>
          <button style={primaryBtn} onClick={() => navigate(-1)}>
            Volver al partido
          </button>
        </div>
      );
    }

    const {
      nombre,
      edad,
      bio,
      imagen,
      email,
      posiciones = {},
      videos = [],
    } = perfil;

    // Posiciones como chips
    const chipsPos = Object.entries(posiciones)
      .filter(([, v]) => v) // solo las que estén marcadas / tengan valor truthy
      .map(([k, v]) =>
        typeof v === "string" && v.trim()
          ? `${k} (${v})`
          : k
      );

    return (
      <div style={perfilLayout}>
        {/* Col izquierda: foto + básicos */}
        <div style={leftCol}>
          <div style={fotoBox}>
            {imagen ? (
              <img
                src={imagen}
                alt={nombre || "Jugador"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div style={fotoFallback}>
                <span style={{ fontSize: "2.4rem" }}>
                  {(nombre && nombre[0]?.toUpperCase()) || "J"}
                </span>
              </div>
            )}
          </div>

          <div style={basicBox}>
            <h2 style={nombreText}>{nombre || "Jugador sin nombre"}</h2>
            <p style={lineText}>
              <strong>Edad:</strong>{" "}
              {edad ? `${edad} años` : "No especificada"}
            </p>
            {email && (
              <p style={lineText}>
                <strong>Contacto:</strong> {email}
              </p>
            )}
            <p style={lineTextSmall}>
              Este es un perfil de jugador cargado desde tu base de datos
              (<code>usuarios</code> + <code>perfiles_jugador</code>).
            </p>
          </div>
        </div>

        {/* Col derecha: bio, posiciones, videos */}
        <div style={rightCol}>
          <div style={sectionCard}>
            <h3 style={sectionTitle}>Biografía</h3>
            <p style={bioText}>
              {bio && bio.trim()
                ? bio
                : "Este jugador aún no ha escrito una biografía."}
            </p>
          </div>

          <div style={sectionCard}>
            <h3 style={sectionTitle}>
              <Users size={16} style={{ marginRight: 6 }} />
              Posiciones
            </h3>
            {chipsPos.length === 0 ? (
              <p style={bioText}>
                No hay posiciones configuradas en su perfil.
              </p>
            ) : (
              <div style={chipsRow}>
                {chipsPos.map((txt) => (
                  <span key={txt} style={chip}>
                    {txt}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={sectionCard}>
            <h3 style={sectionTitle}>Videos</h3>
            {(!videos || videos.filter(Boolean).length === 0) ? (
              <p style={bioText}>
                Este jugador todavía no agregó videos a su perfil.
              </p>
            ) : (
              <div style={videosCol}>
                {videos.map(
                  (url, idx) =>
                    url && (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        style={videoLink}
                      >
                        Video {idx + 1}
                      </a>
                    )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={pageBg}>
      <div style={overlay} />

      {/* Botón inicio */}
      <button onClick={() => navigate("/")} style={homeBtn}>
        <Home size={18} />
        <span>Inicio</span>
      </button>

      <div style={card}>
        <div style={topRow}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
          <h1 style={titleText}>Perfil del jugador</h1>
          <div style={{ width: 80 }} /> {/* espacio para equilibrar grid */}
        </div>

        {renderContenido()}
      </div>
    </div>
  );
}

/* === estilos === */

const pageBg = {
  minHeight: "100vh",
  padding: "80px 16px 32px",
  backgroundImage:
    "linear-gradient(120deg, rgba(0,0,0,.96), rgba(10,0,20,.92)), url('https://static.independentespanol.com/2024/02/22/04/MLS-RESUMEN_56820.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center 20%",
  position: "relative",
  fontFamily: "'Poppins', sans-serif",
};

const overlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(120deg, rgba(0,0,0,0.9), rgba(20,0,40,0.92))",
  zIndex: 0,
};

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

const card = {
  position: "relative",
  zIndex: 1,
  maxWidth: 1100,
  margin: "0 auto",
  background: "rgba(0,0,0,.9)",
  borderRadius: 24,
  padding: 22,
  border: "1px solid rgba(255,105,180,.45)",
  boxShadow: "0 22px 60px rgba(0,0,0,.9)",
  backdropFilter: "blur(10px)",
  color: "#ffe6f3",
};

const topRow = {
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
};

const backBtn = {
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.7)",
  background:
    "radial-gradient(circle at top left, rgba(255,105,180,.2), rgba(0,0,0,.95))",
  color: "#ffe6f3",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const titleText = {
  margin: 0,
  textAlign: "center",
  fontSize: "1.5rem",
  color: "#ff79c4",
  textShadow: "0 0 16px rgba(255,105,180,.9)",
};

const fallbackBox = {
  borderRadius: 18,
  padding: 16,
  background: "rgba(10,0,25,.96)",
  border: "1px dashed rgba(255,105,180,.7)",
  fontSize: "0.9rem",
};

const fallbackText = {
  margin: 0,
  color: "#ffe6f3",
  fontSize: "0.9rem",
};

const primaryBtn = {
  marginTop: 10,
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg, #ff61b6, #ffb3e1, #ff61b6)",
  color: "#2b0018",
  fontWeight: 700,
  fontSize: "0.9rem",
  cursor: "pointer",
  letterSpacing: "0.04em",
};

const perfilLayout = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.5fr)",
  gap: 18,
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

const fotoBox = {
  borderRadius: 20,
  overflow: "hidden",
  height: 220,
  boxShadow: "0 18px 40px rgba(0,0,0,.85)",
};

const fotoFallback = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, #ff61b6, #ffb3e1, #ff61b6)",
  color: "#2b0018",
  fontWeight: 800,
};

const basicBox = {
  borderRadius: 18,
  padding: 14,
  background:
    "linear-gradient(145deg, rgba(15,0,25,.98), rgba(5,0,10,.98))",
  border: "1px solid rgba(255,105,180,.25)",
};

const nombreText = {
  margin: "0 0 6px",
  fontSize: "1.25rem",
  color: "#ffb3e1",
};

const lineText = {
  margin: "2px 0",
  fontSize: "0.9rem",
  opacity: 0.96,
};

const lineTextSmall = {
  marginTop: 6,
  marginBottom: 0,
  fontSize: "0.78rem",
  color: "rgba(255,230,243,0.82)",
};

const sectionCard = {
  borderRadius: 18,
  padding: 14,
  background: "rgba(0,0,0,.92)",
  border: "1px solid rgba(255,105,180,.3)",
};

const sectionTitle = {
  margin: 0,
  marginBottom: 6,
  fontSize: "0.95rem",
  color: "#ffb3e1",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  display: "flex",
  alignItems: "center",
};

const bioText = {
  margin: 0,
  fontSize: "0.88rem",
  color: "#ffe6f3",
  opacity: 0.95,
};

const chipsRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const chip = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(150,255,210,.9)",
  background: "rgba(0,40,20,.95)",
  fontSize: "0.78rem",
  color: "#b4ffe3",
};

const videosCol = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const videoLink = {
  fontSize: "0.86rem",
  color: "#b4ffe3",
  textDecoration: "underline",
};
