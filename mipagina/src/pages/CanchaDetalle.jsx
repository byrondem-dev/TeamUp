// src/pages/CanchaDetalle.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Api } from "../api";

// ===== helpers =====
function addMinutesToTime(timeStr, minutes) {
  if (!timeStr) return "";
  const [hh, mm] = timeStr.split(":").map(Number);
  const d = new Date(2000, 0, 1, hh, mm || 0, 0, 0);
  d.setMinutes(d.getMinutes() + minutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function buildHourlySlots(inicio, fin, stepMin = 60) {
  if (!inicio || !fin) return [];
  const slots = [];
  let cur = inicio;
  for (let i = 0; i < 48; i++) {
    if (cur >= fin) break;
    slots.push(cur);
    cur = addMinutesToTime(cur, stepMin);
  }
  return slots;
}

function parseYMD(ymd) {
  const [y, m, d] = (ymd || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function dateToDayKey(ymd) {
  const dt = parseYMD(ymd);
  const g = dt.getDay(); // 0=Dom..6=Sáb
  const map = ["D", "L", "M", "X", "J", "V", "S"];
  return map[g] || "L";
}

function formatFechaLarga(ymd) {
  const d = parseYMD(ymd);
  try {
    return d.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return ymd;
  }
}

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export default function CanchaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const canchaFromState = location.state?.cancha || null;

  const [cancha, setCancha] = useState(canchaFromState);
  const [loadingCancha, setLoadingCancha] = useState(!canchaFromState);
  const [errorCancha, setErrorCancha] = useState("");

  const [fecha, setFecha] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(t.getDate()).padStart(2, "0")}`;
  });

  const [ocupacion, setOcupacion] = useState([]); // reservas + partidos
  const [loadingOcup, setLoadingOcup] = useState(false);

  // selección varios tramos
  const [slotsSeleccionados, setSlotsSeleccionados] = useState([]); // array de horas
  const [reservaConfirmada, setReservaConfirmada] = useState(false);

  // 🔍 Log de render para ver id, loading y cancha
  console.log(
    "[RENDER CanchaDetalle] id:",
    id,
    "| loadingCancha:",
    loadingCancha,
    "| cancha:",
    cancha
  );

  // 🔥 Traer la cancha completa del backend por ID (una sola vez por id)
  useEffect(() => {
    console.log("[EFFECT detalle] se ejecuta con id:", id);

    if (!id) {
      console.warn(
        "[EFFECT detalle] No hay id (undefined/null/''), no se pide cancha"
      );
      return;
    }

    (async () => {
      try {
        setLoadingCancha(true);
        setErrorCancha("");
        console.log("[EFFECT detalle] Pidiendo detalle de cancha", id);
        const data = await Api.canchaDetalle(Number(id));
        console.log("[EFFECT detalle] Detalle cancha respuesta:", data);
        setCancha((prev) => (prev ? { ...prev, ...data } : data));
      } catch (err) {
        console.error("[EFFECT detalle] CANCHA DETALLE ERROR:", err);
        setErrorCancha(
          err.message || "No se pudo cargar la información de la cancha."
        );
        setCancha(null);
      } finally {
        console.log(
          "[EFFECT detalle] Terminó petición detalle, se setea loadingCancha=false"
        );
        setLoadingCancha(false);
      }
    })();
  }, [id]);

  // cargar horas ocupadas para esa fecha
  useEffect(() => {
    console.log("[EFFECT ocupacion] se ejecuta con id:", id, "fecha:", fecha);

    if (!id) {
      console.warn(
        "[EFFECT ocupacion] No hay id (undefined/null/''), no se pide ocupación"
      );
      return;
    }

    (async () => {
      setLoadingOcup(true);
      try {
        const data = await Api.ocupacionCancha({
          cancha_id: Number(id),
          fecha,
        });
        console.log("[EFFECT ocupacion] respuesta ocupación:", data);
        setOcupacion(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[EFFECT ocupacion] ERROR:", err);
        setOcupacion([]);
      } finally {
        console.log(
          "[EFFECT ocupacion] Terminó petición ocupación, loadingOcup=false"
        );
        setLoadingOcup(false);
      }
    })();
  }, [id, fecha]);

  // si cambias la fecha, se limpia la selección estética
  useEffect(() => {
    console.log(
      "[EFFECT fecha] Cambio de fecha a:",
      fecha,
      " → limpiando selección y reservaConfirmada"
    );
    setSlotsSeleccionados([]);
    setReservaConfirmada(false);
  }, [fecha]);

  const dayKey = useMemo(() => {
    const k = dateToDayKey(fecha);
    console.log("[MEMO dayKey] fecha:", fecha, "→ dayKey:", k);
    return k;
  }, [fecha]);

  // 👉 SOLO usamos lo que venga de cancha.disponibilidad
  const baseDia = useMemo(() => {
    const disp = cancha?.disponibilidad;
    if (!disp) {
      console.log("[MEMO baseDia] cancha.disponibilidad vacío o undefined");
      return null;
    }
    const d = disp[dayKey];
    if (!d) {
      console.log("[MEMO baseDia] No hay config para dayKey:", dayKey);
      return null;
    }
    if (d.habilitado === false) {
      console.log("[MEMO baseDia] Día no habilitado:", dayKey, d);
      return { habilitado: false };
    }
    if (!d.inicio || !d.fin) {
      console.log(
        "[MEMO baseDia] Falta inicio o fin en disponibilidad del día:",
        dayKey,
        d
      );
      return null;
    }
    const base = {
      habilitado: d.habilitado ?? true,
      inicio: d.inicio,
      fin: d.fin,
    };
    console.log("[MEMO baseDia] baseDia calculado:", base);
    return base;
  }, [cancha, dayKey]);

  const slots = useMemo(() => {
    if (!baseDia || !baseDia.habilitado || !baseDia.inicio || !baseDia.fin) {
      console.log(
        "[MEMO slots] No se generan slots porque baseDia es inválido:",
        baseDia
      );
      return [];
    }
    const s = buildHourlySlots(baseDia.inicio, baseDia.fin, 60);
    console.log(
      "[MEMO slots] Slots generados para",
      baseDia.inicio,
      "→",
      baseDia.fin,
      ":",
      s
    );
    return s;
  }, [baseDia]);

  const esOcupado = (inicio) => {
    const fin = addMinutesToTime(inicio, 60);
    return ocupacion.some((o) => {
      const oIni = (o.hora_inicio || "").slice(0, 5);
      const oFin = (o.hora_fin || "").slice(0, 5);
      return oIni < fin && oFin > inicio;
    });
  };

  const handleConfirmarEstetico = () => {
    console.log(
      "[ACCION] Confirmar reserva estética. Slots seleccionados:",
      slotsSeleccionados
    );
    if (slotsSeleccionados.length === 0) return;
    setReservaConfirmada(true);
  };

  // ===== estados de carga / error de CANCHA =====
  if (loadingCancha) {
    console.log("[RENDER] Mostrando loader de cancha...");
    return (
      <div style={pageBg}>
        <div style={loaderCard}>
          <p style={{ color: "#fff", fontSize: "0.95rem" }}>
            Cargando cancha...
          </p>
        </div>
      </div>
    );
  }

  if (!cancha || errorCancha) {
    console.log(
      "[RENDER] Error o cancha nula. errorCancha:",
      errorCancha,
      "cancha:",
      cancha
    );
    return (
      <div style={pageBg}>
        <div style={loaderCard}>
          <p style={{ color: "#ffb3c7", fontSize: "0.95rem" }}>
            {errorCancha || "No se pudo cargar la cancha."}
          </p>
          <button style={backBtn} onClick={() => navigate(-1)}>
            ⬅ Volver
          </button>
        </div>
      </div>
    );
  }

  // ===== resto de la lógica normal =====

  const precioNumero = Number(cancha.precio || cancha.precio_base || 0);
  const precioMostrar = CLP.format(precioNumero);
  const fechaBonita = formatFechaLarga(fecha);

  const horasSeleccionadasCount = slotsSeleccionados.length;

  let horaInicioSeleccionada = "";
  let horaFinSeleccionada = "";

  if (horasSeleccionadasCount > 0) {
    const ordenados = [...slotsSeleccionados].sort();
    horaInicioSeleccionada = ordenados[0];
    const last = ordenados[ordenados.length - 1];
    horaFinSeleccionada = addMinutesToTime(last, 60);
  }

  const montoTotal = precioNumero * horasSeleccionadasCount;
  const montoTotalMostrar =
    horasSeleccionadasCount > 0 ? CLP.format(montoTotal) : precioMostrar;

  const tieneHorario =
    !!baseDia && baseDia.habilitado && baseDia.inicio && baseDia.fin;

  const handleIrAPagar = () => {
    console.log(
      "[ACCION] Ir a pagar. Confirmada:",
      reservaConfirmada,
      "slots:",
      slotsSeleccionados,
      "fecha:",
      fecha
    );
    if (horasSeleccionadasCount === 0) return;

    navigate("/pago-reserva", {
      state: {
        canchaId: cancha.id,
        nombreCancha: cancha.nombre,
        fecha,
        fechaBonita,
        hora_inicio: horaInicioSeleccionada,
        hora_fin: horaFinSeleccionada,
        monto: montoTotal,
        montoFormateado: montoTotalMostrar,
        ubicacion:
          cancha.direccion || cancha.ubicacion || "Ubicación no especificada",
        foto:
          cancha.img ||
          cancha.foto ||
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop",
        tramos: slotsSeleccionados,
      },
    });
  };

  return (
    <div style={pageBg}>
      <div style={detailCard}>
        {/* Barra superior */}
        <div style={topRow}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            ⬅ Volver
          </button>

          <div style={{ textAlign: "right" }}>
            <div style={topLabel}>Detalle de cancha</div>
            <h1 style={titleText}>{cancha.nombre}</h1>
          </div>
        </div>

        {/* Contenido principal */}
        <div style={mainRow}>
          {/* Columna izquierda */}
          <div style={leftCol}>
            <div style={photoCard}>
              <img
                src={
                  cancha.img ||
                  cancha.foto ||
                  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop"
                }
                alt={cancha.nombre}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div style={priceBadge}>{precioMostrar} / hora</div>
            </div>

            <div style={infoCard}>
              <div style={infoRow}>
                <span style={infoIcon}>📍</span>
                <span>
                  {cancha.direccion ||
                    cancha.ubicacion ||
                    "Ubicación no especificada"}
                </span>
              </div>

              {cancha.telefono && (
                <div style={infoRow}>
                  <span style={infoIcon}>📞</span>
                  <span>{cancha.telefono}</span>
                </div>
              )}

              <div style={infoRow}>
                <span style={infoIcon}>💰</span>
                <span>{precioMostrar}</span>
              </div>

              {cancha.tipo && (
                <div style={infoRow}>
                  <span style={infoIcon}>⚽</span>
                  <span>Tipo de cancha: {cancha.tipo}</span>
                </div>
              )}

              {cancha.descripcion && (
                <p style={descripcionText}>{cancha.descripcion}</p>
              )}
            </div>
          </div>

          {/* Columna derecha: disponibilidad */}
          <div style={rightCol}>
            {/* Fecha + horario base */}
            <div style={sectionCard}>
              <div style={sectionHeader}>
                <h2 style={sectionTitle}>Disponibilidad</h2>
                <span style={dateChip}>{fechaBonita}</span>
              </div>

              <div style={dateRow}>
                <label style={dateLabel}>Elegir día</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  style={inputBase}
                />
              </div>

              <div style={{ marginTop: 12, color: "#ffe6f3" }}>
                {tieneHorario ? (
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>
                    🕒 Horario base este día:{" "}
                    <strong>
                      {baseDia.inicio} – {baseDia.fin}
                    </strong>
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>
                    🕒 No hay horario configurado para este día.
                  </p>
                )}
              </div>
            </div>

            {/* Slots horarios */}
            {tieneHorario && (
              <>
                <div style={sectionCard}>
                  <div style={sectionHeader}>
                    <h3 style={sectionTitleSmall}>Tramos de 1 hora</h3>
                    <div style={legendRow}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={legendDotLibre} /> Libre
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={legendDotOcupado} /> Ocupado
                      </span>
                    </div>
                  </div>

                  <div style={slotsGrid}>
                    {slots.map((h) => {
                      const ocupado = esOcupado(h);
                      const fin = addMinutesToTime(h, 60);
                      const seleccionado =
                        !ocupado && slotsSeleccionados.includes(h);

                      return (
                        <div
                          key={h}
                          onClick={() => {
                            if (ocupado) return;
                            setReservaConfirmada(false);
                            setSlotsSeleccionados((prev) => {
                              if (prev.includes(h)) {
                                return prev.filter((x) => x !== h);
                              }
                              return [...prev, h].sort();
                            });
                          }}
                          style={{
                            ...slotPill,
                            background: ocupado
                              ? "rgba(255,80,120,.18)"
                              : seleccionado
                              ? "linear-gradient(135deg,#ff61b6,#ffb3e1)"
                              : "rgba(96,255,190,.13)",
                            border: ocupado
                              ? "1px solid rgba(255,120,150,.95)"
                              : seleccionado
                              ? "1px solid rgba(255,255,255,.9)"
                              : "1px solid rgba(150,255,210,.9)",
                            color: ocupado
                              ? "#ffc5d0"
                              : seleccionado
                              ? "#2b0018"
                              : "#d8ffe9",
                            cursor: ocupado ? "not-allowed" : "pointer",
                            opacity: ocupado ? 0.45 : 1,
                            transform: seleccionado
                              ? "translateY(-1px) scale(1.02)"
                              : "translateY(0) scale(1)",
                            boxShadow: seleccionado
                              ? "0 0 16px rgba(255,105,180,.7)"
                              : "0 0 0 rgba(0,0,0,0)",
                          }}
                        >
                          {h}–{fin} {ocupado ? "⛔" : seleccionado ? "⭐" : "✅"}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tarjeta de "reserva" estética + paso pago */}
                {slotsSeleccionados.length > 0 && (
                  <div style={selectionCard}>
                    <div style={sectionHeader}>
                      <h3 style={selectionTitle}>Tu reserva estética</h3>
                      <span style={pillTag}>Paso 2: confirmar</span>
                    </div>

                    <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>
                      <strong>{fechaBonita}</strong> ·{" "}
                      <strong>
                        {horaInicioSeleccionada} – {horaFinSeleccionada}
                      </strong>{" "}
                      ·{" "}
                      <strong>
                        {slotsSeleccionados.length} hora
                        {slotsSeleccionados.length > 1 ? "s" : ""}
                      </strong>{" "}
                      · <strong>{montoTotalMostrar}</strong>
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "0.8rem",
                        opacity: 0.9,
                      }}
                    >
                      Tramos: {slotsSeleccionados.sort().join(", ")}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 10,
                      }}
                    >
                      <button
                        type="button"
                        style={primaryBtn}
                        onClick={handleConfirmarEstetico}
                      >
                        Confirmar reserva
                      </button>
                      <button
                        type="button"
                        style={ghostBtn}
                        onClick={() => {
                          setSlotsSeleccionados([]);
                          setReservaConfirmada(false);
                        }}
                      >
                        Limpiar selección
                      </button>
                    </div>

                    {reservaConfirmada && (
                      <div style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          style={payBtn}
                          onClick={handleIrAPagar}
                        >
                          Ir a pagar 💳
                        </button>
                      </div>
                    )}

                    <p style={tinyNote}>
                      {reservaConfirmada
                        ? "✨ Reserva simulada lista con varias horas. Ahora te llevamos al paso de pago (cuando lo conectes al backend)."
                        : "Por ahora es solo visual: después aquí se conectará la reserva real + pago."}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Lista reservas / partidos */}
            <div style={sectionCard}>
              <h3 style={sectionTitleSmall}>Reservas y partidos del día</h3>

              {loadingOcup && (
                <p style={{ color: "#ffe6f3", fontSize: "0.9rem" }}>
                  Cargando...
                </p>
              )}

              {!loadingOcup && ocupacion.length === 0 && (
                <p style={{ color: "#ffe6f3", fontSize: "0.9rem" }}>
                  No hay reservas ni partidos para este día.
                </p>
              )}

              {!loadingOcup && ocupacion.length > 0 && (
                <div style={ocupacionList}>
                  {ocupacion.map((o, idx) => (
                    <div key={idx} style={ocupacionRow}>
                      <span style={{ fontWeight: 600 }}>
                        {o.hora_inicio?.slice(0, 5)}–
                        {o.hora_fin?.slice(0, 5)}
                      </span>
                      <span style={{ opacity: 0.85, fontSize: "0.85rem" }}>
                        {o.tipo === "partido" ? "Partido publicado" : "Reserva"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* === estilos === */

const pageBg = {
  minHeight: "100vh",
  padding: "90px 16px 32px",
  backgroundImage:
    'linear-gradient(120deg, rgba(0,0,0,.96), rgba(10,0,20,.92)), url("https://e00-xlk-ue-marca.uecdn.es/uploads/2025/03/30/67e8ec71c293f.jpeg")',
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const loaderCard = {
  maxWidth: 420,
  margin: "120px auto 0",
  padding: 20,
  borderRadius: 16,
  background: "rgba(0,0,0,.82)",
  border: "1px solid rgba(255,105,180,.4)",
  textAlign: "center",
};

const detailCard = {
  maxWidth: 1150,
  margin: "0 auto",
  background: "rgba(0,0,0,.88)",
  borderRadius: 24,
  padding: 24,
  border: "1px solid rgba(255,105,180,.45)",
  boxShadow: "0 22px 60px rgba(0,0,0,.9)",
  backdropFilter: "blur(8px)",
};

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 20,
};

const backBtn = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.6)",
  background:
    "radial-gradient(circle at top left, rgba(255,105,180,.25), rgba(0,0,0,.9))",
  color: "#ffe6f3",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
};

const topLabel = {
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "rgba(255,192,222,.9)",
};

const titleText = {
  margin: 0,
  fontSize: "1.7rem",
  color: "#ff79c4",
  textShadow: "0 0 14px rgba(255,105,180,.7)",
};

const mainRow = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1.6fr)",
  gap: 24,
  alignItems: "flex-start",
};

const leftCol = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const rightCol = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const photoCard = {
  position: "relative",
  borderRadius: 18,
  overflow: "hidden",
  height: 210,
  boxShadow: "0 18px 40px rgba(0,0,0,.85)",
};

const priceBadge = {
  position: "absolute",
  bottom: 12,
  right: 12,
  padding: "6px 12px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #ff61b6, #ffb3e1, #ff61b6)",
  color: "#2b0018",
  fontWeight: 800,
  fontSize: "0.8rem",
  letterSpacing: "0.03em",
};

const infoCard = {
  borderRadius: 18,
  padding: 14,
  background:
    "linear-gradient(145deg, rgba(15,0,20,.96), rgba(5,0,10,.96))",
  border: "1px solid rgba(255,105,180,.28)",
  color: "#ffe6f3",
  fontSize: "0.9rem",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const infoRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const infoIcon = {
  fontSize: "1.05rem",
};

const descripcionText = {
  marginTop: 8,
  fontSize: "0.86rem",
  lineHeight: 1.4,
  color: "rgba(255,230,243,.92)",
};

const sectionCard = {
  borderRadius: 18,
  padding: 14,
  background:
    "linear-gradient(145deg, rgba(18,0,26,.96), rgba(0,0,0,.98))",
  border: "1px solid rgba(255,105,180,.28)",
  color: "#ffe6f3",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 6,
};

const sectionTitle = {
  margin: 0,
  fontSize: "1rem",
  color: "#ff79c4",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const sectionTitleSmall = {
  margin: 0,
  fontSize: "0.95rem",
  color: "#ff79c4",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const dateChip = {
  fontSize: "0.75rem",
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(255,105,180,.16)",
  border: "1px solid rgba(255,105,180,.5)",
  textTransform: "capitalize",
};

const dateRow = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginTop: 4,
};

const dateLabel = {
  fontSize: "0.8rem",
  color: "#ffd1e8",
};

const inputBase = {
  padding: "7px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,105,180,.6)",
  background: "rgba(15,0,25,.88)",
  color: "#fff",
  outline: "none",
  fontSize: "0.9rem",
};

const slotsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: 8,
  marginTop: 8,
};

const slotPill = {
  padding: "7px 10px",
  borderRadius: 999,
  fontSize: "0.83rem",
  fontWeight: 700,
  textAlign: "center",
  transition: "transform .08s ease-out, box-shadow .08s ease-out",
  boxShadow: "0 0 0 rgba(0,0,0,0)",
};

const legendRow = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  fontSize: "0.8rem",
  color: "#ffd1e8",
};

const legendDotLibre = {
  width: 12,
  height: 12,
  borderRadius: 999,
  background: "linear-gradient(135deg,#6dffbf,#c9ffe6)",
};

const legendDotOcupado = {
  width: 12,
  height: 12,
  borderRadius: 999,
  background: "linear-gradient(135deg,#ff6b9b,#ffb3c7)",
};

const ocupacionList = {
  marginTop: 6,
  maxHeight: 230,
  overflowY: "auto",
  paddingRight: 6,
};

const ocupacionRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid rgba(255,255,255,.06)",
};

const selectionCard = {
  ...sectionCard,
  border: "1px solid rgba(150,255,210,.7)",
  background:
    "linear-gradient(145deg, rgba(0,20,10,.98), rgba(5,0,15,.98))",
  marginTop: 6,
};

const selectionTitle = {
  ...sectionTitleSmall,
  color: "#a5ffda",
};

const pillTag = {
  fontSize: "0.7rem",
  padding: "3px 9px",
  borderRadius: 999,
  border: "1px solid rgba(165,255,218,.9)",
  background: "rgba(10,50,40,.8)",
  color: "#cffff0",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const primaryBtn = {
  padding: "7px 16px",
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

const ghostBtn = {
  padding: "7px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.6)",
  background: "transparent",
  color: "#ffd1e8",
  fontWeight: 600,
  fontSize: "0.85rem",
  cursor: "pointer",
};

const tinyNote = {
  marginTop: 8,
  fontSize: "0.78rem",
  color: "rgba(210,255,238,.88)",
  fontStyle: "italic",
};

const payBtn = {
  padding: "8px 18px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg, #6dffbf, #c9ffe6, #6dffbf)",
  color: "#02150b",
  fontWeight: 800,
  fontSize: "0.9rem",
  cursor: "pointer",
  letterSpacing: "0.05em",
  boxShadow: "0 0 14px rgba(109,255,191,.7)",
};
