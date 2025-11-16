// backend/routes/reservas.js
import { Router } from "express";
import pool from "../db/pool.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/reservas
 * Body esperado:
 *  - cancha_id
 *  - fecha (YYYY-MM-DD)
 *  - hora_inicio (HH:mm)
 *  - hora_fin (HH:mm)
 *  - monto_total (opcional, number)
 *
 * Si no viene monto_total, se calcula con precio_base y la duración.
 */
router.post("/", authRequired, async (req, res) => {
  try {
    const { cancha_id, fecha, hora_inicio, hora_fin, monto_total } =
      req.body || {};

    if (!cancha_id || !fecha || !hora_inicio || !hora_fin) {
      return res
        .status(400)
        .json({ error: "Faltan cancha_id, fecha, hora_inicio o hora_fin" });
    }

    // Traemos precio_base de la cancha
    const c = await pool.query(
      "SELECT precio_base FROM canchas WHERE id=$1",
      [cancha_id]
    );
    if (!c.rows.length) {
      return res.status(404).json({ error: "Cancha no encontrada" });
    }

    const precioBase = Number(c.rows[0].precio_base) || 0;

    // Helpers para calcular duración (por si no mandas monto_total)
    const toMin = (t) => {
      const [h, m] = String(t).split(":").map(Number);
      return h * 60 + (m || 0);
    };

    let monto = 0;

    if (monto_total !== undefined && monto_total !== null) {
      // Si el frontend ya calculó el precio total (por varios tramos), lo usamos
      monto = Number(monto_total) || 0;
    } else {
      // Si no, lo calculamos: duración en horas * precio_base
      const durMin = toMin(hora_fin) - toMin(hora_inicio);
      const factorHoras = durMin / 60;
      monto = Math.round(precioBase * factorHoras);
    }

    const q = `
      INSERT INTO reservas
        (cancha_id, usuario_id, fecha, hora_inicio, hora_fin, estado, monto_total)
      VALUES
        ($1, $2, $3, $4, $5, 'pagada', $6)
      RETURNING id, cancha_id, usuario_id, fecha, hora_inicio, hora_fin, estado, monto_total
    `;

    const { rows } = await pool.query(q, [
      cancha_id,
      req.user.id,
      fecha,
      hora_inicio,
      hora_fin,
      monto,
    ]);

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("CREAR RESERVA 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * GET /api/reservas/mis
 * Lista las reservas del usuario logueado
 */
router.get("/mis", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    const q = `
      SELECT
        r.id,
        r.cancha_id AS cancha_id,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        r.estado,
        r.monto_total,
        c.nombre    AS cancha_nombre,
        c.ubicacion AS ubicacion
      FROM reservas r
      JOIN canchas c ON c.id = r.cancha_id
      WHERE r.usuario_id = $1
      ORDER BY r.fecha DESC, r.hora_inicio ASC
    `;

    const { rows } = await pool.query(q, [userId]);
    res.json(rows);
  } catch (e) {
    console.error("MIS RESERVAS 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * DELETE /api/reservas/mis/pasadas
 * Borra TODAS las reservas PASADAS del usuario logueado
 * (definimos "pasada" como fecha < hoy)
 */
router.delete("/mis/pasadas", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      DELETE FROM reservas
      WHERE usuario_id = $1
        AND fecha < CURRENT_DATE
      RETURNING id
    `,
      [userId]
    );

    return res.json({
      borradas: rows.map((r) => r.id),
    });
  } catch (e) {
    console.error("DELETE /reservas/mis/pasadas 500:", e);
    return res
      .status(500)
      .json({ error: "Error al borrar reservas pasadas" });
  }
});

/**
 * DELETE /api/reservas/:id
 * Borra UNA reserva, solo si pertenece al usuario logueado
 */
router.delete("/:id", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "ID de reserva inválido" });
    }

    const { rows } = await pool.query(
      `
      DELETE FROM reservas
      WHERE id = $1
        AND usuario_id = $2
      RETURNING *
    `,
      [id, userId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Reserva no encontrada o no es tuya." });
    }

    return res.json({ ok: true, reserva: rows[0] });
  } catch (e) {
    console.error("DELETE /reservas/:id 500:", e);
    return res.status(500).json({ error: "Error al borrar la reserva" });
  }
});

export default router;
