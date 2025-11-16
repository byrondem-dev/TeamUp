// src/pages/ReservarCancha.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api";
import { Home } from "lucide-react";
import { motion } from "framer-motion";

// ==== Orden días ====
const DAY_ORDER = ["L", "M", "X", "J", "V", "S", "D"];
const DAY_LABEL = {
  L: "Lun",
  M: "Mar",
  X: "Mié",
  J: "Jue",
  V: "Vie",
  S: "Sáb",
  D: "Dom",
};

// ==== Fechas ====
const parseYMD = (ymd) => {
  const [y, m, d] = (ymd || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const diaSemana = (ymd) =>
  parseYMD(ymd).toLocaleDateString("es-CL", { weekday: "long" });

const fechaCorta = (ymd) =>
  parseYMD(ymd).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// convierte fecha en clave de día (L,M,X...)
function dateToDayKey(ymd) {
  const dt = parseYMD(ymd);
  const g = dt.getDay(); // 0 domingo
  const map = ["D", "L", "M", "X", "J", "V", "S"];
  return map[g] || "L";
}

// ==== Manipulación de horas ====
function addMinutesToTime(timeStr, minutes) {
  if (!timeStr) return "";
  const [hh, mm] = timeStr.split(":").map(Number);
  const d = new Date(2000, 0, 1, hh, mm || 0);
  d.setMinutes(d.getMinutes() + minutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

// HH:MM (24h) -> "hh:mm AM/PM"
function formatTimeTo12h(hhmm) {
  if (!hhmm) return "";
  const [H, M] = hhmm.split(":").map(Number);
  if (isNaN(H) || isNaN(M)) return "";
  const mer = H >= 12 ? "PM" : "AM";
  let h12 = H % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, "0")}:${String(M).padStart(
    2,
    "0"
  )} ${mer}`;
}

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

/* ****************************************************
   HORA PICKER ESTILO IPHONE (RUEDA)
**************************************************** */
function HoraPicker({ value, onChange }) {
  // Listas base (1–12, 0–59, AM/PM)
  const horas12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
  const minutosBase = Array.from({ length: 60 }, (_, i) => i); // 0..59
  const ampm = ["AM", "PM"];

  // Para simular rueda larga, repetimos varias veces
  const LOOP = 5;
  const LOOP_AMPM = 7;
  const ITEM_HEIGHT = 40;

  const horasLoop = [];
  for (let i = 0; i < LOOP; i++) horasLoop.push(...horas12);

  const minutosLoop = [];
  for (let i = 0; i < LOOP; i++) minutosLoop.push(...minutosBase);

  const ampmLoop = [];
  for (let i = 0; i < LOOP_AMPM; i++) ampmLoop.push(...ampm);

  const [hh12, setHh12] = useState(10);
  const [mm, setMm] = useState(0);
  const [meridiano, setMeridiano] = useState("PM");

  const horasRef = useRef(null);
  const minutosRef = useRef(null);
  const ampmRef = useRef(null);

  // Convierte 12h + AM/PM a 24h (00–23) y avisa al padre
  const actualizarHora = (nuevoH12, nuevoMin, nuevoMeridiano) => {
    let h24 = nuevoH12 % 12;
    if (nuevoMeridiano === "PM") h24 += 12;
    if (h24 === 24) h24 = 12; // seguridad

    const salida = `${String(h24).padStart(2, "0")}:${String(
      nuevoMin
    ).padStart(2, "0")}`;
    onChange(salida);
  };

  // Centrar scroll en el bloque del medio
  const centrarScroll = (ref, baseLen, loopCount, baseIndex) => {
    if (!ref.current || baseIndex < 0) return;
    const middleBlock = Math.floor(loopCount / 2);
    const index = middleBlock * baseLen + baseIndex;
    ref.current.scrollTop = index * ITEM_HEIGHT;
  };

  // Sincroniza el picker si cambia el value desde fuera
  useEffect(() => {
    if (!value) return;

    const [H, M] = value.split(":").map(Number);
    const isPM = H >= 12;
    const h12 = H % 12 === 0 ? 12 : H % 12;
    const mer = isPM ? "PM" : "AM";

    setHh12(h12);
    setMm(M);
    setMeridiano(mer);

    const idxHora = horas12.indexOf(h12);
    const idxMin = minutosBase.indexOf(
      isNaN(M) ? 0 : Math.max(0, Math.min(59, M))
    );
    const idxMer = ampm.indexOf(mer);

    centrarScroll(horasRef, horas12.length, LOOP, idxHora);
    centrarScroll(minutosRef, minutosBase.length, LOOP, idxMin);
    centrarScroll(ampmRef, ampm.length, LOOP_AMPM, idxMer);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers de scroll
  const onScrollHoras = (e) => {
    const st = e.target.scrollTop;
    const index = Math.round(st / ITEM_HEIGHT);
    const baseLen = horas12.length;

    const baseIndex = ((index % baseLen) + baseLen) % baseLen;
    const h = horas12[baseIndex] || horas12[0];

    setHh12(h);
    actualizarHora(h, mm, meridiano);

    const totalBase = baseLen * LOOP * ITEM_HEIGHT;
    const threshold = baseLen * ITEM_HEIGHT;
    if (st < threshold || st > totalBase - threshold) {
      const middleBlock = Math.floor(LOOP / 2);
      const newIndex = middleBlock * baseLen + baseIndex;
      e.target.scrollTop = newIndex * ITEM_HEIGHT;
    }
  };

  const onScrollMin = (e) => {
    const st = e.target.scrollTop;
    const index = Math.round(st / ITEM_HEIGHT);
    const baseLen = minutosBase.length;

    const baseIndex = ((index % baseLen) + baseLen) % baseLen;
    const m = minutosBase[baseIndex] || 0;

    setMm(m);
    actualizarHora(hh12, m, meridiano);

    const totalBase = baseLen * LOOP * ITEM_HEIGHT;
    const threshold = baseLen * ITEM_HEIGHT;
    if (st < threshold || st > totalBase - threshold) {
      const middleBlock = Math.floor(LOOP / 2);
      const newIndex = middleBlock * baseLen + baseIndex;
      e.target.scrollTop = newIndex * ITEM_HEIGHT;
    }
  };

  const onScrollAMPM = (e) => {
    const st = e.target.scrollTop;
    const index = Math.round(st / ITEM_HEIGHT);
    const baseLen = ampm.length;

    const baseIndex = ((index % baseLen) + baseLen) % baseLen;
    const mer = ampm[baseIndex] || "AM";

    setMeridiano(mer);
    actualizarHora(hh12, mm, mer);

    const totalBase = baseLen * LOOP_AMPM * ITEM_HEIGHT;
    const threshold = baseLen * ITEM_HEIGHT;
    if (st < threshold || st > totalBase - threshold) {
      const middleBlock = Math.floor(LOOP_AMPM / 2);
      const newIndex = middleBlock * baseLen + baseIndex;
      e.target.scrollTop = newIndex * ITEM_HEIGHT;
    }
  };

  return (
    <motion.div
      style={pickerIOSbox}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* HORAS */}
      <div ref={horasRef} style={iosColumn} onScroll={onScrollHoras}>
        {horasLoop.map((h, idx) => (
          <div key={`h-${idx}-${h}`} style={iosItem}>
            {String(h).padStart(2, "0")}
          </div>
        ))}
      </div>

      {/* Separador */}
      <div style={iosDivider}>:</div>

      {/* MINUTOS */}
      <div ref={minutosRef} style={iosColumn} onScroll={onScrollMin}>
        {minutosLoop.map((m, idx) => (
          <div key={`m-${idx}-${m}`} style={iosItem}>
            {String(m).padStart(2, "0")}
          </div>
        ))}
      </div>

      {/* AM / PM */}
      <div ref={ampmRef} style={iosColumn} onScroll={onScrollAMPM}>
        {ampmLoop.map((p, idx) => (
          <div key={`ap-${idx}-${p}`} style={iosItem}>
            {p}
          </div>
        ))}
      </div>

      {/* Franja central */}
      <div style={iosHighlight} />
    </motion.div>
  );
}

export default function ReservarCancha() {
  const navigate = useNavigate();

  // ===== Estado =====
  const [ubicacion, setUbicacion] = useState("");
  const [fecha, setFecha] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(t.getDate()).padStart(2, "0")}`;
  });
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState(60);
  const [filtroActivo, setFiltroActivo] = useState(false);

  const [canchas, setCanchas] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [canchaSel, setCanchaSel] = useState(null);
  const [selDiaPorCancha, setSelDiaPorCancha] = useState({});

  const autocompleteRef = useRef(null);

  // ===== siempre arriba =====
  useEffect(() => {
    window.scrollTo(0, 0);
    const id = setTimeout(() => window.scrollTo(0, 0), 50);
    return () => clearTimeout(id);
  }, []);

  // ✅ CARGA GENERAL DE CANCHAS (modo "ver todas", SIN filtros de fecha/hora)
  useEffect(() => {
    if (filtroActivo) return; // si estás buscando, no tocar los resultados

    (async () => {
      try {
        const data = await Api.canchas(); // TODAS las canchas
        const lista = Array.isArray(data) ? data : [];
        setCanchas(lista);
        setVisibleCount(Math.min(6, lista.length || 0));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [filtroActivo]);

  // ===== infinite scroll cuando NO hay filtro (mostrar todas) =====
  useEffect(() => {
    function handleScroll() {
      if (filtroActivo) return;
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight || document.body.scrollHeight;
      const clientHeight = doc.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 200) {
        setVisibleCount((prev) =>
          Math.min(prev + 4, canchas.length || prev)
        );
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filtroActivo, canchas.length]);

  // ===== Google Places Autocomplete =====
  useEffect(() => {
    if (!window.google) {
      const s = document.createElement("script");
      s.src =
        "https://maps.googleapis.com/maps/api/js?key=TU_API_KEY&libraries=places";
      s.async = true;
      s.defer = true;
      s.onload = initAutocomplete;
      document.body.appendChild(s);
    } else {
      initAutocomplete();
    }
  }, []);

  const initAutocomplete = () => {
    if (!autocompleteRef.current || !window.google?.maps?.places) return;
    const ac = new window.google.maps.places.Autocomplete(
      autocompleteRef.current,
      {
        types: ["establishment"],
        componentRestrictions: { country: "cl" },
      }
    );
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      setUbicacion(
        place?.name ||
          place?.formatted_address ||
          autocompleteRef.current.value
      );
    });
  };

  // ==== Helpers ====
  const minDate = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(t.getDate()).padStart(2, "0")}`;
  }, []);

  const horaFin = addMinutesToTime(hora, duracion);
  const dayKeyForFecha = useMemo(() => dateToDayKey(fecha), [fecha]);

  const horaBonita = hora ? formatTimeTo12h(hora) : "";
  const horaFinBonita = horaFin ? formatTimeTo12h(horaFin) : "";

  // ==== Acciones ====
  const handleBuscarDisponibilidad = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    try {
      const payload = { fecha, duracion };
      if (hora) payload.hora = hora;
      if (ubicacion.trim()) payload.ubicacion = ubicacion.trim();

      const data = await Api.disponibilidad(payload);
      let lista = Array.isArray(data) ? data : [];

      // Filtro extra por texto (por si el backend no filtra por ubicación)
      if (ubicacion.trim()) {
        const q = ubicacion.trim().toLowerCase();
        lista = lista.filter((c) => {
          const nombre = (c.nombre || "").toLowerCase();
          const dir = (c.direccion || c.ubicacion || "").toLowerCase();
          return nombre.includes(q) || dir.includes(q);
        });
      }

      setCanchas(lista);
      setFiltroActivo(true);
      setVisibleCount(lista.length);
    } catch (err) {
      alert(err.message || "Error buscando disponibilidad");
    }
  };

  // 👇 Mostrar todas las canchas (sin filtros de fecha/hora)
  const limpiarFiltro = () => {
    setFiltroActivo(false);
    setHora("");
    setUbicacion("");
    // El useEffect de arriba recarga TODAS las canchas con Api.canchas()
  };

  const handleReservarDirecto = async () => {
    if (!canchaSel) return alert("Elige una cancha primero.");
    if (!fecha || !hora) return alert("Completa fecha y hora.");

    try {
      await Api.crearReserva({
        cancha_id: canchaSel.id,
        fecha,
        hora_inicio: hora,
        hora_fin: horaFin,
      });
      alert(
        `Reserva creada para ${fechaCorta(fecha)} ${horaBonita} – ${horaFinBonita}`
      );
    } catch (err) {
      alert(err.message || "No se pudo crear la reserva");
    }
  };

  const handleVerCancha = (c) => {
    setCanchaSel(c);
    setUbicacion(`${c.nombre}, ${c.direccion || c.ubicacion || ""}`);
    navigate(`/cancha/${c.id}`, {
      state: {
        cancha: c,
        fecha,
      },
    });
  };

  // ==== disponibilidad semanal por cancha ====
  function getDispSemana(c) {
    // 1) Si viene disponibilidad desde la BD, se usa tal cual
    if (c && c.disponibilidad && typeof c.disponibilidad === "object") {
      return c.disponibilidad;
    }

    // 2) Si solo viene un array de horarios, armamos horario SOLO para ese día
    const dk = dayKeyForFecha;
    if (Array.isArray(c?.horarios) && c.horarios.length > 0) {
      const inicio = c.horarios[0];
      const fin = addMinutesToTime(c.horarios[c.horarios.length - 1], 60);
      return {
        [dk]: { habilitado: true, inicio, fin },
      };
    }

    // 3) Si no hay nada en BD, devolvemos null (sin horario)
    return null;
  }

  // ==== canchas a mostrar ====
  const canchasToShow = filtroActivo
    ? canchas
    : canchas.slice(0, visibleCount);

  const horaLabelDebajo =
    horaBonita && horaFinBonita
      ? `${horaBonita} – ${horaFinBonita}`
      : "Sin hora seleccionada";

  // ===== UI =====
  return (
    <div style={pageWrapper}>
      <div style={bgOverlay} />

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
        style={layout}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* HERO IZQUIERDA + FORMULARIO DERECHA */}
        <div style={heroRow}>
          {/* Hero izquierda */}
          <motion.section
            style={heroLeft}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div style={heroBadgeRow}>
              <span style={heroDot} />
              <span style={heroBadgeText}>Buscador de canchas</span>
            </div>

            <h1 style={heroTitle}>
              Encuentra tu próximo
              <br />
              partido de fútbol
            </h1>

            <p style={heroSubtitle}>
              Elige tu ciudad, fecha y estilo de partido. Nosotros te
              mostramos las canchas y equipos que necesitan jugadores,
              sin grupos raros, todo en un solo lugar.
            </p>

            <div style={heroPillsRow}>
              <span style={heroPill}>5 vs 5 · 7 vs 7 · 11 vs 11</span>
              <span style={heroPill}>Canchas hoy y mañana</span>
              <span style={heroPill}>Amistosos y torneos</span>
            </div>

            <div style={heroStepsRow}>
              <div style={heroStepCard}>
                <div style={heroStepNumber}>1</div>
                <div>
                  <div style={heroStepTitle}>Busca</div>
                  <div style={heroStepText}>
                    Filtra por ciudad, fecha y rango horario.
                  </div>
                </div>
              </div>

              <div style={heroStepCard}>
                <div style={heroStepNumber}>2</div>
                <div>
                  <div style={heroStepTitle}>Elige</div>
                  <div style={heroStepText}>
                    Revisa canchas, tipo de pasto y precio.
                  </div>
                </div>
              </div>

              <div style={heroStepCard}>
                <div style={heroStepNumber}>3</div>
                <div>
                  <div style={heroStepTitle}>Juega</div>
                  <div style={heroStepText}>
                    Confirma tu cupo y solo preocúpate de asistir.
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Formulario derecha */}
          <motion.form
            onSubmit={handleBuscarDisponibilidad}
            style={searchCard}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <div style={searchHeader}>
              <h2 style={h1Style}>Buscar canchas</h2>
              <p style={searchSubtitle}>
                Completa los datos y te mostraremos canchas disponibles
                según tu fecha y horario.
              </p>
            </div>

            {/* Ubicación */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelText}>Ciudad o zona</div>
              <div style={searchWrapper}>
                <span style={searchIcon}>📍</span>
                <input
                  ref={autocompleteRef}
                  type="text"
                  placeholder="Ej: Maipú, Ñuñoa, Quilicura..."
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  style={searchInput}
                />
              </div>
            </div>

            {/* Fecha + duración */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <div style={labelText}>Fecha</div>
                <input
                  type="date"
                  min={minDate}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  style={input}
                />
              </div>

              <div>
                <div style={labelText}>Duración</div>
                <select
                  value={duracion}
                  onChange={(e) => setDuracion(Number(e.target.value))}
                  style={input}
                >
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>120 min</option>
                </select>
              </div>
            </div>

            {/* Reloj estilo iOS */}
            <div style={{ marginTop: 20 }}>
              <div style={labelText}>Horario preferido</div>
              <div style={pickerIOSwrapper}>
                <HoraPicker value={hora} onChange={setHora} />
              </div>
              <div style={horaTextoActual}>{horaLabelDebajo}</div>
            </div>

            {/* Botón buscar */}
            <div style={{ marginTop: 20 }}>
              <motion.button
                type="submit"
                style={{ ...btnPrimary, width: "100%" }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 0 26px rgba(255,105,180,0.9)",
                }}
                whileTap={{ scale: 0.96 }}
              >
                Buscar disponibilidad
              </motion.button>
            </div>

            {/* Estado del filtro */}
            <div style={estadoFiltroText}>
              {filtroActivo ? (
                <>
                  {canchas.length} resultados para{" "}
                  {horaBonita && horaFinBonita
                    ? `${horaBonita} – ${horaFinBonita}`
                    : "—"}{" "}
                  — {diaSemana(fecha)} {fechaCorta(fecha)}
                  <motion.button
                    type="button"
                    onClick={limpiarFiltro}
                    style={{ ...btnGhost, marginLeft: 8 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    Mostrar todas las canchas
                  </motion.button>
                </>
              ) : (
                <>Mostrando todas las canchas sin filtros.</>
              )}
            </div>
          </motion.form>
        </div>

        {/* RESULTADOS ABAJO */}
        <motion.section
          style={resultsSection}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
        >
          <div style={cardsHeaderRow}>
            <h2 style={h2Style}>
              {filtroActivo
                ? "Resultados de disponibilidad"
                : "Canchas disponibles"}
            </h2>
            <span style={cardsHeaderMeta}>{canchas.length} canchas</span>
          </div>

          <div style={cardsGrid}>
            {canchasToShow.map((c, idx) => {
              const disp = getDispSemana(c);
              const selectedDay = selDiaPorCancha[c.id] || dayKeyForFecha;
              const infoSel = disp?.[selectedDay];

              return (
                <motion.article
                  key={c.id}
                  onClick={() => handleVerCancha(c)}
                  style={card}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: 0.05 * idx,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ position: "relative", height: 170 }}>
                    <img
                      src={
                        c.img ||
                        c.foto ||
                        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop"
                      }
                      alt={c.nombre}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    {/* Dirección */}
                    <div style={ratingBadge}>
                      📍 {c.direccion || c.ubicacion || "—"}
                    </div>

                    {/* Precio */}
                    <div style={priceBadge}>
                      {CLP.format(Number(c.precio || c.precio_base || 0))}
                    </div>

                    {/* Fecha seleccionada como referencia visual */}
                    <div style={dateBadge}>
                      📅 {diaSemana(fecha)} {fechaCorta(fecha)}
                    </div>
                  </div>

                  <div style={{ padding: 14, color: "#fff" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 4,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        {c.nombre}
                      </h3>
                      {c.id && (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "#ffd1e8",
                          }}
                        >
                          ID {c.id}
                        </span>
                      )}
                    </div>

                    {c.tipo && (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          margin: "4px 0 6px",
                        }}
                      >
                        <span style={{ ...chip, cursor: "default" }}>
                          ⚽ {c.tipo}
                        </span>
                      </div>
                    )}

                    {/* Tira semanal (solo si hay datos reales) */}
                    {disp && (
                      <div style={weekRow}>
                        {DAY_ORDER.map((dk) => {
                          const info = disp[dk];
                          const enabled = !!info?.habilitado;
                          const isSel = dk === selectedDay;
                          const base = enabled ? weekDotOn : weekDotOff;
                          const finalStyle = isSel
                            ? { ...base, ...weekDotSel }
                            : base;

                          let titleText = DAY_LABEL[dk];
                          if (info) {
                            titleText = info.habilitado
                              ? `${DAY_LABEL[dk]} ${info.inicio}–${info.fin}`
                              : `${DAY_LABEL[dk]} (cerrado)`;
                          }

                          return (
                            <button
                              key={dk}
                              type="button"
                              title={titleText}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!info) return;
                                setSelDiaPorCancha((s) => ({
                                  ...s,
                                  [c.id]: dk,
                                }));
                              }}
                              style={finalStyle}
                            >
                              {dk}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Horario + botón reservar / mensaje sin horario */}
                    <div style={{ marginTop: 12 }}>
                      {!disp ? (
                        <div style={sinHorarioBox}>
                          Sin horario disponible
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div style={horarioLabel}>
                            {!infoSel?.habilitado
                              ? "Cerrado"
                              : `${infoSel.inicio}–${infoSel.fin}`}
                          </div>
                          {infoSel?.habilitado && (
                            <motion.button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerCancha(c);
                              }}
                              style={reservarCardBtn}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Reservar
                            </motion.button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

/* ===== Estilos ===== */

// Fondo con Messi + overlay estilo general
const pageWrapper = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  padding: 16,
  backgroundImage:
    "url('https://wallpapers.com/images/hd/messi-in-inter-miami-pink-jersey-0nrcompkhks77o6u.jpg')",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  backgroundSize: "cover",
};

const bgOverlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(120deg, rgba(0,0,0,0.96), rgba(10,0,20,0.94), rgba(60,0,80,0.9))",
};

const layout = {
  maxWidth: 1200,
  margin: "0 auto",
  position: "relative",
  zIndex: 2,
  paddingTop: 80,
  paddingBottom: 40,
};

/* ===== Hero izquierda ===== */
const heroRow = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.05fr)",
  gap: 28,
  alignItems: "stretch",
  marginBottom: 28,
};

const heroLeft = {
  color: "#ffe6f3",
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
  marginBottom: 18,
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
  fontSize: "2.6rem",
  lineHeight: 1.1,
  fontWeight: 900,
  backgroundImage:
    "linear-gradient(120deg,#ffffff,#ffb3e1,#ff69b4,#ffd1e8)",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const heroSubtitle = {
  marginTop: 14,
  marginBottom: 14,
  fontSize: "0.95rem",
  maxWidth: 520,
  color: "#ffe6f3",
  opacity: 0.9,
};

const heroPillsRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 16,
};

const heroPill = {
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,0.7)",
  background: "rgba(0,0,0,0.85)",
  fontSize: "0.8rem",
  color: "#ffd1e8",
  fontWeight: 600,
};

const heroStepsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 12,
  marginTop: 6,
};

const heroStepCard = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: 10,
  borderRadius: 14,
  background: "rgba(0,0,0,0.92)",
  border: "1px solid rgba(255,105,180,0.6)",
};

const heroStepNumber = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "linear-gradient(135deg,#ff69b4,#ff1493)",
  color: "#000",
  fontWeight: 800,
  fontSize: "0.8rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const heroStepTitle = {
  fontSize: "0.85rem",
  fontWeight: 700,
  color: "#ffb3e1",
};

const heroStepText = {
  fontSize: "0.8rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

/* ===== Títulos y labels ===== */

const h1Style = {
  margin: 0,
  marginBottom: 4,
  fontSize: "1.4rem",
  fontWeight: 800,
  color: "#ff79c4",
};

const h2Style = {
  margin: "0 0 12px",
  fontSize: "1.3rem",
  fontWeight: 700,
  color: "#ffffff",
};

const labelText = {
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#ffd1e8",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

/* ===== Formulario derecha ===== */

const searchCard = {
  background: "rgba(5,0,10,0.97)",
  borderRadius: 24,
  padding: 22,
  color: "#fff",
  border: "1px solid rgba(255,105,180,0.7)",
  boxShadow: "0 0 30px rgba(0,0,0,0.9)",
};

const searchHeader = {
  marginBottom: 14,
};

const searchSubtitle = {
  margin: 0,
  marginTop: 4,
  fontSize: "0.85rem",
  color: "#ffe6f3",
  opacity: 0.9,
};

/* Estilos del HoraPicker iPhone */
const pickerIOSwrapper = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginTop: 10,
};

const pickerIOSbox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 20px",
  background: "#000000",
  borderRadius: 20,
  border: "2px solid #ff69b4",
  boxShadow: "0 0 20px rgba(255,105,180,0.45)",
  position: "relative",
  height: 150,
};

const iosColumn = {
  height: 120,
  width: 65,
  overflowY: "scroll",
  scrollSnapType: "y mandatory",
  scrollbarWidth: "none",
};

const iosItem = {
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.6rem",
  fontWeight: 800,
  color: "#fff",
  scrollSnapAlign: "center",
  textShadow: "0 0 8px rgba(255,105,180,0.9)",
};

const iosDivider = {
  fontSize: "2rem",
  color: "#ff69b4",
  fontWeight: "bold",
};

const iosHighlight = {
  position: "absolute",
  top: "50%",
  left: 0,
  right: 0,
  height: 40,
  transform: "translateY(-50%)",
  background: "rgba(255,105,180,0.25)",
  borderTop: "2px solid rgba(255,105,180,0.9)",
  borderBottom: "2px solid rgba(255,105,180,0.9)",
  borderRadius: 8,
  pointerEvents: "none",
};

const horaTextoActual = {
  marginTop: 8,
  fontSize: "0.9rem",
  color: "#ffd1e8",
  textAlign: "center",
  fontWeight: 500,
};

/* Botón home */
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

/* Inputs */
const input = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "2px solid #ff69b4",
  width: "100%",
  fontSize: "1rem",
  background: "#000000",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "0.2s",
};

/* Input búsqueda con icono */
const searchWrapper = {
  position: "relative",
};

const searchIcon = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: 16,
  color: "#ffd1e8",
};

/* Input búsqueda cuadrado */
const searchInput = {
  ...input,
  paddingLeft: 40,
  borderRadius: 14,
  height: 55,
  fontSize: "1.05rem",
};

/* Botón rosado */
const btnPrimary = {
  flex: 1,
  padding: 14,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(90deg,#ff69b4,#ff1493)",
  color: "#fff",
  fontSize: "1.05rem",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 0 18px rgba(255,105,180,0.55)",
};

/* Botón Ghost */
const btnGhost = {
  padding: 8,
  borderRadius: 12,
  border: "2px solid #ff69b4",
  background: "#000000",
  color: "#ffd1e8",
  fontWeight: 700,
  cursor: "pointer",
};

/* Chip genérico */
const chip = {
  padding: "6px 10px",
  borderRadius: 12,
  border: "2px solid #ff69b4",
  background: "#000000",
  color: "#ffd1e8",
  fontWeight: 700,
  fontSize: ".9rem",
};

/* Panel de resultados (tipo Mis reservas) */
const resultsSection = {
  marginTop: 8,
  padding: 18,
  borderRadius: 24,
  background:
    "linear-gradient(145deg, rgba(10,0,20,.96), rgba(0,0,0,.98))",
  border: "1px solid rgba(255,105,180,.4)",
  boxShadow: "0 25px 60px rgba(0,0,0,.9)",
};

/* Card de las canchas */
const card = {
  background: "#000000",
  border: "2px solid #ff69b4",
  borderRadius: 20,
  overflow: "hidden",
  color: "#fff",
  cursor: "pointer",
  boxShadow: "0 0 25px rgba(255,105,180,0.55)",
};

/* Badges */
const ratingBadge = {
  position: "absolute",
  top: 8,
  left: 8,
  background: "#000000",
  padding: "6px 12px",
  borderRadius: 14,
  fontWeight: 700,
  fontSize: "0.85rem",
  border: "2px solid #ff69b4",
  color: "#ffd1e8",
};

const priceBadge = {
  position: "absolute",
  top: 8,
  right: 8,
  background: "linear-gradient(90deg,#ff69b4,#ff1493)",
  padding: "6px 14px",
  borderRadius: 14,
  fontWeight: 900,
  color: "#000",
  fontSize: "0.95rem",
  boxShadow: "0 0 15px rgba(255,105,180,.8)",
};

const dateBadge = {
  position: "absolute",
  bottom: 8,
  left: 8,
  background: "#000000",
  padding: "6px 12px",
  borderRadius: 14,
  fontWeight: 700,
  fontSize: "0.85rem",
  border: "2px solid #ff69b4",
  color: "#ffd1e8",
};

/* ===== Tira semanal ===== */
const weekRow = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 6,
  alignItems: "center",
  marginTop: 6,
};

const weekDotBase = {
  height: 30,
  borderRadius: 10,
  border: "1px solid #ff69b4",
  background: "#000000",
  color: "#fff",
  fontWeight: 800,
  fontSize: ".78rem",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  userSelect: "none",
};

const weekDotOff = {
  ...weekDotBase,
  opacity: 0.4,
};

const weekDotOn = {
  ...weekDotBase,
  background: "#ff69b433",
  boxShadow: "0 2px 10px rgba(255,105,180,.6) inset",
};

const weekDotSel = {
  outline: "2px solid #ffffff",
  background: "linear-gradient(90deg,#ff69b4,#ff1493)",
  color: "#000",
};

const sinHorarioBox = {
  padding: "10px 12px",
  borderRadius: 12,
  background: "#111111",
  color: "#ffd1e8",
  fontSize: "0.9rem",
  fontWeight: 500,
  textAlign: "center",
};

const horarioLabel = {
  fontSize: "0.9rem",
  color: "#ffd1e8",
  fontWeight: 500,
};

const reservarCardBtn = {
  padding: "8px 14px",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(90deg,#ff69b4,#ff1493)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "0.85rem",
  cursor: "pointer",
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
};

const cardsHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 12,
};

const cardsHeaderMeta = {
  fontSize: "0.85rem",
  color: "#ffe6f3",
};

const estadoFiltroText = {
  marginTop: 10,
  fontSize: "0.8rem",
  color: "#ffd1e8",
};
