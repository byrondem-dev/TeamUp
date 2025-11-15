import { Router } from "express";
import pool from "../db/pool.js";
const router = Router();

const toMin = (hhmm) => { const [h,m]=hhmm.split(":").map(Number); return h*60+(m||0); };
const toHHMM = (mins) => `${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`;
const solapa = (aIni,aFin,bIni,bFin) => !(bFin <= aIni || bIni >= aFin);

router.get("/", async (req, res) => {
  try {
    const fecha = req.query.fecha;
    const horaFiltrar = req.query.hora || null;
    const dur = Number(req.query.duracion || 60);
    if (!fecha) return res.status(400).json({ error: "fecha es requerida" });

    const { rows: canchas } = await pool.query(`
      SELECT id, nombre, ubicacion, precio_base, foto
      FROM canchas
      WHERE activa = TRUE
      ORDER BY id DESC
    `);
    if (!canchas.length) return res.json([]);

    const canchaIds = canchas.map(c => c.id);
    const { rows: reservas } = await pool.query(
      `SELECT cancha_id, to_char(hora_inicio,'HH24:MI') ini, to_char(hora_fin,'HH24:MI') fin
       FROM reservas
       WHERE fecha = $1 AND cancha_id = ANY($2::int[])`,
      [fecha, canchaIds]
    );

    const map = new Map();
    for (const r of reservas) {
      if (!map.has(r.cancha_id)) map.set(r.cancha_id, []);
      map.get(r.cancha_id).push({ ini: r.ini, fin: r.fin });
    }

    const slots = [];
    for (let t = toMin("11:00"); t + dur <= toMin("23:00"); t += dur) slots.push(toHHMM(t));

    const fallbackImg = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop";
    const resp = canchas.map(c => {
      const reservasC = (map.get(c.id) || []).map(r => ({ ini: toMin(r.ini), fin: toMin(r.fin) }));
      const horarios = slots.filter(hh => {
        if (horaFiltrar && hh !== horaFiltrar) return false;
        const fin = toMin(hh) + dur;
        return !reservasC.some(r => solapa(r.ini, r.fin, toMin(hh), fin));
      });
      return {
        id: c.id,
        nombre: c.nombre,
        direccion: c.ubicacion,
        precio: c.precio_base,
        rating: 4.6,
        img: c.foto || fallbackImg,
        horarios
      };
    });

    res.json(resp);
  } catch {
    res.status(500).json({ error: "Error buscando disponibilidad" });
  }
});

export default router;
