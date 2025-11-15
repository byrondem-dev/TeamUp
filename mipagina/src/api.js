// src/api.js

// Si no defines VITE_API_URL, quedará vacío y usará rutas relativas -> /api/... (proxy Vite)
const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function http(path, opts = {}) {
  const token = localStorage.getItem("token");
  const url = `${BASE}${path}`; // si BASE === "" => /api/...

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(opts.body ? { body: opts.body } : {}),
  });

  let body = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  }

  if (!res.ok) throw new Error((body && body.error) || `HTTP ${res.status}`);
  return res.status === 204 ? null : body;
}

export function apiGet(path, headers) {
  return http(path, { headers: headers || {} });
}

export function apiPost(path, data, headers) {
  return http(path, {
    method: "POST",
    body: JSON.stringify(data),
    headers: headers || {},
  });
}

// helper de querystring
const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

// API agrupada
export const Api = {
  // ====================
  // 🔐 AUTH
  // ====================
  register: ({ nombre, email, password, tipo }) =>
    http("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nombre, email, password, tipo }),
    }),

  login: (email, password) =>
    http("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => http("/api/auth/me"),

  // ====================
  // 🏟 CANCHAS
  // ====================
  // Lista de canchas activas (home / reservar)
  canchas: () => http("/api/canchas"),

  // Canshas del dueño logueado
  misCanchas: () => http("/api/canchas/mis"),

  // Crear cancha (dueño)
  crearCancha: (body) =>
    http("/api/canchas", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Actualizar datos básicos de la cancha
  actualizarCancha: (id, body) =>
    http(`/api/canchas/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  // Eliminar (o desactivar) una cancha
  eliminarCancha: (id) =>
    http(`/api/canchas/${id}`, {
      method: "DELETE",
    }),

  // Detalle de una cancha (para jugadores)
  canchaDetalle: (id) => http(`/api/canchas/${id}`),

  // Reservas de una cancha específica (panel del dueño)
  reservasCancha: (canchaId) => http(`/api/canchas/${canchaId}/reservas`),

  // Bloqueo de fechas / rangos de una cancha
  crearBloqueoCancha: (body) =>
    http(`/api/canchas/${body.cancha_id}/bloqueos`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Ocupación de una cancha para un día (reservas + partidos)
  ocupacionCancha: ({ cancha_id, fecha }) =>
    http(`/api/canchas/${cancha_id}/ocupacion${qs({ fecha })}`),

  // ====================
  // ⏰ DISPONIBILIDAD
  // ====================
  // Busca canchas disponibles según fecha/hora/duración
  disponibilidad: ({ fecha, hora, duracion = 60 }) =>
    http(`/api/disponibilidad${qs({ fecha, hora, duracion })}`),

  // ====================
  // 📅 RESERVAS
  // ====================
  // Crear reserva real en la BD (PagoReserva.jsx)
  crearReserva: (body) =>
    http("/api/reservas", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Reservas del usuario logueado (MisReservas.jsx)
  misReservas: () => http("/api/reservas/mis"),

  // ====================
  // ⚽ PARTIDOS
  // ====================
  // Listado básico de partidos (Resultados / BuscarPartido)
  // params puede tener: fecha, cancha_id, q, limit, offset
  partidos: (params = {}) => http(`/api/partidos${qs(params)}`),

  // Crear partido desde "Me falta uno"
  crearPartido: (body) =>
    http("/api/partidos", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Detalle de un partido concreto (PartidoDetalle.jsx)
  partidoDetalle: (id) => http(`/api/partidos/${id}`),

  // =========================
  // ⭐ MIS PARTIDOS / CHAT ⭐
  // =========================
  // Partidos donde soy organizador o participante
  misPartidos: () => http("/api/partidos/mios"),

  // Unirse a un partido
  unirsePartido: (id) =>
    http(`/api/partidos/${id}/unirse`, {
      method: "POST",
    }),

  // Salir de un partido
  salirPartido: (id) =>
    http(`/api/partidos/${id}/salir`, {
      method: "POST",
    }),

  // Lista de jugadores confirmados de un partido
  participantesPartido: (id) => http(`/api/partidos/${id}/participantes`),

  // Chat de un partido (listar mensajes)
  chatPartido: (id, params = {}) =>
    http(`/api/partidos/${id}/chat${qs(params)}`),

  // Enviar mensaje al chat del partido
  enviarMensajeChat: (id, mensaje) =>
    http(`/api/partidos/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ mensaje }),
    }),

  // ====================
  // 🧍 PERFIL JUGADOR
  // ====================
  // Perfil del jugador logueado (Editar mi perfil)
  perfil: () => http("/api/perfil"),

  // Guardar/actualizar perfil del jugador logueado
  guardarPerfil: (body) =>
    http("/api/perfil", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Perfil público de otro jugador por ID (para MisPartidos -> ver perfil)
  perfilJugador: (id) => http(`/api/perfil/${id}`),
};

export default Api;
