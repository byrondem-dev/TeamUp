// src/pages/MisPartidos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api";
import {
  Home,
  Users,
  MessageCircle,
  MapPin,
  CalendarDays,
  LogOut,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ===== helpers de fecha/hora (reutilizados) =====
function formatFechaLarga(fechaRaw) {
  if (!fechaRaw) return "Fecha no disponible";

  let soloFecha;

  if (typeof fechaRaw === "string") {
    soloFecha = fechaRaw.split("T")[0];
  } else if (fechaRaw instanceof Date) {
    soloFecha = fechaRaw.toISOString().split("T")[0];
  } else {
    return "Fecha no disponible";
  }

  const [y, m, d] = soloFecha.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return soloFecha;

  const dt = new Date(y, m - 1, d);
  try {
    return dt.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return soloFecha;
  }
}

function buildDateTime(fechaRaw, horaRaw) {
  if (!fechaRaw || !horaRaw) return null;

  let soloFecha;
  if (typeof fechaRaw === "string") {
    soloFecha = fechaRaw.split("T")[0];
  } else if (fechaRaw instanceof Date) {
    soloFecha = fechaRaw.toISOString().split("T")[0];
  } else {
    return null;
  }

  const [y, m, d] = soloFecha.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;

  const [hh, mm] = String(horaRaw).split(":").map((n) => parseInt(n, 10));

  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}

function formatHora(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ==== mismos días/horas que en Perfil.jsx para mostrar disponibilidad ====
const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const HORAS = [
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

// Formatea el JSON de disponibilidad (el mismo que guarda Perfil.jsx)
function formatearDisponibilidad(disp) {
  if (!disp || typeof disp !== "object") return "";

  const lineas = [];

  DIAS.forEach((dia) => {
    const horasDia = disp[dia] || {};
    const activas = HORAS.filter((h) => horasDia[h]);

    if (activas.length > 0) {
      lineas.push(`${dia}: ${activas.join(", ")}`);
    }
  });

  if (lineas.length === 0) return "";
  return lineas.join(" · ");
}

export default function MisPartidos() {
  const navigate = useNavigate();

  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [seleccionado, setSeleccionado] = useState(null);

  const [participantes, setParticipantes] = useState([]);
  const [loadingPart, setLoadingPart] = useState(false);

  const [chatMensajes, setChatMensajes] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviandoMsg, setEnviandoMsg] = useState(false);

  // 👉 Estado para el perfil del jugador seleccionado
  const [jugadorPerfil, setJugadorPerfil] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState("");
  const [jugadorSeleccionadoId, setJugadorSeleccionadoId] = useState(null);

  // Siempre empezar arriba de la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cargar mis partidos desde /api/partidos/mios
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const data = await Api.misPartidos();
        setPartidos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "No se pudieron cargar tus partidos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ahora = useMemo(() => new Date(), []);
  const { proximos, pasados } = useMemo(() => {
    const prox = [];
    const past = [];
    (partidos || []).forEach((p) => {
      const dt = buildDateTime(p.fecha, p.hora_inicio);
      if (!dt) {
        past.push(p);
        return;
      }
      if (dt >= ahora) prox.push(p);
      else past.push(p);
    });

    const sortFn = (a, b) =>
      buildDateTime(a.fecha, a.hora_inicio) -
      buildDateTime(b.fecha, b.hora_inicio);

    prox.sort(sortFn);
    past.sort(sortFn);

    return { proximos: prox, pasados: past };
  }, [partidos, ahora]);

  // Cuando selecciono un partido -> cargar participantes + chat
  useEffect(() => {
    if (!seleccionado) {
      setParticipantes([]);
      setChatMensajes([]);
      setJugadorPerfil(null);
      setErrorPerfil("");
      setJugadorSeleccionadoId(null);
      return;
    }

    const id = seleccionado.id;

    (async () => {
      try {
        setLoadingPart(true);
        const data = await Api.participantesPartido(id);
        setParticipantes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPart(false);
      }
    })();

    (async () => {
      try {
        setLoadingChat(true);
        const data = await Api.chatPartido(id, { limit: 50 });
        setChatMensajes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChat(false);
      }
    })();
  }, [seleccionado]);

  const handleSeleccionar = (p) => {
    setSeleccionado(p);
  };

  const handleSalirPartido = async () => {
    if (!seleccionado) return;
    if (!window.confirm("¿Seguro que quieres salir de este partido?")) return;

    try {
      await Api.salirPartido(seleccionado.id);
      // lo quitamos de la lista local
      setPartidos((prev) => prev.filter((p) => p.id !== seleccionado.id));
      setSeleccionado(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo salir del partido.");
    }
  };

  // 🗑 Borrar partido del HISTORIAL (pasados)
  const handleBorrarPartidoPasado = async (p) => {
    if (!p) return;

    if (
      !window.confirm(
        "¿Seguro que quieres borrar este partido pasado de tu lista?"
      )
    ) {
      return;
    }

    try {
      await Api.borrarPartidoPasado(p.id); // backend: DELETE /api/partidos/mios/:id

      // Actualizamos estado para que desaparezca de la UI
      setPartidos((prev) => prev.filter((part) => part.id !== p.id));

      if (seleccionado?.id === p.id) {
        setSeleccionado(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo borrar el partido.");
    }
  };

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!seleccionado) return;
    const texto = nuevoMensaje.trim();
    if (!texto) return;

    try {
      setEnviandoMsg(true);
      const msg = await Api.enviarMensajeChat(seleccionado.id, texto);
      setChatMensajes((prev) => [...prev, msg]);
      setNuevoMensaje("");
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setEnviandoMsg(false);
    }
  };

  // 👉 Ver perfil de un jugador (clic en la lista de participantes)
  const handleVerPerfilJugador = async (pp) => {
    if (!pp || !pp.usuario_id) return;

    setJugadorSeleccionadoId(pp.usuario_id);

    try {
      setLoadingPerfil(true);
      setErrorPerfil("");
      const data = await Api.perfilJugador(pp.usuario_id);
      setJugadorPerfil(data ? { ...data, usuario_id: pp.usuario_id } : null);
    } catch (err) {
      console.error(err);
      setJugadorPerfil(null);
      setErrorPerfil(
        err.message || "No se pudo cargar el perfil del jugador."
      );
    } finally {
      setLoadingPerfil(false);
    }
  };

  return (
    <div style={pageBg}>
      <div style={overlay} />

      {/* Botón inicio con animación */}
      <motion.button
        onClick={() => navigate("/")}
        style={homeBtn}
        whileHover={{ scale: 1.05, x: 2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Home size={18} />
        <span>Inicio</span>
      </motion.button>

      <motion.div
        style={card}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div style={topRow}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            ⬅ Volver
          </button>
          <h1 style={titleText}>Mis partidos</h1>
          <motion.button
            style={miniBtn}
            onClick={() => navigate("/buscar")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            Buscar partidos ⚽
          </motion.button>
        </div>

        {loading && <p style={infoText}>Cargando tus partidos…</p>}

        {!loading && errorMsg && (
          <p style={{ ...infoText, color: "#ff9fbf" }}>{errorMsg}</p>
        )}

        {!loading && !errorMsg && partidos.length === 0 && (
          <motion.div
            style={emptyBox}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p style={{ margin: 0 }}>
              Aún no estás en ningún partido. Cuando publiques uno en{" "}
              <strong>“Mis reservas → Me falta uno”</strong> o te inscribas en
              uno, aparecerá aquí.
            </p>
            <motion.button
              style={primaryBtn}
              onClick={() => navigate("/buscar")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Buscar partidos ahora 💥
            </motion.button>
          </motion.div>
        )}

        {!loading && !errorMsg && partidos.length > 0 && (
          <div style={mainLayout}>
            {/* Columna izquierda: lista de partidos */}
            <div style={leftCol}>
              <section style={sectionBlock}>
                <div style={sectionHeader}>
                  <h2 style={sectionTitle}>Próximos partidos</h2>
                  <span style={sectionChip}>
                    {proximos.length}{" "}
                    {proximos.length === 1 ? "partido" : "partidos"}
                  </span>
                </div>

                {proximos.length === 0 ? (
                  <p style={sectionText}>
                    No tienes partidos futuros. Agenda uno y arma la pichanga 🔥
                  </p>
                ) : (
                  <div style={listCol}>
                    {proximos.map((p, index) => {
                      const dtNice = formatFechaLarga(p.fecha);
                      const esSeleccionado = seleccionado?.id === p.id;
                      const cuposUsados = p.confirmados || 0;
                      const vacantes = p.vacantes ?? 0;
                      const libres =
                        vacantes - cuposUsados >= 0
                          ? vacantes - cuposUsados
                          : 0;

                      return (
                        <motion.div
                          key={p.id}
                          style={{
                            ...partidoCard,
                            borderColor: esSeleccionado
                              ? "rgba(150,255,210,0.9)"
                              : "rgba(255,105,180,0.4)",
                            boxShadow: esSeleccionado
                              ? "0 0 18px rgba(150,255,210,0.7)"
                              : "0 0 10px rgba(0,0,0,0.7)",
                            background: esSeleccionado
                              ? "linear-gradient(135deg, rgba(0,40,20,.98), rgba(5,0,20,.98))"
                              : partidoCard.background,
                          }}
                          onClick={() => handleSeleccionar(p)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: index * 0.03,
                          }}
                          whileHover={{
                            y: -2,
                            boxShadow: esSeleccionado
                              ? "0 0 18px rgba(150,255,210,0.9)"
                              : "0 0 14px rgba(150,255,210,0.6)",
                          }}
                        >
                          <div style={partidoTop}>
                            <div>
                              <div style={partidoNombre}>
                                {p.cancha_nombre || "Cancha sin nombre"}
                              </div>
                              <div style={partidoSub}>
                                <MapPin size={14} />{" "}
                                {p.ubicacion || "Ubicación no especificada"}
                              </div>
                              <div style={partidoSub}>
                                <CalendarDays size={14} /> {dtNice} ·{" "}
                                {p.hora_inicio} – {p.hora_fin}
                              </div>
                            </div>
                            {p.soy_organizador ? (
                              <span style={badgeOrganizador}>Organizas tú</span>
                            ) : (
                              <span style={badgeJugador}>Invitado</span>
                            )}
                          </div>

                          <div style={partidoBottom}>
                            <span style={cuposText}>
                              <Users size={14} />
                              {libres > 0
                                ? ` Faltan ${libres} jugadores`
                                : " Sin cupos disponibles"}
                            </span>
                            {p.descripcion && (
                              <span style={descripcionText}>
                                {p.descripcion}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section style={sectionBlock}>
                <div style={sectionHeader}>
                  <h2 style={sectionTitle}>Historial</h2>
                  <span style={sectionChip}>
                    {pasados.length}{" "}
                    {pasados.length === 1 ? "partido" : "partidos"}
                  </span>
                </div>

                {pasados.length === 0 ? (
                  <p style={sectionText}>
                    Todavía no tienes historial de partidos.
                  </p>
                ) : (
                  <div style={listCol}>
                    {pasados.map((p, index) => {
                      const dtNice = formatFechaLarga(p.fecha);
                      return (
                        <motion.div
                          key={p.id}
                          style={partidoCardPast}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: index * 0.03,
                          }}
                          whileHover={{
                            y: -2,
                            boxShadow:
                              "0 0 14px rgba(255,105,180,0.7)",
                          }}
                        >
                          <div style={partidoTop}>
                            <div>
                              <div style={partidoNombre}>
                                {p.cancha_nombre || "Cancha sin nombre"}
                              </div>
                              <div style={partidoSub}>
                                <MapPin size={14} />{" "}
                                {p.ubicacion || "Ubicación no especificada"}
                              </div>
                              <div style={partidoSub}>
                                <CalendarDays size={14} /> {dtNice} ·{" "}
                                {p.hora_inicio} – {p.hora_fin}
                              </div>
                            </div>

                            <div style={histRightCol}>
                              {p.soy_organizador ? (
                                <span style={badgeOrganizador}>
                                  Organizaste
                                </span>
                              ) : (
                                <span style={badgeJugador}>Jugaste</span>
                              )}

                              <motion.button
                                type="button"
                                style={borrarPastBtn}
                                onClick={() => handleBorrarPartidoPasado(p)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.96 }}
                              >
                                🗑 Borrar
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Columna derecha: detalle + jugadores + chat + perfil jugador */}
            <div style={rightCol}>
              <AnimatePresence mode="wait">
                {!seleccionado ? (
                  <motion.div
                    key="empty"
                    style={detalleEmptyBox}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p style={{ margin: 0 }}>
                      Selecciona un partido de la lista para ver los jugadores y
                      el chat del equipo.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={seleccionado.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: "flex", flexDirection: "column", gap: 10 }}
                  >
                    <div style={detalleCard}>
                      <div style={detalleHeader}>
                        <h2 style={detalleTitle}>
                          {seleccionado.cancha_nombre || "Cancha sin nombre"}
                        </h2>
                        <motion.button
                          style={detalleLinkBtn}
                          onClick={() =>
                            navigate(`/partido/${seleccionado.id}`)
                          }
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          Ver detalle completo →
                        </motion.button>
                      </div>
                      <p style={detalleSub}>
                        {formatFechaLarga(seleccionado.fecha)} ·{" "}
                        {seleccionado.hora_inicio} – {seleccionado.hora_fin}
                      </p>
                      <p style={detalleSub}>
                        📍{" "}
                        {seleccionado.ubicacion || "Ubicación no especificada"}
                      </p>
                      <p style={detalleSub}>
                        Organiza:{" "}
                        <strong>
                          {seleccionado.organizador_nombre || "Jugador"}
                        </strong>
                      </p>

                      {!seleccionado.soy_organizador && (
                        <motion.button
                          style={salirBtn}
                          type="button"
                          onClick={handleSalirPartido}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          <LogOut size={16} />
                          Salir de este partido
                        </motion.button>
                      )}
                    </div>

                    <div style={panelRow}>
                      {/* Jugadores */}
                      <div style={jugadoresCard}>
                        <div style={panelHeader}>
                          <span style={panelTitle}>Jugadores</span>
                          <span style={panelChip}>
                            <Users size={14} />
                            {loadingPart
                              ? " Cargando..."
                              : ` ${participantes.length} jugador${
                                  participantes.length === 1 ? "" : "es"
                                }`}
                          </span>
                        </div>

                        {participantes.length > 0 && !loadingPart && (
                          <p style={{ ...panelText, marginBottom: 2 }}>
                            Toca un jugador para ver su perfil.
                          </p>
                        )}

                        <div style={jugadoresList}>
                          {loadingPart ? (
                            <p style={panelText}>Cargando jugadores…</p>
                          ) : participantes.length === 0 ? (
                            <p style={panelText}>
                              Aún no hay jugadores confirmados (además del
                              organizador).
                            </p>
                          ) : (
                            participantes.map((pp, index) => (
                              <motion.div
                                key={pp.id}
                                style={{
                                  ...jugadorItem,
                                  cursor: "pointer",
                                  borderRadius: 10,
                                  padding: "4px 6px",
                                  background:
                                    jugadorSeleccionadoId === pp.usuario_id
                                      ? "rgba(255,105,180,0.18)"
                                      : "transparent",
                                }}
                                onClick={() => handleVerPerfilJugador(pp)}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.15,
                                  delay: index * 0.02,
                                }}
                                whileHover={{
                                  background: "rgba(255,105,180,0.25)",
                                }}
                              >
                                <div style={jugadorAvatar}>
                                  {pp.usuario_nombre?.[0]?.toUpperCase() ||
                                    "J"}
                                </div>
                                <div>
                                  <div style={jugadorNombre}>
                                    {pp.usuario_nombre || "Jugador"}
                                  </div>
                                  <div style={jugadorMail}>
                                    {pp.usuario_email || ""}
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Chat */}
                      <div style={chatCard}>
                        <div style={panelHeader}>
                          <span style={panelTitle}>
                            <MessageCircle size={16} /> Chat del partido
                          </span>
                        </div>

                        <div style={chatBox}>
                          {loadingChat ? (
                            <p style={panelText}>Cargando chat…</p>
                          ) : chatMensajes.length === 0 ? (
                            <p style={panelText}>
                              Aún no hay mensajes. Escribe el primero.
                            </p>
                          ) : (
                            chatMensajes.map((m) => (
                              <motion.div
                                key={m.id}
                                style={chatMsg}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <div style={chatMsgHeader}>
                                  <span style={chatUser}>
                                    {m.usuario_nombre || "Jugador"}
                                  </span>
                                  <span style={chatTime}>
                                    {formatHora(m.creado_en)}
                                  </span>
                                </div>
                                <div style={chatText}>{m.mensaje}</div>
                              </motion.div>
                            ))
                          )}
                        </div>

                        <form style={chatForm} onSubmit={handleEnviarMensaje}>
                          <input
                            type="text"
                            placeholder="Escribe un mensaje para tu equipo..."
                            value={nuevoMensaje}
                            onChange={(e) =>
                              setNuevoMensaje(e.target.value)
                            }
                            style={chatInput}
                          />
                          <motion.button
                            type="submit"
                            style={chatBtn}
                            disabled={enviandoMsg || !nuevoMensaje.trim()}
                            whileHover={{
                              scale:
                                enviandoMsg || !nuevoMensaje.trim() ? 1 : 1.03,
                            }}
                            whileTap={{
                              scale:
                                enviandoMsg || !nuevoMensaje.trim() ? 1 : 0.96,
                            }}
                          >
                            Enviar
                          </motion.button>
                        </form>
                      </div>
                    </div>

                    {/* Tarjeta de perfil del jugador seleccionado */}
                    {(loadingPerfil || jugadorPerfil || errorPerfil) && (
                      <motion.div
                        style={perfilCard}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div style={perfilHeader}>
                          <span style={perfilTitle}>
                            <User size={16} /> Perfil del jugador
                          </span>
                          {jugadorPerfil && (
                            <span style={perfilName}>
                              {jugadorPerfil.nombre || "Jugador"}
                            </span>
                          )}
                        </div>

                        {loadingPerfil && (
                          <p style={panelText}>Cargando perfil...</p>
                        )}

                        {errorPerfil && !loadingPerfil && (
                          <p
                            style={{
                              ...panelText,
                              color: "#ff9fbf",
                            }}
                          >
                            {errorPerfil}
                          </p>
                        )}

                        {!loadingPerfil && !errorPerfil && jugadorPerfil && (
                          <>
                            <div style={perfilMain}>
                              <div style={perfilAvatar}>
                                {jugadorPerfil.imagen ? (
                                  <img
                                    src={jugadorPerfil.imagen}
                                    alt={
                                      jugadorPerfil.nombre || "Jugador"
                                    }
                                    style={perfilAvatarImg}
                                  />
                                ) : (
                                  <span style={perfilAvatarLetter}>
                                    {(jugadorPerfil.nombre || "J")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div style={perfilLine}>
                                  <strong>Edad:</strong>{" "}
                                  <span>
                                    {jugadorPerfil.edad || "No indicada"}
                                  </span>
                                </div>
                                <div style={perfilLine}>
                                  <strong>Posiciones:</strong>{" "}
                                  <span>
                                    {(() => {
                                      const pos =
                                        jugadorPerfil.posiciones || {};
                                      const activas = Object.entries(pos)
                                        .filter(([, v]) => !!v)
                                        .map(([k]) => k);
                                      return activas.length
                                        ? activas.join(", ")
                                        : "No especificadas";
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {jugadorPerfil.bio && (
                              <p style={perfilBio}>{jugadorPerfil.bio}</p>
                            )}

                            {/* DISPONIBILIDAD FORMATEADA DESDE LA BD */}
                            {jugadorPerfil.disponibilidad &&
                              (() => {
                                const textoDisp =
                                  formatearDisponibilidad(
                                    jugadorPerfil.disponibilidad
                                  );
                                if (!textoDisp) return null;
                                return (
                                  <p style={perfilDisp}>
                                    <strong>Disponibilidad:</strong>{" "}
                                    {textoDisp}
                                  </p>
                                );
                              })()}

                            {Array.isArray(jugadorPerfil.videos) &&
                              jugadorPerfil.videos.filter(Boolean).length >
                                0 && (
                                <p style={perfilVideos}>
                                  <strong>Clips:</strong>{" "}
                                  {
                                    jugadorPerfil.videos.filter(
                                      (v) => !!v
                                    ).length
                                  }{" "}
                                  video
                                  {jugadorPerfil.videos.filter(Boolean)
                                    .length > 1
                                    ? "s"
                                    : ""}{" "}
                                  guardado
                                  {jugadorPerfil.videos.filter(Boolean)
                                    .length > 1
                                    ? "s"
                                    : ""}
                                </p>
                              )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ===== estilos ===== */

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
  maxWidth: 1200,
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
  marginBottom: 14,
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
};

const titleText = {
  margin: 0,
  textAlign: "center",
  fontSize: "1.5rem",
  color: "#ff79c4",
  textShadow: "0 0 16px rgba(255,105,180,.9)",
};

const miniBtn = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #ff61b6, #ffb3e1, #ff61b6)",
  color: "#2b0018",
  fontWeight: 700,
  fontSize: "0.8rem",
  cursor: "pointer",
  letterSpacing: "0.04em",
};

const infoText = {
  marginTop: 8,
  fontSize: "0.9rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

const emptyBox = {
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  background: "rgba(20,0,30,.94)",
  border: "1px dashed rgba(255,105,180,.6)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const primaryBtn = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #ff61b6, #ffb3e1, #ff61b6)",
  color: "#2b0018",
  fontWeight: 700,
  fontSize: "0.9rem",
  cursor: "pointer",
  letterSpacing: "0.04em",
};

const mainLayout = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.3fr)",
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
  gap: 10,
};

const sectionBlock = {
  borderRadius: 18,
  padding: 12,
  background:
    "linear-gradient(145deg, rgba(18,0,26,.96), rgba(0,0,0,.98))",
  border: "1px solid rgba(255,105,180,.3)",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
};

const sectionTitle = {
  margin: 0,
  fontSize: "1rem",
  color: "#ffb3e1",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const sectionChip = {
  padding: "3px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.7)",
  background: "rgba(255,105,180,.15)",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#ffd5ec",
};

const sectionText = {
  margin: 0,
  fontSize: "0.86rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

const listCol = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: 4,
};

const partidoCard = {
  borderRadius: 14,
  padding: 10,
  background: "rgba(10,30,20,.95)",
  border: "1px solid rgba(150,255,210,.6)",
  cursor: "pointer",
};

const partidoCardPast = {
  borderRadius: 14,
  padding: 10,
  background: "rgba(22,0,30,.95)",
  border: "1px solid rgba(255,105,180,.4)",
};

const partidoTop = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
};

const partidoBottom = {
  marginTop: 4,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const partidoNombre = {
  fontSize: "0.95rem",
  fontWeight: 700,
  color: "#c8ffe8",
};

const partidoSub = {
  fontSize: "0.8rem",
  color: "#ffe6f3",
  opacity: 0.9,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const cuposText = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontSize: "0.8rem",
  color: "#b4ffe3",
};

const descripcionText = {
  fontSize: "0.78rem",
  color: "#fefefe",
  opacity: 0.9,
};

const badgeOrganizador = {
  padding: "2px 8px",
  borderRadius: 999,
  background: "rgba(109,255,191,.16)",
  border: "1px solid rgba(150,255,210,.9)",
  fontSize: "0.75rem",
  color: "#b4ffe3",
};

const badgeJugador = {
  padding: "2px 8px",
  borderRadius: 999,
  background: "rgba(255,205,110,.16)",
  border: "1px solid rgba(255,215,150,.9)",
  fontSize: "0.75rem",
  color: "#ffe7b5",
};

const detalleEmptyBox = {
  borderRadius: 18,
  padding: 12,
  background: "rgba(10,0,25,.96)",
  border: "1px dashed rgba(255,105,180,.7)",
  fontSize: "0.88rem",
};

const detalleCard = {
  borderRadius: 18,
  padding: 12,
  background:
    "linear-gradient(145deg, rgba(15,0,20,.96), rgba(5,0,10,.96))",
  border: "1px solid rgba(255,105,180,.28)",
};

const detalleHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const detalleTitle = {
  margin: 0,
  fontSize: "1.1rem",
  color: "#ffb3e1",
};

const detalleLinkBtn = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(150,255,210,.8)",
  background: "rgba(0,0,0,.9)",
  color: "#b4ffe3",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const detalleSub = {
  margin: 0,
  marginTop: 2,
  fontSize: "0.82rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

const salirBtn = {
  marginTop: 8,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,120,150,.9)",
  background: "rgba(60,0,20,.96)",
  color: "#ffd5ec",
  fontSize: "0.8rem",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const panelRow = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)",
  gap: 10,
};

const jugadoresCard = {
  borderRadius: 16,
  padding: 10,
  background: "rgba(0,0,0,.92)",
  border: "1px solid rgba(150,255,210,.6)",
};

const chatCard = {
  borderRadius: 16,
  padding: 10,
  background: "rgba(5,0,10,.96)",
  border: "1px solid rgba(255,105,180,.6)",
  display: "flex",
  flexDirection: "column",
};

const panelHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
};

const panelTitle = {
  fontSize: "0.88rem",
  fontWeight: 700,
  color: "#ffb3e1",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const panelChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid rgba(150,255,210,.8)",
  fontSize: "0.75rem",
  color: "#b4ffe3",
};

const panelText = {
  margin: 0,
  fontSize: "0.8rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

const jugadoresList = {
  marginTop: 4,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  maxHeight: 200,
  overflowY: "auto",
};

const jugadorItem = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const jugadorAvatar = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #ff61b6, #ffb3e1, #ff61b6)",
  color: "#2b0018",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.8rem",
  fontWeight: 800,
};

const jugadorNombre = {
  fontSize: "0.86rem",
  fontWeight: 600,
};

const jugadorMail = {
  fontSize: "0.78rem",
  color: "#ffe6f3",
  opacity: 0.8,
};

const chatBox = {
  marginTop: 4,
  flex: 1,
  minHeight: 140,
  maxHeight: 220,
  overflowY: "auto",
  padding: 4,
  borderRadius: 10,
  background: "rgba(0,0,0,.85)",
};

const chatMsg = {
  marginBottom: 6,
  padding: 6,
  borderRadius: 8,
  background: "rgba(255,255,255,.03)",
};

const chatMsgHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "0.78rem",
  marginBottom: 2,
};

const chatUser = {
  fontWeight: 600,
};

const chatTime = {
  opacity: 0.7,
};

const chatText = {
  fontSize: "0.82rem",
};

const chatForm = {
  marginTop: 6,
  display: "flex",
  gap: 6,
};

const chatInput = {
  flex: 1,
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.8)",
  background: "rgba(0,0,0,.9)",
  color: "#fff",
  fontSize: "0.85rem",
  padding: "6px 10px",
  outline: "none",
};

const chatBtn = {
  padding: "6px 12px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #ff61b6, #ffb3e1, #ff61b6)",
  color: "#2b0018",
  fontWeight: 700,
  fontSize: "0.8rem",
  cursor: "pointer",
};

/* ==== estilos perfil jugador ==== */

const perfilCard = {
  marginTop: 10,
  borderRadius: 16,
  padding: 10,
  background: "rgba(10,0,25,.96)",
  border: "1px solid rgba(255,105,180,.6)",
};

const perfilHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
};

const perfilTitle = {
  fontSize: "0.86rem",
  fontWeight: 700,
  color: "#ffb3e1",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const perfilName = {
  fontSize: "0.86rem",
  fontWeight: 600,
  color: "#c8ffe8",
};

const perfilMain = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 6,
};

const perfilAvatar = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  overflow: "hidden",
  background: "linear-gradient(135deg, #ff61b6, #ffb3e1, #ff61b6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const perfilAvatarImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const perfilAvatarLetter = {
  color: "#2b0018",
  fontWeight: 800,
};

const perfilLine = {
  fontSize: "0.82rem",
  color: "#ffe6f3",
  marginBottom: 2,
};

const perfilBio = {
  margin: "4px 0",
  fontSize: "0.82rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

const perfilDisp = {
  margin: "2px 0",
  fontSize: "0.8rem",
  color: "#ffd5ec",
};

const perfilVideos = {
  margin: "2px 0",
  fontSize: "0.8rem",
  color: "#b4ffe3",
};

// Columna derecha del historial (badge + botón borrar)
const histRightCol = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 6,
};

// Botón borrar partido pasado
const borrarPastBtn = {
  padding: "2px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,120,150,.9)",
  background: "rgba(50,0,20,.95)",
  color: "#ffd5ec",
  fontSize: "0.75rem",
  cursor: "pointer",
};
