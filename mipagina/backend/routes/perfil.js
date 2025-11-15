// backend/routes/perfil.js
import { Router } from "express";
import pool from "../db/pool.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/perfil
 * Devuelve el perfil del usuario logueado
 */
router.get("/", authRequired, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        u.nombre,
        pj.edad,
        pj.foto,
        pj.biografia,
        pj.disponibilidad,
        pj.posiciones,
        pj.videos
      FROM usuarios u
      LEFT JOIN perfiles_jugador pj ON pj.usuario_id = u.id
      WHERE u.id = $1
      `,
      [userId]
    );

    if (!rows.length) {
      // Usuario existe pero aún no tiene perfil_jugador
      return res.json(null);
    }

    const row = rows[0];

    let disponibilidad = {};
    let posiciones = {};
    let videos = [null, null, null];

    // Parseamos TEXT -> JSON
    if (row.disponibilidad) {
      try {
        const parsed = JSON.parse(row.disponibilidad);
        if (parsed && typeof parsed === "object") disponibilidad = parsed;
      } catch (e) {
        console.warn("Error parseando disponibilidad:", e);
      }
    }

    if (row.posiciones) {
      try {
        const parsed = JSON.parse(row.posiciones);
        if (parsed && typeof parsed === "object") posiciones = parsed;
      } catch (e) {
        console.warn("Error parseando posiciones:", e);
      }
    }

    if (row.videos) {
      try {
        const parsed = JSON.parse(row.videos);
        if (Array.isArray(parsed)) {
          videos = [...parsed, ...Array(3 - parsed.length).fill(null)].slice(
            0,
            3
          );
        }
      } catch (e) {
        console.warn("Error parseando videos:", e);
      }
    }

    res.json({
      imagen: row.foto || null,
      nombre: row.nombre || "",
      edad: row.edad || "",
      bio: row.biografia || "",
      posiciones,
      disponibilidad,
      videos,
    });
  } catch (e) {
    console.error("PERFIL GET 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * POST /api/perfil
 * Crea/actualiza el perfil del usuario logueado
 */
router.post("/", authRequired, async (req, res) => {
  const userId = req.user.id;
  const {
    imagen,
    nombre,
    edad,
    bio,
    posiciones,
    disponibilidad,
    videos,
  } = req.body;

  try {
    // Actualizar nombre en usuarios
    if (typeof nombre === "string" && nombre.trim() !== "") {
      await pool.query("UPDATE usuarios SET nombre = $1 WHERE id = $2", [
        nombre.trim(),
        userId,
      ]);
    }

    const dispStr = JSON.stringify(disponibilidad || {});
    const posStr = JSON.stringify(posiciones || {});
    const vidsArr = Array.isArray(videos)
      ? [...videos, ...Array(3 - videos.length).fill(null)].slice(0, 3)
      : [null, null, null];
    const vidsStr = JSON.stringify(vidsArr);

    // Upsert en perfiles_jugador
    await pool.query(
      `
      INSERT INTO perfiles_jugador
        (usuario_id, foto, edad, biografia, disponibilidad, posiciones, videos)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (usuario_id)
      DO UPDATE SET
        foto           = EXCLUDED.foto,
        edad           = EXCLUDED.edad,
        biografia      = EXCLUDED.biografia,
        disponibilidad = EXCLUDED.disponibilidad,
        posiciones     = EXCLUDED.posiciones,
        videos         = EXCLUDED.videos
      `,
      [
        userId,
        imagen || null,
        edad ? Number(edad) : null,
        bio || null,
        dispStr,
        posStr,
        vidsStr,
      ]
    );

    res.json({
      imagen: imagen || null,
      nombre: nombre || "",
      edad: edad || "",
      bio: bio || "",
      posiciones: posiciones || {},
      disponibilidad: disponibilidad || {},
      videos: vidsArr,
    });
  } catch (e) {
    console.error("PERFIL POST 500:", e);
    res.status(500).json({ error: "Error al guardar perfil" });
  }
});

/**
 * GET /api/perfil/:id
 * Devuelve el perfil público de un jugador por su usuario_id
 */
router.get("/:id", authRequired, async (req, res) => {
  const usuarioId = Number(req.params.id || 0);

  if (!usuarioId) {
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        u.id,
        u.nombre,
        u.email,
        pj.edad,
        pj.foto,
        pj.biografia,
        pj.disponibilidad,
        pj.posiciones,
        pj.videos
      FROM usuarios u
      LEFT JOIN perfiles_jugador pj ON pj.usuario_id = u.id
      WHERE u.id = $1
      `,
      [usuarioId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Perfil no encontrado" });
    }

    const row = rows[0];

    let disponibilidad = {};
    let posiciones = {};
    let videos = [null, null, null];

    if (row.disponibilidad) {
      try {
        const parsed = JSON.parse(row.disponibilidad);
        if (parsed && typeof parsed === "object") disponibilidad = parsed;
      } catch (e) {
        console.warn("Error parseando disponibilidad (/:id):", e);
      }
    }

    if (row.posiciones) {
      try {
        const parsed = JSON.parse(row.posiciones);
        if (parsed && typeof parsed === "object") posiciones = parsed;
      } catch (e) {
        console.warn("Error parseando posiciones (/:id):", e);
      }
    }

    if (row.videos) {
      try {
        const parsed = JSON.parse(row.videos);
        if (Array.isArray(parsed)) {
          videos = [...parsed, ...Array(3 - parsed.length).fill(null)].slice(
            0,
            3
          );
        }
      } catch (e) {
        console.warn("Error parseando videos (/:id):", e);
      }
    }

    res.json({
      id: row.id,
      email: row.email || "",
      imagen: row.foto || null,
      nombre: row.nombre || "",
      edad: row.edad || "",
      bio: row.biografia || "",
      posiciones,
      disponibilidad,
      videos,
    });
  } catch (e) {
    console.error("PERFIL GET /:id 500:", e);
    res.status(500).json({ error: "Error obteniendo perfil de jugador" });
  }
});

export default router;
  