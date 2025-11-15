// src/pages/DetallesCanchaDueno.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  Phone,
  DollarSign,
  CalendarDays,
  Trash2,
  Edit3,
  ShieldAlert,
} from "lucide-react";
import Api from "../api"; // 👈 IMPORT CORREGIDO

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

// ==== helpers de fecha para reservas ====
function normalizarFecha(fechaRaw) {
  if (!fechaRaw) return null;
  const solo = String(fechaRaw).split("T")[0]; // "YYYY-MM-DD"
  const [y, m, d] = solo.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function formatFechaReserva(fechaRaw) {
  const f = normalizarFecha(fechaRaw);
  if (!f) return "Fecha no disponible";
  const dt = new Date(f.y, f.m - 1, f.d);
  try {
    return dt.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return `${String(f.d).padStart(2, "0")}-${String(f.m).padStart(
      2,
      "0"
    )}-${f.y}`;
  }
}

function buildDateTime(fechaRaw, horaRaw) {
  const f = normalizarFecha(fechaRaw);
  if (!f) return null;
  const [hh, mm] = String(horaRaw || "00:00")
    .split(":")
    .map((n) => parseInt(n, 10));
  return new Date(f.y, f.m - 1, f.d, hh || 0, mm || 0, 0, 0);
}

export default function DetallesCanchaDueno() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const canchaFromState = location.state?.cancha || null;
  const [cancha, setCancha] = useState(canchaFromState);

  const [form, setForm] = useState(() => ({
    nombre: canchaFromState?.nombre || "",
    direccion: canchaFromState?.ubicacion || canchaFromState?.direccion || "",
    telefono: canchaFromState?.telefono || "",
    precio_base: canchaFromState?.precio_base || canchaFromState?.precio || "",
  }));

  const [loading, setLoading] = useState(!canchaFromState);
  const [errorMsg, setErrorMsg] = useState("");

  // estado para reservas de esta cancha
  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [reservasError, setReservasError] = useState("");

  // bloqueo de fechas
  const [bloqueoFecha, setBloqueoFecha] = useState("");
  const [bloqueoTodoDia, setBloqueoTodoDia] = useState(true);
  const [bloqueoInicio, setBloqueoInicio] = useState("08:00");
  const [bloqueoFin, setBloqueoFin] = useState("22:00");

  // estados de acciones
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bloqueando, setBloqueando] = useState(false);

  // mensajito de estado arriba (éxito / error / info)
  const [status, setStatus] = useState(null);

  // ==== cargar cancha desde backend si no viene por state ====
  useEffect(() => {
    if (canchaFromState) return; // ya venía de la lista

    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const data = await Api.canchaDetalle(Number(id));
        setCancha(data || null);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "No se pudo cargar la cancha.");
        setCancha(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, canchaFromState]);

  // sincronizar formulario cuando cambie la cancha
  useEffect(() => {
    if (!cancha) return;
    setForm({
      nombre: cancha.nombre || "",
      direccion: cancha.ubicacion || cancha.direccion || "",
      telefono: cancha.telefono || "",
      precio_base: cancha.precio_base || cancha.precio || "",
    });
  }, [cancha]);

  // ==== cargar reservas de esta cancha ====
  useEffect(() => {
    if (!cancha?.id) return;

    (async () => {
      try {
        setLoadingReservas(true);
        setReservasError("");
        const data = await Api.reservasCancha(cancha.id); // GET /api/canchas/:id/reservas
        setReservas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setReservasError(
          err.message || "No se pudieron cargar las reservas de esta cancha."
        );
        setReservas([]);
      } finally {
        setLoadingReservas(false);
      }
    })();
  }, [cancha?.id]);

  // separar próximas / pasadas
  const ahora = useMemo(() => new Date(), []);
  const { futurasReservas, reservasPasadas } = useMemo(() => {
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

    const sortFn = (a, b) => {
      const da = buildDateTime(a.fecha, a.hora_inicio) || new Date(0);
      const db = buildDateTime(b.fecha, b.hora_inicio) || new Date(0);
      return da - db;
    };

    fut.sort(sortFn);
    past.sort(sortFn);

    return { futurasReservas: fut, reservasPasadas: past };
  }, [reservas, ahora]);

  // ==== handlers de formulario / acciones ====
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    if (!cancha) return;
    try {
      setSaving(true);
      setStatus({ type: "info", msg: "Guardando cambios..." });

      const payload = {
        nombre: form.nombre.trim(),
        ubicacion: (form.direccion || "").trim(),
        telefono: (form.telefono || "").trim(),
        precio_base: Number(form.precio_base || 0),
      };

      const updated = await Api.actualizarCancha(cancha.id, payload);
      // actualizamos la cancha local con lo que responde el backend
      setCancha((prev) => ({ ...(prev || {}), ...(updated || payload) }));
      setStatus({ type: "success", msg: "Cambios guardados correctamente ✅" });
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        msg:
          err.message ||
          "No se pudo guardar la cancha. Revisa el backend o vuelve a intentar.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!cancha) return;
    const ok = window.confirm(
      "Esta acción eliminará la cancha de forma permanente. ¿Seguro que quieres continuar?"
    );
    if (!ok) return;

    try {
      setDeleting(true);
      setStatus({ type: "info", msg: "Eliminando cancha..." });
      await Api.eliminarCancha(cancha.id);
      setStatus({ type: "success", msg: "Cancha eliminada correctamente." });
      alert("Cancha eliminada correctamente.");
      navigate("/publicar"); // o donde tengas el listado de canchas del dueño
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        msg:
          err.message ||
          "No se pudo eliminar la cancha. Revisa el backend o vuelve a intentar.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleAplicarBloqueo = async () => {
    if (!cancha) return;
    if (!bloqueoFecha) {
      alert("Selecciona una fecha a bloquear.");
      return;
    }
    if (!bloqueoTodoDia && bloqueoInicio >= bloqueoFin) {
      alert("El rango de horas no es válido.");
      return;
    }

    try {
      setBloqueando(true);
      setStatus({ type: "info", msg: "Aplicando bloqueo de fecha..." });

      const payload = {
        cancha_id: cancha.id,
        fecha: bloqueoFecha,
        hora_inicio: bloqueoTodoDia ? "00:00" : bloqueoInicio,
        hora_fin: bloqueoTodoDia ? "23:59" : bloqueoFin,
      };

      await Api.crearBloqueoCancha(payload); // POST al backend
      setStatus({
        type: "success",
        msg:
          "Bloqueo aplicado. Ese día y rango horario dejarán de aparecer como disponibles.",
      });
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        msg:
          err.message ||
          "No se pudo aplicar el bloqueo. Revisa el backend o vuelve a intentar.",
      });
    } finally {
      setBloqueando(false);
    }
  };

  // ==== estados de carga / error cuando no hay cancha ====
  if (!cancha && loading) {
    return (
      <div style={pageBg}>
        <div style={mainCard}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            ⬅ Volver
          </button>
          <h1 style={titleText}>Panel de cancha</h1>
          <p style={{ color: "#ffe6f3", fontSize: "0.9rem" }}>
            Cargando cancha #{id}...
          </p>
        </div>
      </div>
    );
  }

  if (!cancha && !loading) {
    return (
      <div style={pageBg}>
        <div style={mainCard}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            ⬅ Volver
          </button>
          <h1 style={titleText}>Panel de cancha</h1>
          <p style={{ color: "#ffe6f3", fontSize: "0.9rem" }}>
            No encontramos los datos de la cancha en el backend (ID {id}).
          </p>
          {errorMsg && (
            <p style={{ color: "#ff9fbf", fontSize: "0.85rem" }}>{errorMsg}</p>
          )}
        </div>
      </div>
    );
  }

  const precioMostrar = CLP.format(Number(form.precio_base || 0));

  return (
    <div style={pageBg}>
      <div style={mainCard}>
        {/* Barra superior */}
        <div style={topRow}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            ⬅ Volver
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={smallLabel}>Panel del dueño</div>
            <h1 style={titleText}>{form.nombre || "Cancha sin nombre"}</h1>
          </div>
          <span style={idChip}>ID #{cancha?.id}</span>
        </div>

        {/* Mensaje de estado */}
        {status?.msg && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 12px",
              borderRadius: 999,
              fontSize: "0.8rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background:
                status.type === "error"
                  ? "rgba(255,80,120,.18)"
                  : status.type === "success"
                  ? "rgba(96,255,190,.14)"
                  : "rgba(255,255,255,.06)",
              border:
                status.type === "error"
                  ? "1px solid rgba(255,120,150,.9)"
                  : status.type === "success"
                  ? "1px solid rgba(150,255,210,.9)"
                  : "1px solid rgba(255,255,255,.3)",
              color: "#ffe6f3",
            }}
          >
            <span>
              {status.type === "error"
                ? "⚠️"
                : status.type === "success"
                ? "✅"
                : "ℹ️"}
            </span>
            <span>{status.msg}</span>
          </div>
        )}

        {/* Layout principal */}
        <div style={layoutGrid}>
          {/* Izquierda: ficha de cancha */}
          <div style={leftCol}>
            <div style={photoBox}>
              <img
                src={
                  cancha.foto ||
                  cancha.img ||
                  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop"
                }
                alt={form.nombre}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div style={photoOverlay}>
                <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                  Vista previa de tu cancha
                </span>
              </div>
              <div style={priceBadge}>{precioMostrar} / hora</div>
            </div>

            <div style={infoCard}>
              <p style={infoLine}>
                <MapPin size={16} color="#ff79c4" />{" "}
                <span>{form.direccion || "Sin dirección"}</span>
              </p>
              <p style={infoLine}>
                <Phone size={16} color="#ff79c4" />{" "}
                <span>{form.telefono || "Sin teléfono"}</span>
              </p>
              <p style={infoLine}>
                <DollarSign size={16} color="#ff79c4" />{" "}
                <span>{precioMostrar}</span>
              </p>

              <div style={{ marginTop: 10 }}>
                <p style={miniLabel}>Disponibilidad publicada</p>

                {cancha.disponibilidad &&
                Object.values(cancha.disponibilidad).some(
                  (d) => d?.habilitado
                ) ? (
                  <div style={chipsRow}>
                    {Object.entries(cancha.disponibilidad)
                      .filter(([_, d]) => d?.habilitado)
                      .map(([dia, d]) => (
                        <div key={dia} style={dispChip}>
                          <strong style={{ color: "#ffb3e1" }}>{dia}:</strong>{" "}
                          {d.inicio} – {d.fin}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.8rem", color: "#ffd1ec" }}>
                    Esta cancha no tiene horarios configurados (o no vienen en
                    la respuesta).
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Derecha: secciones de gestión */}
          <div style={rightCol}>
            {/* Reservas de la cancha */}
            <section style={sectionCard}>
              <div style={sectionHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CalendarDays size={18} color="#ffb3e1" />
                  <h2 style={sectionTitle}>Reservas de esta cancha</h2>
                </div>
                <span style={sectionChip}>vista dueño</span>
              </div>

              <p style={sectionText}>
                Revisa quién tiene esta cancha reservada, con horario, estado y
                montos.
              </p>

              {loadingReservas && (
                <div style={fakeListBox}>
                  <p style={fakeText}>Cargando reservas...</p>
                </div>
              )}

              {!loadingReservas && reservasError && (
                <div style={fakeListBox}>
                  <p
                    style={{
                      ...fakeText,
                      color: "#ff9fbf",
                    }}
                  >
                    {reservasError}
                  </p>
                </div>
              )}

              {!loadingReservas &&
                !reservasError &&
                reservas.length === 0 && (
                  <div style={fakeListBox}>
                    <p style={fakeText}>
                      Aún no hay reservas registradas para esta cancha.
                    </p>
                  </div>
                )}

              {!loadingReservas && !reservasError && reservas.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 6,
                      fontSize: "0.8rem",
                      opacity: 0.9,
                    }}
                  >
                    <span>
                      Próximas: <strong>{futurasReservas.length}</strong>
                    </span>
                    <span>|</span>
                    <span>
                      Historial: <strong>{reservasPasadas.length}</strong>
                    </span>
                  </div>

                  {futurasReservas.length > 0 && (
                    <div style={fakeListBox}>
                      <p style={{ ...miniLabel, marginBottom: 4 }}>
                        Próximas reservas
                      </p>
                      {futurasReservas.map((r) => (
                        <div key={r.id} style={reservaRow}>
                          <div>
                            <div style={reservaFecha}>
                              {formatFechaReserva(r.fecha)} ·{" "}
                              {r.hora_inicio?.slice(0, 5)} –{" "}
                              {r.hora_fin?.slice(0, 5)}
                            </div>
                            <div style={reservaEstado}>
                              {r.estado || "sin estado"}
                            </div>
                          </div>
                          <div style={reservaMonto}>
                            {CLP.format(Number(r.monto_total || 0))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {reservasPasadas.length > 0 && (
                    <div style={{ ...fakeListBox, marginTop: 8 }}>
                      <p style={{ ...miniLabel, marginBottom: 4 }}>Historial</p>
                      {reservasPasadas.slice(0, 5).map((r) => (
                        <div key={r.id} style={reservaRow}>
                          <div>
                            <div style={reservaFecha}>
                              {formatFechaReserva(r.fecha)} ·{" "}
                              {r.hora_inicio?.slice(0, 5)} –{" "}
                              {r.hora_fin?.slice(0, 5)}
                            </div>
                            <div style={reservaEstado}>
                              {r.estado || "sin estado"}
                            </div>
                          </div>
                          <div style={reservaMonto}>
                            {CLP.format(Number(r.monto_total || 0))}
                          </div>
                        </div>
                      ))}
                      {reservasPasadas.length > 5 && (
                        <p style={{ ...tinyFoot, marginTop: 6 }}>
                          Mostrando las últimas 5 reservas antiguas.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Bloqueo de fechas / emergencia */}
            <section style={sectionCard}>
              <div style={sectionHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldAlert size={18} color="#ffb3e1" />
                  <h2 style={sectionTitle}>Bloquear fechas por emergencia</h2>
                </div>
              </div>

              <p style={sectionText}>
                Úsalo cuando llueve fuerte, hay mantención o un imprevisto y
                necesitas bloquear un día/rango para que no se pueda reservar.
              </p>

              <div style={bloqueoGrid}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label style={labelSmall}>Fecha a bloquear</label>
                  <input
                    type="date"
                    value={bloqueoFecha}
                    onChange={(e) => setBloqueoFecha(e.target.value)}
                    style={inputBase}
                  />
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label style={labelSmall}>Tipo de bloqueo</label>
                  <div style={toggleRow}>
                    <button
                      type="button"
                      onClick={() => setBloqueoTodoDia(true)}
                      style={{
                        ...pillToggle,
                        background: bloqueoTodoDia
                          ? "linear-gradient(135deg,#ff61b6,#ffb3e1)"
                          : "rgba(30,0,40,.9)",
                        color: bloqueoTodoDia ? "#2b0018" : "#ffd1ec",
                      }}
                    >
                      Todo el día
                    </button>
                    <button
                      type="button"
                      onClick={() => setBloqueoTodoDia(false)}
                      style={{
                        ...pillToggle,
                        background: !bloqueoTodoDia
                          ? "linear-gradient(135deg,#ff61b6,#ffb3e1)"
                          : "rgba(30,0,40,.9)",
                        color: !bloqueoTodoDia ? "#2b0018" : "#ffd1ec",
                      }}
                    >
                      Solo rango
                    </button>
                  </div>
                </div>

                {!bloqueoTodoDia && (
                  <div style={rangoRow}>
                    <div style={{ flex: 1 }}>
                      <label style={labelSmall}>Desde</label>
                      <input
                        type="time"
                        value={bloqueoInicio}
                        onChange={(e) => setBloqueoInicio(e.target.value)}
                        style={inputBase}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelSmall}>Hasta</label>
                      <input
                        type="time"
                        value={bloqueoFin}
                        onChange={(e) => setBloqueoFin(e.target.value)}
                        style={inputBase}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                style={{
                  ...dangerBtn,
                  opacity: bloqueando ? 0.7 : 1,
                  cursor: bloqueando ? "wait" : "pointer",
                }}
                onClick={handleAplicarBloqueo}
                disabled={bloqueando}
              >
                {bloqueando ? "Aplicando bloqueo..." : "Aplicar bloqueo"}
              </button>
            </section>

            {/* Edición de datos básicos */}
            <section style={sectionCard}>
              <div style={sectionHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Edit3 size={18} color="#ffb3e1" />
                  <h2 style={sectionTitle}>Editar datos de la cancha</h2>
                </div>
              </div>

              <div style={editGrid}>
                <div style={fieldBlock}>
                  <label style={labelSmall}>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleFormChange}
                    style={inputBase}
                  />
                </div>
                <div style={fieldBlock}>
                  <label style={labelSmall}>Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={form.direccion}
                    onChange={handleFormChange}
                    style={inputBase}
                  />
                </div>
                <div style={fieldBlock}>
                  <label style={labelSmall}>Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleFormChange}
                    style={inputBase}
                  />
                </div>
                <div style={fieldBlock}>
                  <label style={labelSmall}>Precio base (CLP)</label>
                  <input
                    type="number"
                    name="precio_base"
                    value={form.precio_base}
                    onChange={handleFormChange}
                    style={inputBase}
                  />
                </div>
              </div>

              <div style={editButtonsRow}>
                <button
                  type="button"
                  style={{
                    ...primaryBtn,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? "wait" : "pointer",
                  }}
                  onClick={handleGuardar}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  style={{
                    ...deleteBtn,
                    opacity: deleting ? 0.7 : 1,
                    cursor: deleting ? "wait" : "pointer",
                  }}
                  onClick={handleEliminar}
                  disabled={deleting}
                >
                  <Trash2 size={16} />
                  {deleting ? "Eliminando..." : "Eliminar cancha"}
                </button>
              </div>

              <p style={warningText}>
                🔧 Estos cambios se envían al backend usando tu API. Si ves
                algún error, revisa los endpoints de canchas en tu servidor.
              </p>
            </section>
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
    "linear-gradient(130deg, rgba(0,0,0,.97), rgba(20,0,30,.95), rgba(60,0,80,.9))",
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex",
  justifyContent: "center",
};

const mainCard = {
  width: "100%",
  maxWidth: 1150,
  background: "rgba(0,0,0,.9)",
  borderRadius: 24,
  padding: 24,
  border: "1px solid rgba(255,105,180,.5)",
  boxShadow: "0 22px 60px rgba(0,0,0,.95)",
  backdropFilter: "blur(10px)",
};

const topRow = {
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  columnGap: 12,
  marginBottom: 20,
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

const smallLabel = {
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "rgba(255,192,222,.9)",
};

const titleText = {
  margin: 0,
  fontSize: "1.6rem",
  textAlign: "center",
  color: "#ff79c4",
  textShadow: "0 0 16px rgba(255,105,180,.9)",
};

const idChip = {
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(255,105,180,.15)",
  border: "1px solid rgba(255,105,180,.7)",
  color: "#ffd5ec",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const layoutGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1.7fr)",
  gap: 22,
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

const photoBox = {
  position: "relative",
  borderRadius: 18,
  overflow: "hidden",
  height: 220,
  boxShadow: "0 18px 40px rgba(0,0,0,.85)",
};

const photoOverlay = {
  position: "absolute",
  bottom: 10,
  left: 10,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(0,0,0,.7)",
  color: "#ffe6f3",
};

const priceBadge = {
  position: "absolute",
  top: 10,
  right: 10,
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
  gap: 4,
};

const infoLine = {
  margin: 0,
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: "0.88rem",
};

const miniLabel = {
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#ffd1e8",
};

const chipsRow = {
  marginTop: 4,
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const dispChip = {
  backgroundColor: "#222",
  color: "#fff",
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: "0.78rem",
};

const sectionCard = {
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
  fontSize: "0.88rem",
  color: "#ffe6f3",
  opacity: 0.92,
  marginTop: 6,
};

const fakeListBox = {
  marginTop: 8,
  padding: 10,
  borderRadius: 10,
  border: "1px dashed rgba(255,105,180,.5)",
  background: "rgba(25,0,35,.9)",
};

const fakeText = {
  margin: 0,
  fontSize: "0.85rem",
  color: "#ffd5ec",
};

const bloqueoGrid = {
  marginTop: 8,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const labelSmall = {
  fontSize: "0.78rem",
  color: "#ffd1e8",
  marginBottom: 2,
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

const toggleRow = {
  display: "flex",
  gap: 6,
};

const pillToggle = {
  flex: 1,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,105,180,.7)",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const rangoRow = {
  display: "flex",
  gap: 8,
};

const dangerBtn = {
  marginTop: 10,
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,150,180,.9)",
  background:
    "linear-gradient(135deg, rgba(255,80,120,.9), rgba(180,0,40,.9))",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.85rem",
  cursor: "pointer",
};

const editGrid = {
  marginTop: 8,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 10,
};

const fieldBlock = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const editButtonsRow = {
  marginTop: 10,
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
};

const primaryBtn = {
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

const deleteBtn = {
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,120,150,.9)",
  background: "rgba(40,0,20,.9)",
  color: "#ffc5d6",
  fontWeight: 600,
  fontSize: "0.85rem",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const warningText = {
  marginTop: 6,
  fontSize: "0.78rem",
  color: "rgba(255,220,240,.9)",
  fontStyle: "italic",
};

const reservaRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 0",
  borderBottom: "1px solid rgba(255,255,255,.06)",
};

const reservaFecha = {
  fontSize: "0.85rem",
  color: "#ffe6f3",
};

const reservaEstado = {
  marginTop: 2,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#ffd1e8",
};

const reservaMonto = {
  fontSize: "0.9rem",
  fontWeight: 700,
  color: "#b4ffe3",
};

const tinyFoot = {
  fontSize: "0.75rem",
  color: "rgba(255,220,240,.8)",
};
