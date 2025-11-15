// src/pages/PagoReserva.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Api } from "../api";

// helper para sumar minutos a una hora "HH:MM"
function addMinutesToTime(timeStr, minutes) {
  if (!timeStr) return "";
  const [hh, mm] = timeStr.split(":").map(Number);
  const d = new Date(2000, 0, 1, hh, mm || 0, 0, 0);
  d.setMinutes(d.getMinutes() + minutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export default function PagoReserva() {
  const location = useLocation();
  const navigate = useNavigate();
  const [estadoPago, setEstadoPago] = useState("inicio"); // inicio | procesando | exito

  const data = location.state || {};
  const {
    canchaId,
    nombreCancha,
    fecha,
    fechaBonita,
    hora_inicio,
    hora_fin,
    monto, // total por todas las horas (visual)
    montoFormateado,
    ubicacion,
    foto,
    tramos: tramosSeleccionados = [], // array de horas ["13:00","20:00",...]
  } = data;

  const tramosOrdenados = [...tramosSeleccionados].sort();
  const totalTramos = tramosOrdenados.length;

  const precioMostrar =
    typeof montoFormateado === "string"
      ? montoFormateado
      : CLP.format(Number(monto || 0));

  // Rango "bonito" principal para mostrar
  const rangoPrincipal =
    hora_inicio && hora_fin
      ? `${hora_inicio} – ${hora_fin}`
      : totalTramos > 0
      ? `${tramosOrdenados[0]} – ${addMinutesToTime(
          tramosOrdenados[totalTramos - 1],
          60
        )}`
      : "Sin horario seleccionado";

  // 👉 pagar = crear reservas REALES en la BD
  //   - si hay tramosSeleccionados -> una reserva por cada tramo de 1 hora
  //   - si no hay tramos -> reserva única como antes
  const handlePagar = async () => {
    if (!canchaId || !fecha) {
      alert("Faltan datos de la reserva. Vuelve a seleccionar la cancha.");
      return;
    }

    if (totalTramos === 0 && (!hora_inicio || !hora_fin)) {
      alert("Faltan las horas de la reserva. Vuelve a seleccionar los bloques.");
      return;
    }

    setEstadoPago("procesando");

    try {
      if (totalTramos > 0) {
        // ✅ MULTI-BLOQUE: una reserva por cada tramo
        for (const inicio of tramosOrdenados) {
          const fin = addMinutesToTime(inicio, 60);

          // no mandamos monto_total -> el backend calcula 1h * precio_base
          await Api.crearReserva({
            cancha_id: canchaId,
            fecha,
            hora_inicio: inicio,
            hora_fin: fin,
          });
        }
      } else {
        // ⚠️ caso viejo (sin tramos): una sola reserva grande
        await Api.crearReserva({
          cancha_id: canchaId,
          fecha,
          hora_inicio,
          hora_fin,
          monto_total: monto, // total de ese rango
        });
      }

      setEstadoPago("exito");
    } catch (err) {
      console.error("Error al crear reserva:", err);
      alert("Hubo un problema al registrar el pago. Intenta de nuevo.");
      setEstadoPago("inicio");
    }
  };

  const volverALaCancha = () => {
    navigate(-1);
  };

  const irAInicio = () => {
    navigate("/");
  };

  if (!canchaId) {
    // Si alguien entra directo a /pago-reserva sin datos
    return (
      <div style={pageBg}>
        <div style={card}>
          <h1 style={titleText}>Pago de reserva</h1>
          <p style={{ color: "#ffe6f3", fontSize: "0.9rem" }}>
            No encontramos los datos de la reserva. Vuelve a seleccionar una
            cancha y un horario.
          </p>
          <button style={primaryBtn} onClick={irAInicio}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageBg}>
      <div style={card}>
        <div style={topRow}>
          <button style={backBtn} onClick={volverALaCancha}>
            ⬅ Volver
          </button>
          <span style={stepChip}>Paso 3: pago</span>
        </div>

        <h1 style={titleText}>Confirmar pago</h1>

        {/* Resumen de la reserva */}
        <div style={contentGrid}>
          <div style={leftCol}>
            <div style={photoCard}>
              <img
                src={
                  foto ||
                  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop"
                }
                alt={nombreCancha}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div style={tagBadge}>Cancha #{canchaId}</div>
            </div>

            <div style={infoCard}>
              <h2 style={canchaName}>{nombreCancha}</h2>
              <p style={infoLine}>
                📍 <span>{ubicacion}</span>
              </p>
              <p style={infoLine}>
                📅 <span>{fechaBonita || fecha}</span>
              </p>
              <p style={infoLine}>
                ⏰ <span>{rangoPrincipal}</span>
              </p>

              {totalTramos > 0 && (
                <p style={infoLine}>
                  🧩{" "}
                  <span>
                    Tramos:{" "}
                    {tramosOrdenados
                      .map(
                        (h) => `${h} – ${addMinutesToTime(h, 60)}`
                      )
                      .join(", ")}
                  </span>
                </p>
              )}

              <p style={infoLine}>
                💰 <span>{precioMostrar}</span>
              </p>
            </div>
          </div>

          {/* Panel de pago */}
          <div style={rightCol}>
            <div style={payBox}>
              <h3 style={payTitle}>Resumen del pago</h3>

              <div style={priceRow}>
                <span>Valor por reserva</span>
                <strong>{precioMostrar}</strong>
              </div>

              <div style={priceRowSmall}>
                <span>Cancha</span>
                <span>{nombreCancha}</span>
              </div>
              <div style={priceRowSmall}>
                <span>Fecha y hora</span>
                <span>
                  {fechaBonita || fecha} · {rangoPrincipal}
                </span>
              </div>
              {totalTramos > 0 && (
                <div style={priceRowSmall}>
                  <span>Bloques</span>
                  <span>
                    {totalTramos} hora
                    {totalTramos > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div style={divider} />

              <div style={totalRow}>
                <span>Total a pagar</span>
                <span>{precioMostrar}</span>
              </div>

              <div style={{ marginTop: 16 }}>
                <button
                  style={{
                    ...primaryBtn,
                    opacity: estadoPago === "procesando" ? 0.7 : 1,
                  }}
                  onClick={handlePagar}
                  disabled={
                    estadoPago === "procesando" || estadoPago === "exito"
                  }
                >
                  {estadoPago === "inicio" && "Pagar ahora 💳"}
                  {estadoPago === "procesando" && "Procesando pago..."}
                  {estadoPago === "exito" && "Pago realizado ✅"}
                </button>
              </div>

              <p style={tinyNote}>
                El pago ahora registra{" "}
                {totalTramos > 0
                  ? "una reserva por cada bloque de 1 hora que seleccionaste."
                  : "una reserva en tu base de datos."}
              </p>

              {estadoPago === "exito" && (
                <div style={successBox}>
                  <p style={{ margin: 0, fontSize: "0.88rem" }}>
                    🎉 Tu pago fue registrado. Puedes revisar estas reservas en
                    la tabla <b>reservas</b> de tu base de datos.
                  </p>
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
    'linear-gradient(130deg, rgba(0,0,0,.96), rgba(10,0,20,.9), rgba(40,0,50,.9))',
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
};

const card = {
  width: "100%",
  maxWidth: 1000,
  background: "rgba(0,0,0,.9)",
  borderRadius: 24,
  padding: 24,
  border: "1px solid rgba(255,105,180,.5)",
  boxShadow: "0 22px 60px rgba(0,0,0,.95)",
  backdropFilter: "blur(10px)",
};

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
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

const stepChip = {
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(255,105,180,.15)",
  border: "1px solid rgba(255,105,180,.7)",
  color: "#ffd5ec",
  fontSize: "0.75rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const titleText = {
  margin: "4px 0 14px",
  fontSize: "1.6rem",
  color: "#ff79c4",
  textShadow: "0 0 16px rgba(255,105,180,.9)",
};

const contentGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1.3fr)",
  gap: 24,
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
};

const photoCard = {
  position: "relative",
  borderRadius: 18,
  overflow: "hidden",
  height: 200,
  boxShadow: "0 18px 40px rgba(0,0,0,.85)",
};

const tagBadge = {
  position: "absolute",
  top: 10,
  left: 10,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(0,0,0,.75)",
  color: "#ffe6f3",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const infoCard = {
  borderRadius: 18,
  padding: 14,
  background:
    "linear-gradient(145deg, rgba(15,0,25,.98), rgba(5,0,10,.98))",
  border: "1px solid rgba(255,105,180,.25)",
  color: "#ffe6f3",
};

const canchaName = {
  margin: "0 0 6px",
  fontSize: "1.1rem",
  color: "#ffb3e1",
};

const infoLine = {
  margin: "2px 0",
  fontSize: "0.9rem",
  opacity: 0.95,
};

const payBox = {
  borderRadius: 18,
  padding: 16,
  background:
    "linear-gradient(145deg, rgba(18,0,26,.98), rgba(0,0,0,.98))",
  border: "1px solid rgba(255,105,180,.3)",
  color: "#ffe6f3",
};

const payTitle = {
  margin: "0 0 10px",
  fontSize: "1rem",
  color: "#ffb3e1",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const priceRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "0.95rem",
};

const priceRowSmall = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "0.82rem",
  marginTop: 4,
  opacity: 0.9,
};

const divider = {
  height: 1,
  margin: "10px 0",
  background:
    "linear-gradient(90deg, rgba(255,105,180,0), rgba(255,105,180,.7), rgba(255,105,180,0))",
};

const totalRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "1rem",
  fontWeight: 700,
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

const tinyNote = {
  marginTop: 8,
  fontSize: "0.78rem",
  color: "rgba(210,255,238,.88)",
  fontStyle: "italic",
};

const successBox = {
  marginTop: 10,
  padding: 8,
  borderRadius: 10,
  background: "rgba(96,255,190,.08)",
  border: "1px solid rgba(150,255,210,.8)",
};
