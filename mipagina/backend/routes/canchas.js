// backend/routes/canchas.js
import { Router } from "express";
import pool from "../db/pool.js";
import { authRequired, onlyDueno } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/canchas
 * Lista de canchas activas (para todos)
 */
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        nombre,
        ubicacion,
        tipo,
        precio_base,
        precio_base AS precio,  -- alias para frontend
        foto,
        foto AS img,            -- alias para frontend
        activa,
        telefono,
        disponibilidad
      FROM canchas
      WHERE activa = true
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error("CANCHAS LIST 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * GET /api/canchas/mis
 * Solo dueños, sus canchas (solo activas)
 */
router.get("/mis", authRequired, onlyDueno, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        nombre,
        ubicacion,
        tipo,
        precio_base,
        precio_base AS precio,
        foto,
        foto AS img,
        activa,
        telefono,
        disponibilidad
      FROM canchas
      WHERE dueno_id = $1
        AND activa = true
      ORDER BY id DESC
    `,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error("MIS CANCHAS 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * GET /api/canchas/:id/ocupacion?fecha=YYYY-MM-DD
 * Ocupación de ese día (reservas + partidos + bloqueos)
 * ⚠️ IMPORTANTE: va antes de "/:id"
 */
router.get("/:id/ocupacion", async (req, res) => {
  const { id } = req.params;
  const { fecha } = req.query; // 'YYYY-MM-DD'

  if (!fecha) {
    return res.status(400).json({ error: "Falta parámetro fecha" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT hora_inicio, hora_fin, 'reserva'::text AS tipo
      FROM reservas
      WHERE cancha_id = $1
        AND fecha = $2
        AND (estado IS NULL OR estado <> 'cancelada')

      UNION ALL

      SELECT hora_inicio, hora_fin, 'partido'::text AS tipo
      FROM partidos
      WHERE cancha_id = $1
        AND fecha = $2

      UNION ALL

      SELECT
        COALESCE(hora_inicio, '00:00') AS hora_inicio,
        COALESCE(hora_fin,   '23:59') AS hora_fin,
        'bloqueo'::text AS tipo
      FROM bloqueos_cancha
      WHERE cancha_id = $1
        AND fecha = $2

      ORDER BY hora_inicio
    `,
      [id, fecha]
    );

    res.json(rows);
  } catch (e) {
    console.error("CANCHA OCUPACION 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * GET /api/canchas/:id/reservas
 * Reservas de una cancha (para el panel del dueño)
 */
router.get("/:id/reservas", authRequired, onlyDueno, async (req, res) => {
  const canchaId = Number(req.params.id);
  if (!canchaId) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const duenoId = req.user.id;

  try {
    // Verificamos que la cancha sea del dueño
    const check = await pool.query(
      "SELECT id FROM canchas WHERE id = $1 AND dueno_id = $2",
      [canchaId, duenoId]
    );
    if (!check.rows.length) {
      return res
        .status(404)
        .json({ error: "Cancha no encontrada o no eres el dueño." });
    }

    const { rows } = await pool.query(
      `
      SELECT
        r.id,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        r.estado,
        r.monto_total,
        u.nombre AS nombre_jugador,
        u.email  AS email_jugador
      FROM reservas r
      JOIN usuarios u ON u.id = r.usuario_id
      WHERE r.cancha_id = $1
      ORDER BY r.fecha DESC, r.hora_inicio DESC
    `,
      [canchaId]
    );

    res.json(rows);
  } catch (e) {
    console.error("CANCHA RESERVAS 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * POST /api/canchas/:id/bloqueos
 * Bloquear una fecha/rango horario para esa cancha (solo dueño)
 * Necesita tabla "bloqueos_cancha"
 */
router.post("/:id/bloqueos", authRequired, onlyDueno, async (req, res) => {
  const canchaId = Number(req.params.id);
  if (!canchaId) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const duenoId = req.user.id;
  const { fecha, hora_inicio, hora_fin, motivo } = req.body || {};

  if (!fecha || !hora_inicio || !hora_fin) {
    return res
      .status(400)
      .json({ error: "Faltan campos (fecha, hora_inicio, hora_fin)." });
  }

  try {
    // Chequeamos que la cancha sea del dueño
    const check = await pool.query(
      "SELECT id FROM canchas WHERE id = $1 AND dueno_id = $2",
      [canchaId, duenoId]
    );
    if (!check.rows.length) {
      return res
        .status(404)
        .json({ error: "Cancha no encontrada o no eres el dueño." });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO bloqueos_cancha (cancha_id, fecha, hora_inicio, hora_fin, motivo)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, cancha_id, fecha, hora_inicio, hora_fin, motivo
    `,
      [canchaId, fecha, hora_inicio, hora_fin, motivo || null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("CANCHA BLOQUEOS 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * GET /api/canchas/:id
 * Detalle de una cancha
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        nombre,
        ubicacion,
        tipo,
        precio_base,
        precio_base AS precio,
        foto,
        foto AS img,
        activa,
        telefono,
        disponibilidad,
        dueno_id
      FROM canchas
      WHERE id = $1
    `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cancha no encontrada" });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error("CANCHA DETALLE 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * PUT /api/canchas/:id
 * Actualizar datos básicos (solo dueño)
 */
router.put("/:id", authRequired, onlyDueno, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const duenoId = req.user.id;
  const { nombre, ubicacion, telefono, precio_base } = req.body || {};

  try {
    const { rows } = await pool.query(
      `
      UPDATE canchas
      SET
        nombre      = COALESCE($1, nombre),
        ubicacion   = COALESCE($2, ubicacion),
        telefono    = COALESCE($3, telefono),
        precio_base = COALESCE($4, precio_base)
      WHERE id = $5 AND dueno_id = $6
      RETURNING
        id,
        nombre,
        ubicacion,
        tipo,
        precio_base,
        precio_base AS precio,
        foto,
        foto AS img,
        activa,
        telefono,
        disponibilidad,
        dueno_id
    `,
      [
        nombre ?? null,
        ubicacion ?? null,
        telefono ?? null,
        precio_base !== undefined ? Number(precio_base) : null,
        id,
        duenoId,
      ]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ error: "Cancha no encontrada o no eres el dueño." });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error("CANCHA UPDATE 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * DELETE /api/canchas/:id
 * Borrado FÍSICO: se elimina de la BD (solo dueño)
 */
router.delete("/:id", authRequired, onlyDueno, async (req, res) => {
  const canchaId = Number(req.params.id);
  if (!canchaId) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const duenoId = req.user.id;

  try {
    // 1) Revisamos que la cancha exista y sea del dueño
    const check = await pool.query(
      "SELECT id FROM canchas WHERE id = $1 AND dueno_id = $2",
      [canchaId, duenoId]
    );
    if (!check.rows.length) {
      return res
        .status(404)
        .json({ error: "Cancha no encontrada o no eres el dueño." });
    }

    // 2) Borramos reservas asociadas a esa cancha
    await pool.query("DELETE FROM reservas WHERE cancha_id = $1", [canchaId]);

    // 3) Borramos la cancha de verdad de la tabla
    const del = await pool.query(
      "DELETE FROM canchas WHERE id = $1 AND dueno_id = $2",
      [canchaId, duenoId]
    );

    if (!del.rowCount) {
      return res
        .status(404)
        .json({ error: "Cancha no encontrada o no eres el dueño." });
    }

    return res.status(204).send();
  } catch (e) {
    console.error("CANCHA DELETE 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * POST /api/canchas
 * Crear nueva cancha (solo dueños)
 */
router.post("/", authRequired, onlyDueno, async (req, res) => {
  try {
    const {
      nombre,
      ubicacion,
      tipo,
      precio_base,
      foto,
      telefono,
      disponibilidad,
      activa = true,
    } = req.body || {};

    if (!nombre || !precio_base) {
      return res.status(400).json({ error: "Faltan nombre o precio" });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO canchas
        (nombre, ubicacion, dueno_id, tipo, precio_base, foto, activa, telefono, disponibilidad)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING
        id,
        nombre,
        ubicacion,
        tipo,
        precio_base,
        precio_base AS precio,
        foto,
        foto AS img,
        activa,
        telefono,
        disponibilidad
    `,
      [
        nombre,
        ubicacion || null,
        req.user.id,
        tipo || "futbol7",
        precio_base,
        foto || null,
        activa,
        telefono || null,
        disponibilidad || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("CREAR CANCHA 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

export default router;
