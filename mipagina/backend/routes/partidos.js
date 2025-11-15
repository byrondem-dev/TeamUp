// backend/routes/partidos.js
import { Router } from "express";
import pool from "../db/pool.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/partidos
 * Filtros: ?fecha=YYYY-MM-DD [&cancha_id=] [&q=] [&limit=] [&offset=]
 * No repite partidos: DISTINCT ON (cancha_id, fecha, hora_inicio)
 */
router.get("/", async (req, res) => {
  try {
    const { fecha, cancha_id, q, limit = 50, offset = 0 } = req.query;

    const where = [];
    const params = [];
    let i = 1;

    if (fecha) {
      where.push(`p.fecha = $${i++}`);
      params.push(fecha);
    }
    if (cancha_id) {
      where.push(`p.cancha_id = $${i++}`);
      params.push(Number(cancha_id));
    }
    if (q && q.trim()) {
      where.push(
        `(c.nombre ILIKE $${i} OR c.ubicacion ILIKE $${i} OR p.descripcion ILIKE $${i})`
      );
      params.push(`%${q.trim()}%`);
      i++;
    }

    const sql = `
      SELECT DISTINCT ON (p.cancha_id, p.fecha, p.hora_inicio)
             p.id,
             p.cancha_id,
             c.nombre AS cancha_nombre,
             c.ubicacion,
             to_char(p.fecha, 'YYYY-MM-DD')           AS fecha,
             to_char(p.hora_inicio,'HH24:MI')         AS hora_inicio,
             to_char(p.hora_fin,'HH24:MI')            AS hora_fin,
             p.vacantes,
             p.descripcion,
             p.organizador_id,
             u.nombre AS organizador_nombre,
             COALESCE(pp.confirmados, 0) AS confirmados
      FROM partidos p
      JOIN canchas c ON c.id = p.cancha_id
      LEFT JOIN usuarios u ON u.id = p.organizador_id
      LEFT JOIN (
        SELECT partido_id, COUNT(*)::int AS confirmados
        FROM participantes_partido
        WHERE estado = 'confirmado'
        GROUP BY partido_id
      ) pp ON pp.partido_id = p.id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY p.cancha_id, p.fecha, p.hora_inicio, p.id DESC
      LIMIT $${i++} OFFSET $${i++};
    `;

    params.push(Number(limit), Number(offset));

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error("GET /api/partidos", e);
    res.status(500).json({ error: "Error listando partidos" });
  }
});

/**
 * POST /api/partidos
 *
 * Un jugador publica un partido a partir de una reserva
 * (por ejemplo, al pulsar "Me falta uno" en MisReservas).
 */
router.post("/", authRequired, async (req, res) => {
  try {
    const {
      cancha_id,
      fecha,
      hora_inicio,
      hora_fin,
      vacantes,
      descripcion,
    } = req.body || {};

    if (!cancha_id || !fecha || !hora_inicio || !hora_fin || !vacantes) {
      return res.status(400).json({
        error:
          "Faltan campos: cancha_id, fecha, hora_inicio, hora_fin o vacantes",
      });
    }

    const vacantesNum = Number(vacantes);
    if (!Number.isFinite(vacantesNum) || vacantesNum <= 0) {
      return res
        .status(400)
        .json({ error: "vacantes debe ser un número mayor a 0" });
    }

    // Confirmar que la cancha exista
    const cancha = await pool.query(
      "SELECT id, nombre FROM canchas WHERE id = $1",
      [cancha_id]
    );
    if (!cancha.rows.length) {
      return res.status(404).json({ error: "Cancha no encontrada" });
    }

    const q = `
      INSERT INTO partidos
        (cancha_id, fecha, hora_inicio, hora_fin, organizador_id, vacantes, descripcion)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, cancha_id, fecha, hora_inicio, hora_fin, organizador_id, vacantes, descripcion
    `;

    const { rows } = await pool.query(q, [
      cancha_id,
      fecha,
      hora_inicio,
      hora_fin,
      req.user.id, // organizador_id
      vacantesNum,
      descripcion || null,
    ]);

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("POST /api/partidos", e);
    res.status(500).json({ error: "Error creando partido" });
  }
});

/**
 * GET /api/partidos/mios
 *
 * Partidos donde:
 *  - soy organizador  (partidos.organizador_id = user)
 *  - o estoy inscrito como participante_partido.estado = 'confirmado'
 */
router.get("/mios", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT
        p.id,
        p.cancha_id,
        c.nombre       AS cancha_nombre,
        c.ubicacion    AS ubicacion,
        to_char(p.fecha,'YYYY-MM-DD')    AS fecha,
        to_char(p.hora_inicio,'HH24:MI') AS hora_inicio,
        to_char(p.hora_fin,'HH24:MI')    AS hora_fin,
        p.vacantes,
        p.descripcion,
        p.organizador_id,
        uo.nombre      AS organizador_nombre,
        COALESCE(pp.confirmados, 0) AS confirmados,
        (p.organizador_id = $1)     AS soy_organizador
      FROM partidos p
      JOIN canchas c ON c.id = p.cancha_id
      LEFT JOIN usuarios uo ON uo.id = p.organizador_id
      LEFT JOIN (
        SELECT partido_id, COUNT(*)::int AS confirmados
        FROM participantes_partido
        WHERE estado = 'confirmado'
        GROUP BY partido_id
      ) pp ON pp.partido_id = p.id
      WHERE
        p.organizador_id = $1
        OR EXISTS (
          SELECT 1
          FROM participantes_partido pr
          WHERE pr.partido_id = p.id
            AND pr.usuario_id = $1
            AND pr.estado = 'confirmado'
        )
      ORDER BY p.fecha ASC, p.hora_inicio ASC, p.id ASC
    `;

    const { rows } = await pool.query(sql, [userId]);
    res.json(rows);
  } catch (e) {
    console.error("GET /api/partidos/mios", e);
    res.status(500).json({ error: "Error listando tus partidos" });
  }
});

/**
 * POST /api/partidos/:id/unirse
 *
 * El usuario logueado se inscribe en el partido.
 */
router.post("/:id/unirse", authRequired, async (req, res) => {
  try {
    const partidoId = Number(req.params.id || 0);
    const userId = req.user.id;

    if (!partidoId) {
      return res.status(400).json({ error: "ID de partido inválido" });
    }

    // ¿Ya está inscrito?
    const ya = await pool.query(
      `
      SELECT 1
      FROM participantes_partido
      WHERE partido_id = $1
        AND usuario_id = $2
        AND estado = 'confirmado'
    `,
      [partidoId, userId]
    );
    if (ya.rows.length) {
      return res.status(400).json({ error: "Ya estás inscrito en este partido" });
    }

    // Info de cupos
    const info = await pool.query(
      `
      SELECT
        p.id,
        p.vacantes,
        COALESCE(pp.confirmados, 0) AS confirmados
      FROM partidos p
      LEFT JOIN (
        SELECT partido_id, COUNT(*)::int AS confirmados
        FROM participantes_partido
        WHERE estado = 'confirmado'
        GROUP BY partido_id
      ) pp ON pp.partido_id = p.id
      WHERE p.id = $1
    `,
      [partidoId]
    );

    if (!info.rows.length) {
      return res.status(404).json({ error: "Partido no encontrado" });
    }

    const { vacantes, confirmados } = info.rows[0];
    const libres = Number(vacantes) - Number(confirmados);
    if (!Number.isFinite(libres) || libres <= 0) {
      return res.status(400).json({ error: "El partido está completo" });
    }

    // Inserta participación
    const ins = await pool.query(
      `
      INSERT INTO participantes_partido (partido_id, usuario_id, estado)
      VALUES ($1, $2, 'confirmado')
      RETURNING id, partido_id, usuario_id, estado, creado_en
    `,
      [partidoId, userId]
    );

    // Recontar confirmados
    const cnt = await pool.query(
      `
      SELECT COUNT(*)::int AS confirmados
      FROM participantes_partido
      WHERE partido_id = $1
        AND estado = 'confirmado'
    `,
      [partidoId]
    );

    res.status(201).json({
      ok: true,
      participacion: ins.rows[0],
      confirmados: cnt.rows[0]?.confirmados ?? 0,
    });
  } catch (e) {
    console.error("POST /api/partidos/:id/unirse", e);
    res.status(500).json({ error: "Error al unirse al partido" });
  }
});

/**
 * POST /api/partidos/:id/salir
 *
 * El usuario logueado se baja del partido (estado = 'baja')
 */
router.post("/:id/salir", authRequired, async (req, res) => {
  try {
    const partidoId = Number(req.params.id || 0);
    const userId = req.user.id;

    if (!partidoId) {
      return res.status(400).json({ error: "ID de partido inválido" });
    }

    const upd = await pool.query(
      `
      UPDATE participantes_partido
      SET estado = 'baja'
      WHERE partido_id = $1
        AND usuario_id = $2
        AND estado = 'confirmado'
      RETURNING id
    `,
      [partidoId, userId]
    );

    if (!upd.rowCount) {
      return res
        .status(400)
        .json({ error: "No estabas inscrito en este partido" });
    }

    const cnt = await pool.query(
      `
      SELECT COUNT(*)::int AS confirmados
      FROM participantes_partido
      WHERE partido_id = $1
        AND estado = 'confirmado'
    `,
      [partidoId]
    );

    res.json({
      ok: true,
      confirmados: cnt.rows[0]?.confirmados ?? 0,
    });
  } catch (e) {
    console.error("POST /api/partidos/:id/salir", e);
    res.status(500).json({ error: "Error al salir del partido" });
  }
});

/**
 * GET /api/partidos/:id/participantes
 *
 * Lista los jugadores confirmados de un partido + datos de su perfil futbolero
 */
router.get("/:id/participantes", authRequired, async (req, res) => {
  try {
    const partidoId = Number(req.params.id || 0);
    if (!partidoId) {
      return res.status(400).json({ error: "ID de partido inválido" });
    }

    const q = `
      SELECT
        pp.id,
        pp.partido_id,
        pp.usuario_id,
        pp.estado,
        pp.creado_en,
        u.nombre                    AS usuario_nombre,
        u.email                     AS usuario_email,
        pf.imagen,
        COALESCE(pf.nombre, u.nombre) AS perfil_nombre,
        pf.edad,
        pf.bio,
        pf.posiciones,
        pf.disponibilidad,
        pf.videos
      FROM participantes_partido pp
      JOIN usuarios u           ON u.id = pp.usuario_id
      LEFT JOIN perfiles_futbol pf ON pf.usuario_id = pp.usuario_id
      WHERE pp.partido_id = $1
        AND pp.estado = 'confirmado'
      ORDER BY pp.id ASC
    `;

    const { rows } = await pool.query(q, [partidoId]);
    res.json(rows);
  } catch (e) {
    console.error("GET /api/partidos/:id/participantes", e);
    res.status(500).json({ error: "Error listando participantes" });
  }
});

/**
 * GET /api/partidos/:id/chat
 *
 * Lista mensajes de chat del partido.
 */
router.get("/:id/chat", authRequired, async (req, res) => {
  try {
    const partidoId = Number(req.params.id || 0);
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);

    if (!partidoId) {
      return res.status(400).json({ error: "ID de partido inválido" });
    }

    const q = `
      SELECT
        m.id,
        m.partido_id,
        m.usuario_id,
        m.mensaje,
        m.creado_en,
        u.nombre AS usuario_nombre
      FROM mensajes_partido m
      JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.partido_id = $1
      ORDER BY m.creado_en ASC, m.id ASC
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await pool.query(q, [partidoId, limit, offset]);
    res.json(rows);
  } catch (e) {
    console.error("GET /api/partidos/:id/chat", e);
    res.status(500).json({ error: "Error listando mensajes de chat" });
  }
});

/**
 * POST /api/partidos/:id/chat
 *
 * Enviar mensaje al chat del partido.
 * Solo organizador o participantes confirmados pueden escribir.
 */
router.post("/:id/chat", authRequired, async (req, res) => {
  try {
    const partidoId = Number(req.params.id || 0);
    const userId = req.user.id;
    const mensajeRaw = (req.body?.mensaje || "").trim();

    if (!partidoId) {
      return res.status(400).json({ error: "ID de partido inválido" });
    }
    if (!mensajeRaw) {
      return res.status(400).json({ error: "El mensaje no puede estar vacío" });
    }

    // Verificar que el partido exista y que el user pertenezca
    const permiso = await pool.query(
      `
      SELECT 1
      FROM partidos p
      WHERE p.id = $1
        AND p.organizador_id = $2
      UNION
      SELECT 1
      FROM participantes_partido pp
      WHERE pp.partido_id = $1
        AND pp.usuario_id = $2
        AND pp.estado = 'confirmado'
    `,
      [partidoId, userId]
    );

    if (!permiso.rows.length) {
      return res.status(403).json({
        error:
          "No tienes permiso para escribir en el chat de este partido",
      });
    }

    const ins = await pool.query(
      `
      INSERT INTO mensajes_partido (partido_id, usuario_id, mensaje)
      VALUES ($1, $2, $3)
      RETURNING id, partido_id, usuario_id, mensaje, creado_en
    `,
      [partidoId, userId, mensajeRaw]
    );

    const u = await pool.query(
      "SELECT nombre FROM usuarios WHERE id = $1",
      [userId]
    );

    const msg = ins.rows[0];
    msg.usuario_nombre = u.rows[0]?.nombre || "Jugador";

    res.status(201).json(msg);
  } catch (e) {
    console.error("POST /api/partidos/:id/chat", e);
    res.status(500).json({ error: "Error enviando mensaje" });
  }
});

/**
 * GET /api/partidos/:id
 *
 * Detalle de un partido concreto (para PartidoDetalle.jsx)
 * ⚠️ IMPORTANTE: esta ruta va AL FINAL para no chocar con /mios, /unirse, etc.
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const sql = `
      SELECT
        p.id,
        p.cancha_id,
        to_char(p.fecha, 'YYYY-MM-DD')      AS fecha,
        to_char(p.hora_inicio,'HH24:MI')    AS hora_inicio,
        to_char(p.hora_fin,'HH24:MI')       AS hora_fin,
        p.vacantes,
        p.descripcion,
        p.organizador_id,
        u.nombre AS organizador_nombre,
        u.email  AS organizador_email,
        c.nombre    AS cancha_nombre,
        c.ubicacion,
        c.tipo,
        c.precio_base,
        c.foto,
        COALESCE(pp.confirmados, 0) AS confirmados
      FROM partidos p
      LEFT JOIN usuarios u ON u.id = p.organizador_id
      JOIN canchas c ON c.id = p.cancha_id
      LEFT JOIN (
        SELECT partido_id, COUNT(*)::int AS confirmados
        FROM participantes_partido
        WHERE estado = 'confirmado'
        GROUP BY partido_id
      ) pp ON pp.partido_id = p.id
      WHERE p.id = $1
    `;

    const { rows } = await pool.query(sql, [id]);
    if (!rows.length) {
      return res.status(404).json({ error: "Partido no encontrado" });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error("GET /api/partidos/:id", e);
    res.status(500).json({ error: "Error obteniendo partido" });
  }
});

export default router;
