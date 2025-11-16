// src/pages/MisReservas.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { Home } from "lucide-react";

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

// 🧠 Soporta "2025-11-14" y "2025-11-14T00:00:00.000Z"
function formatFechaLarga(fechaRaw) {
  if (!fechaRaw) return "Fecha no disponible";

  let soloFecha;

  if (typeof fechaRaw === "string") {
    soloFecha = fechaRaw.split("T")[0]; // YYYY-MM-DD
  } else if (fechaRaw instanceof Date) {
    soloFecha = fechaRaw.toISOString().split("T")[0];
  } else {
    return "Fecha no disponible";
  }

  const [y, m, d] = soloFecha.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return "Fecha no disponible";

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

// 🧠 Construye Date para separar futuras/pasadas
function buildDateTime(fechaRaw, horaRaw) {
  if (!fechaRaw || !horaRaw) return null;

  let soloFecha;
  if (typeof fechaRaw === "string") {
    soloFecha = fechaRaw.split("T")[0]; // "YYYY-MM-DD"
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

export default function MisReservas() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 🔥 estado para "me falta uno"
  const [modalPartidoOpen, setModalPartidoOpen] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [vacantes, setVacantes] = useState(1);
  const [descripcion, setDescripcion] = useState("");
  const [publicando, setPublicando] = useState(false);

  // Detalle lateral
  const [detalleReserva, setDetalleReserva] = useState(null);

  // 🔝 Siempre arriba al entrar
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await Api.misReservas(); // /api/reservas/mis
        setReservas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "No se pudieron cargar tus reservas.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ahora = useMemo(() => new Date(), []);
  const { futuras, pasadas } = useMemo(() => {
    const fut = [];
    const past = [];
    (reservas || []).forEach((r) => {
      const dt = buildDateTime(r.fecha, r.hora_inicio);
      if (!dt) {
        past.push(r);
        return;
      }
      if (dt >= ahora) fut.push(r);
      else past.push(r);
    });

    const sortFn = (a, b) =>
      buildDateTime(a.fecha, a.hora_inicio) -
      buildDateTime(b.fecha, b.hora_inicio);

    fut.sort(sortFn);
    past.sort(sortFn);

    return { futuras: fut, pasadas: past };
  }, [reservas, ahora]);

  const goReservar = () => navigate("/reservar");

  const estadoChipStyle = (estado) => {
    const base = {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: "0.7rem",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    };
    if (estado === "pagada") {
      return {
        ...base,
        background: "rgba(109,255,191,.16)",
        border: "1px solid rgba(150,255,210,.8)",
        color: "#b4ffe3",
      };
    }
    if (estado === "pendiente") {
      return {
        ...base,
        background: "rgba(255,205,110,.16)",
        border: "1px solid rgba(255,215,150,.9)",
        color: "#ffe7b5",
      };
    }
    if (estado === "cancelada") {
      return {
        ...base,
        background: "rgba(255,120,150,.16)",
        border: "1px solid rgba(255,150,180,.9)",
        color: "#ffc5d6",
      };
    }
    return {
      ...base,
      background: "rgba(255,255,255,.08)",
      border: "1px solid rgba(255,255,255,.3)",
      color: "#fff",
    };
  };

  // 👉 abrir modal de "Me falta uno"
  const handleAbrirModalPartido = (reserva) => {
    setReservaSeleccionada(reserva);
    setVacantes(1);
    setDescripcion("");
    setModalPartidoOpen(true);
  };

  const handleCerrarModal = () => {
    if (publicando) return;
    setModalPartidoOpen(false);
    setReservaSeleccionada(null);
  };

  // ✅ Publicar partido REAL en /api/partidos
  const handlePublicarPartido = async () => {
    if (!reservaSeleccionada) return;

    try {
      if (!vacantes || Number(vacantes) < 1) {
        alert("Debes indicar al menos 1 vacante.");
        return;
      }

      setPublicando(true);

      const fechaStr = String(reservaSeleccionada.fecha).split("T")[0];

      await Api.crearPartido({
        cancha_id: reservaSeleccionada.cancha_id,
        fecha: fechaStr,
        hora_inicio: reservaSeleccionada.hora_inicio?.slice(0, 5),
        hora_fin: reservaSeleccionada.hora_fin?.slice(0, 5),
        vacantes,
        descripcion,
      });

      alert(
        "Partido publicado 🎉 Ahora otros jugadores podrán encontrarte en Buscar partido."
      );
      setModalPartidoOpen(false);
      setReservaSeleccionada(null);
    } catch (err) {
      console.error(err);
      alert(
        err.message || "No se pudo publicar el partido. Inténtalo de nuevo."
      );
    } finally {
      setPublicando(false);
    }
  };

  // 🗑 Borrar UNA reserva pasada (del historial)
  const handleEliminarReservaPasada = async (id) => {
    if (
      !window.confirm(
        "¿Seguro que quieres borrar esta reserva del historial? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      await Api.eliminarReserva(id); // DELETE /api/reservas/:id
      setReservas((prev) => prev.filter((r) => r.id !== id));
      if (detalleReserva && detalleReserva.id === id) {
        setDetalleReserva(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo borrar la reserva.");
    }
  };

  // 🧹 Borrar TODAS las reservas pasadas
  const handleEliminarTodasPasadas = async () => {
    if (!pasadas.length) return;

    if (
      !window.confirm(
        `Vas a borrar ${pasadas.length} reserva${
          pasadas.length === 1 ? "" : "s"
        } del historial. ¿Estás seguro?`
      )
    )
      return;

    try {
      await Api.eliminarReservasPasadas(); // DELETE /api/reservas/mis/pasadas
      const idsPasadas = new Set(pasadas.map((r) => r.id));
      setReservas((prev) => prev.filter((r) => !idsPasadas.has(r.id)));
      if (detalleReserva && idsPasadas.has(detalleReserva.id)) {
        setDetalleReserva(null);
      }
    } catch (err) {
      console.error(err);
      alert(
        err.message ||
          "No se pudieron borrar las reservas pasadas. Inténtalo de nuevo."
      );
    }
  };

  return (
    <div style={pageBg}>
      {/* Botón Inicio flotante */}
      <motion.button
        type="button"
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
        {/* Barra superior */}
        <div style={topRow}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            ⬅ Volver
          </button>
          <h1 style={titleText}>Mis reservas</h1>
          <motion.button
            onClick={goReservar}
            style={primaryMiniBtn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            Reservar cancha ⚽
          </motion.button>
        </div>

        {loading && (
          <p style={{ color: "#ffe6f3", fontSize: "0.9rem" }}>
            Cargando tus reservas...
          </p>
        )}

        {!loading && errorMsg && (
          <p style={{ color: "#ff9fbf", fontSize: "0.9rem" }}>{errorMsg}</p>
        )}

        {!loading && !errorMsg && reservas.length === 0 && (
          <motion.div
            style={emptyBox}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#ffe6f3" }}>
              Aún no tienes reservas registradas.
            </p>
            <motion.button
              style={primaryBtn}
              onClick={goReservar}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Hacer mi primera reserva 💥
            </motion.button>
          </motion.div>
        )}

        {!loading && !errorMsg && reservas.length > 0 && (
          <div style={layoutWithDetail}>
            {/* 🧱 Columna izquierda: listas de reservas */}
            <div style={listColumn}>
              {/* Próximas reservas */}
              <section style={sectionBlock}>
                <div style={sectionHeader}>
                  <h2 style={sectionTitle}>Próximas reservas</h2>
                  <span style={sectionChip}>
                    {futuras.length}{" "}
                    {futuras.length === 1 ? "reserva" : "reservas"}
                  </span>
                </div>

                {futuras.length === 0 ? (
                  <p style={sectionEmptyText}>
                    No tienes reservas futuras. ¡Agenda una y arma el partido! 🔥
                  </p>
                ) : (
                  <div style={listContainer}>
                    {futuras.map((r, index) => {
                      const isSelected =
                        detalleReserva && detalleReserva.id === r.id;
                      const styleCard = isSelected
                        ? {
                            ...reservaCard,
                            boxShadow:
                              "0 0 0 2px rgba(150,255,210,.9)",
                          }
                        : reservaCard;
                      return (
                        <motion.div
                          key={r.id}
                          style={styleCard}
                          onClick={() => setDetalleReserva(r)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: index * 0.03,
                          }}
                          whileHover={{
                            y: -2,
                            boxShadow: isSelected
                              ? "0 0 0 2px rgba(150,255,210,.9)"
                              : "0 0 12px rgba(150,255,210,.6)",
                          }}
                        >
                          <div style={reservaTopRow}>
                            <div>
                              <div style={canchaName}>
                                {r.cancha_nombre || "Cancha sin nombre"}
                              </div>
                              <div style={fechaText}>
                                {formatFechaLarga(r.fecha)} ·{" "}
                                {r.hora_inicio?.slice(0, 5)} –{" "}
                                {r.hora_fin?.slice(0, 5)}
                              </div>
                            </div>
                            <span style={estadoChipStyle(r.estado)}>
                              {r.estado || "sin estado"}
                            </span>
                          </div>

                          <div style={reservaBottomRow}>
                            <span style={ubicacionText}>
                              📍{" "}
                              {r.ubicacion || "Ubicación no especificada"}
                            </span>
                            <span style={montoText}>
                              {CLP.format(Number(r.monto_total || 0))}
                            </span>
                          </div>

                          {/* 🔥 Acción "Me falta uno" solo para futuras */}
                          <div style={reservaActionsRow}>
                            <motion.button
                              type="button"
                              style={meFaltaUnoBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAbrirModalPartido(r);
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.96 }}
                            >
                              Me falta uno / Publicar partido ⚽
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Historial de reservas pasadas */}
              <section style={sectionBlock}>
                <div style={sectionHeader}>
                  <h2 style={sectionTitle}>Historial</h2>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={sectionChip}>
                      {pasadas.length}{" "}
                      {pasadas.length === 1 ? "reserva" : "reservas"}
                    </span>
                    {pasadas.length > 0 && (
                      <motion.button
                        type="button"
                        style={clearAllBtn}
                        onClick={handleEliminarTodasPasadas}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        Borrar todo
                      </motion.button>
                    )}
                  </div>
                </div>

                {pasadas.length === 0 ? (
                  <p style={sectionEmptyText}>
                    Todavía no tienes historial de reservas.
                  </p>
                ) : (
                  <div style={listContainer}>
                    {pasadas.map((r, index) => {
                      const isSelected =
                        detalleReserva && detalleReserva.id === r.id;
                      const styleCard = isSelected
                        ? {
                            ...reservaCardPast,
                            boxShadow:
                              "0 0 0 2px rgba(255,105,180,.9)",
                          }
                        : reservaCardPast;
                      return (
                        <motion.div
                          key={r.id}
                          style={styleCard}
                          onClick={() => setDetalleReserva(r)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: index * 0.03,
                          }}
                          whileHover={{
                            y: -2,
                            boxShadow: isSelected
                              ? "0 0 0 2px rgba(255,105,180,.9)"
                              : "0 0 12px rgba(255,105,180,.6)",
                          }}
                        >
                          <div style={reservaTopRow}>
                            <div>
                              <div style={canchaName}>
                                {r.cancha_nombre || "Cancha sin nombre"}
                              </div>
                              <div style={fechaText}>
                                {formatFechaLarga(r.fecha)} ·{" "}
                                {r.hora_inicio?.slice(0, 5)} –{" "}
                                {r.hora_fin?.slice(0, 5)}
                              </div>
                            </div>
                            <span style={estadoChipStyle(r.estado)}>
                              {r.estado || "sin estado"}
                            </span>
                          </div>

                          <div style={reservaBottomRow}>
                            <span style={ubicacionText}>
                              📍{" "}
                              {r.ubicacion || "Ubicación no especificada"}
                            </span>
                            <span style={montoText}>
                              {CLP.format(Number(r.monto_total || 0))}
                            </span>
                          </div>

                          {/* 🗑 Botón borrar SOLO en historial */}
                          <div style={reservaActionsRow}>
                            <motion.button
                              type="button"
                              style={deleteOneBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminarReservaPasada(r.id);
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.96 }}
                            >
                              Borrar del historial 🗑
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* 🧱 Columna derecha: panel lateral de detalle */}
            <div style={detailColumn}>
              <AnimatePresence mode="wait">
                {detalleReserva ? (
                  <motion.section
                    key={detalleReserva.id}
                    style={detalleBlock}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={sectionHeader}>
                      <h2 style={sectionTitle}>Detalle de la reserva</h2>
                      <button
                        type="button"
                        style={detalleCloseBtn}
                        onClick={() => setDetalleReserva(null)}
                      >
                        Cerrar
                      </button>
                    </div>

                    <div style={detalleGrid}>
                      <div style={detalleRow}>
                        <span style={detalleLabel}>ID reserva</span>
                        <span style={detalleValue}>
                          #{detalleReserva.id}
                        </span>
                      </div>
                      <div style={detalleRow}>
                        <span style={detalleLabel}>Cancha</span>
                        <span style={detalleValue}>
                          {detalleReserva.cancha_nombre ||
                            "Cancha sin nombre"}
                        </span>
                      </div>
                      <div style={detalleRow}>
                        <span style={detalleLabel}>Ubicación</span>
                        <span style={detalleValue}>
                          {detalleReserva.ubicacion ||
                            "Ubicación no especificada"}
                        </span>
                      </div>
                      <div style={detalleRow}>
                        <span style={detalleLabel}>Fecha</span>
                        <span style={detalleValue}>
                          {formatFechaLarga(detalleReserva.fecha)}
                        </span>
                      </div>
                      <div style={detalleRow}>
                        <span style={detalleLabel}>Horario</span>
                        <span style={detalleValue}>
                          {detalleReserva.hora_inicio?.slice(0, 5)} –{" "}
                          {detalleReserva.hora_fin?.slice(0, 5)}
                        </span>
                      </div>
                      <div style={detalleRow}>
                        <span style={detalleLabel}>Estado</span>
                        <span style={detalleValue}>
                          {detalleReserva.estado || "sin estado"}
                        </span>
                      </div>
                      <div style={detalleRow}>
                        <span style={detalleLabel}>Monto total</span>
                        <span style={detalleValue}>
                          {CLP.format(
                            Number(detalleReserva.monto_total || 0)
                          )}
                        </span>
                      </div>
                    </div>

                    <div style={detalleButtonsRow}>
                      <motion.button
                        type="button"
                        style={detalleCanchaBtn}
                        onClick={() =>
                          navigate(`/cancha/${detalleReserva.cancha_id}`)
                        }
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        Ver cancha 🏟
                      </motion.button>
                    </div>

                    <p style={detalleHint}>
                      Más adelante aquí puedes agregar acciones como{" "}
                      <strong>ver comprobante</strong>,{" "}
                      <strong>cancelar</strong> o{" "}
                      <strong>repetir reserva</strong>.
                    </p>
                  </motion.section>
                ) : (
                  <motion.div
                    key="empty"
                    style={detalleEmptyBox}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p style={detalleEmptyText}>
                      Selecciona una reserva de la lista de la izquierda
                      para ver aquí todos los detalles.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>

      {/* 🧾 MODAL "ME FALTA UNO" */}
      <AnimatePresence>
        {modalPartidoOpen && reservaSeleccionada && (
          <motion.div
            style={modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={modalCard}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div style={modalHeader}>
                <h2 style={modalTitle}>
                  Publicar partido desde esta reserva
                </h2>
                <button style={modalCloseBtn} onClick={handleCerrarModal}>
                  ✕
                </button>
              </div>

              <p style={modalSubtext}>
                Publica este partido para que otros jugadores lo
                encuentren en <strong>“Buscar partido”</strong>.
              </p>

              <div style={modalReservaBox}>
                <div style={modalReservaLine}>
                  <span style={modalReservaLabel}>Cancha</span>
                  <span style={modalReservaValue}>
                    {reservaSeleccionada.cancha_nombre ||
                      "Cancha sin nombre"}
                  </span>
                </div>
                <div style={modalReservaLine}>
                  <span style={modalReservaLabel}>Fecha</span>
                  <span style={modalReservaValue}>
                    {formatFechaLarga(reservaSeleccionada.fecha)}
                  </span>
                </div>
                <div style={modalReservaLine}>
                  <span style={modalReservaLabel}>Horario</span>
                  <span style={modalReservaValue}>
                    {reservaSeleccionada.hora_inicio?.slice(0, 5)} –{" "}
                    {reservaSeleccionada.hora_fin?.slice(0, 5)}
                  </span>
                </div>
                <div style={modalReservaLine}>
                  <span style={modalReservaLabel}>Ubicación</span>
                  <span style={modalReservaValue}>
                    {reservaSeleccionada.ubicacion ||
                      "Ubicación no especificada"}
                  </span>
                </div>
              </div>

              <div style={modalFieldGroup}>
                <label style={modalLabel}>Vacantes disponibles</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={vacantes}
                  onChange={(e) =>
                    setVacantes(Math.max(1, Number(e.target.value) || 1))
                  }
                  style={modalInput}
                  disabled={publicando}
                />
                <p style={modalHint}>
                  Ej: si te faltan 2 jugadores, coloca{" "}
                  <strong>2</strong>.
                </p>
              </div>

              <div style={modalFieldGroup}>
                <label style={modalLabel}>Descripción del partido</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  style={modalTextarea}
                  placeholder="Ej: Partido tranqui, nivel intermedio, pasto sintético, traer camiseta blanca..."
                  disabled={publicando}
                />
              </div>

              <div style={modalButtonsRow}>
                <motion.button
                  style={modalPrimaryBtn}
                  onClick={handlePublicarPartido}
                  disabled={publicando}
                  whileHover={{ scale: publicando ? 1 : 1.03 }}
                  whileTap={{ scale: publicando ? 1 : 0.96 }}
                >
                  {publicando ? "Publicando..." : "Publicar partido ⚽"}
                </motion.button>
                <motion.button
                  style={modalGhostBtn}
                  onClick={handleCerrarModal}
                  disabled={publicando}
                  whileHover={{ scale: publicando ? 1 : 1.03 }}
                  whileTap={{ scale: publicando ? 1 : 0.96 }}
                >
                  Cancelar
                </motion.button>
              </div>

              <p style={modalFooterNote}>
                Este partido se guarda en la tabla <code>partidos</code> y
                luego lo listamos en{" "}
                <strong>Buscar partido / Resultados</strong>.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===== estilos inline (Ballantines) ===== */

const pageBg = {
  minHeight: "100vh",
  padding: "90px 16px 32px",
  backgroundImage:
    "linear-gradient(130deg, rgba(0,0,0,.97), rgba(20,0,30,.95), rgba(60,0,80,.9))",
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex",
  justifyContent: "center",
  position: "relative",
};

const card = {
  width: "100%",
  maxWidth: 1050,
  background: "rgba(0,0,0,.9)",
  borderRadius: 24,
  padding: 24,
  border: "1px solid rgba(255,105,180,.5)",
  boxShadow: "0 22px 60px rgba(0,0,0,.95)",
  backdropFilter: "blur(10px)",
};

/* Botón Inicio */
const homeBtn = {
  position: "absolute",
  top: 24,
  left: 24,
  cursor: "pointer",
  color: "#ffb3e1",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: "bold",
  zIndex: 20,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,0.8)",
  background:
    "radial-gradient(circle at top left, rgba(255,105,180,.25), rgba(0,0,0,.95))",
  fontSize: "0.85rem",
};

const topRow = {
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  columnGap: 12,
  marginBottom: 16,
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
  fontSize: "1.5rem",
  textAlign: "center",
  color: "#ff79c4",
  textShadow: "0 0 16px rgba(255,105,180,.9)",
};

const primaryMiniBtn = {
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

const emptyBox = {
  marginTop: 16,
  padding: 16,
  borderRadius: 16,
  background: "rgba(20,0,30,.9)",
  border: "1px dashed rgba(255,105,180,.5)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  alignItems: "flex-start",
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

const sectionBlock = {
  borderRadius: 18,
  padding: 14,
  background:
    "linear-gradient(145deg, rgba(18,0,26,.96), rgba(0,0,0,.98))",
  border: "1px solid rgba(255,105,180,.3)",
  color: "#ffe6f3",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
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

const sectionEmptyText = {
  margin: 0,
  fontSize: "0.88rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

const listContainer = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginTop: 2,
};

const reservaCard = {
  borderRadius: 14,
  padding: 10,
  background: "rgba(10,30,20,.95)",
  border: "1px solid rgba(150,255,210,.6)",
  cursor: "pointer",
  transition: "transform .15s ease, box-shadow .15s ease",
};

const reservaCardPast = {
  borderRadius: 14,
  padding: 10,
  background: "rgba(22,0,30,.95)",
  border: "1px solid rgba(255,105,180,.4)",
  cursor: "pointer",
  transition: "transform .15s ease, box-shadow .15s ease",
};

const reservaTopRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const reservaBottomRow = {
  marginTop: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const reservaActionsRow = {
  marginTop: 8,
  display: "flex",
  justifyContent: "flex-end",
};

const canchaName = {
  fontSize: "0.95rem",
  fontWeight: 700,
  color: "#c8ffe8",
};

const fechaText = {
  fontSize: "0.8rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

const ubicacionText = {
  fontSize: "0.8rem",
  color: "#e4fdf4",
  opacity: 0.9,
};

const montoText = {
  fontSize: "0.9rem",
  fontWeight: 700,
  color: "#b4ffe3",
};

const meFaltaUnoBtn = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid rgba(150,255,210,.9)",
  background:
    "linear-gradient(135deg, rgba(0,40,20,.96), rgba(5,0,20,.96))",
  color: "#b4ffe3",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "0.04em",
};

const clearAllBtn = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.7)",
  background: "rgba(60,0,40,.95)",
  color: "#ffd5ec",
  fontSize: "0.78rem",
  cursor: "pointer",
  fontWeight: 600,
};

const deleteOneBtn = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,120,150,.9)",
  background: "rgba(80,0,30,.96)",
  color: "#ffd5ec",
  fontSize: "0.78rem",
  cursor: "pointer",
  fontWeight: 600,
};

/* ===== layout para panel lateral (como MisPartidos) ===== */

const layoutWithDetail = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1.1fr)",
  gap: 18,
  alignItems: "flex-start",
  marginTop: 10,
};

const listColumn = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const detailColumn = {
  position: "relative",
};

/* ===== detalle reserva estilos ===== */

const detalleBlock = {
  borderRadius: 18,
  padding: 14,
  background:
    "linear-gradient(145deg, rgba(6,0,20,.96), rgba(0,0,0,.98))",
  border: "1px solid rgba(150,255,210,.4)",
  color: "#eafff6",
  position: "sticky",
  top: 80,
};

const detalleGrid = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginTop: 4,
  fontSize: "0.85rem",
};

const detalleRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};

const detalleLabel = {
  opacity: 0.85,
};

const detalleValue = {
  fontWeight: 600,
  textAlign: "right",
};

const detalleButtonsRow = {
  marginTop: 10,
  display: "flex",
  justifyContent: "flex-end",
};

const detalleCanchaBtn = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid rgba(150,255,210,.9)",
  background: "linear-gradient(135deg, #6dffbf, #c9ffe6)",
  color: "#02150b",
  fontWeight: 700,
  fontSize: "0.8rem",
  cursor: "pointer",
  letterSpacing: "0.04em",
};

const detalleHint = {
  marginTop: 6,
  fontSize: "0.78rem",
  color: "rgba(210,255,238,.88)",
  fontStyle: "italic",
};

const detalleCloseBtn = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.7)",
  background: "transparent",
  color: "#ffd5ec",
  fontSize: "0.78rem",
  cursor: "pointer",
  fontWeight: 600,
};

const detalleEmptyBox = {
  borderRadius: 18,
  padding: 14,
  background:
    "linear-gradient(145deg, rgba(10,0,25,.96), rgba(0,0,0,.98))",
  border: "1px dashed rgba(255,105,180,.6)",
  color: "#ffe6f3",
  fontSize: "0.86rem",
  position: "sticky",
  top: 80,
};

const detalleEmptyText = {
  margin: 0,
  opacity: 0.9,
};

/* ===== Modal estilos ===== */

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "16px",
};

const modalCard = {
  width: "100%",
  maxWidth: 560,
  background:
    "linear-gradient(145deg, rgba(12,0,22,.98), rgba(0,0,0,.98))",
  borderRadius: 20,
  padding: 20,
  border: "1px solid rgba(255,105,180,.6)",
  boxShadow: "0 20px 60px rgba(0,0,0,.95)",
  color: "#ffe6f3",
};

const modalHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const modalTitle = {
  margin: 0,
  fontSize: "1.2rem",
  color: "#ffb3e1",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const modalCloseBtn = {
  border: "none",
  background: "transparent",
  color: "#ffd5ec",
  fontSize: "1rem",
  cursor: "pointer",
};

const modalSubtext = {
  marginTop: 6,
  fontSize: "0.85rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

const modalReservaBox = {
  marginTop: 12,
  padding: 10,
  borderRadius: 12,
  background: "rgba(0,0,0,.7)",
  border: "1px solid rgba(150,255,210,.7)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: "0.85rem",
};

const modalReservaLine = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};

const modalReservaLabel = {
  opacity: 0.8,
};

const modalReservaValue = {
  fontWeight: 600,
};

const modalFieldGroup = {
  marginTop: 14,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const modalLabel = {
  fontSize: "0.85rem",
  color: "#ffd5ec",
};

const modalInput = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,105,180,.7)",
  background: "rgba(0,0,0,.8)",
  color: "#fff",
  outline: "none",
  fontSize: "0.9rem",
  maxWidth: 120,
};

const modalTextarea = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,105,180,.7)",
  background: "rgba(0,0,0,.8)",
  color: "#fff",
  outline: "none",
  fontSize: "0.9rem",
  minHeight: 80,
  resize: "vertical",
};

const modalHint = {
  margin: 0,
  fontSize: "0.78rem",
  color: "rgba(210,255,238,.88)",
  fontStyle: "italic",
};

const modalButtonsRow = {
  marginTop: 16,
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "flex-end",
};

const modalPrimaryBtn = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #6dffbf, #c9ffe6, #6dffbf)",
  color: "#02150b",
  fontWeight: 800,
  fontSize: "0.9rem",
  cursor: "pointer",
  letterSpacing: "0.05em",
  boxShadow: "0 0 14px rgba(109,255,191,.7)",
};

const modalGhostBtn = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.7)",
  background: "transparent",
  color: "#ffd5ec",
  fontWeight: 600,
  fontSize: "0.86rem",
  cursor: "pointer",
};

const modalFooterNote = {
  marginTop: 10,
  fontSize: "0.78rem",
  color: "rgba(210,255,238,.88)",
  fontStyle: "italic",
};
