// backend/server.js
import "dotenv/config.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRouter from "./routes/auth.js";
import canchasRouter from "./routes/canchas.js";
import reservasRouter from "./routes/reservas.js";
import partidosRouter from "./routes/partidos.js"; // 👈 partidos
import perfilRouter from "./routes/perfil.js";      // 👈 perfil futbolero

import pool from "./db/pool.js";

const app = express();

// 👇 Si usas Vite (5173) podrías usar origin: "http://localhost:5173"
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());
app.use(morgan("dev"));

// 🔐 Auth
app.use("/api/auth", authRouter);

// 🏟 Canchas
app.use("/api/canchas", canchasRouter);

// 📌 Reservas
app.use("/api/reservas", reservasRouter);

// ⚽ Partidos
app.use("/api/partidos", partidosRouter);

// 🧍‍♂️ Perfil futbolero avanzado
app.use("/api/perfil", perfilRouter);

// 📅 Disponibilidad (canchas activas, respetando reservas + bloqueos)
app.get("/api/disponibilidad", async (req, res) => {
  try {
    const { fecha, hora, duracion } = req.query;
    if (!fecha) {
      return res
        .status(400)
        .json({ error: "Falta fecha (YYYY-MM-DD)" });
    }

    const step = Number(duracion) || 60;

    // 1) Todas las canchas activas
    const canchas = (
      await pool.query(
        `
        SELECT id,
               nombre,
               ubicacion,
               tipo,
               precio_base,
               foto,
               activa,
               telefono,
               disponibilidad
        FROM canchas
        WHERE activa = true
        ORDER BY id DESC
      `
      )
    ).rows;

    // 2) Reservas de ese día
    const reservas = (
      await pool.query(
        `
        SELECT cancha_id, hora_inicio, hora_fin
        FROM reservas
        WHERE fecha = $1
      `,
        [fecha]
      )
    ).rows;

    // 3) Bloqueos de ese día
    const bloqueos = (
      await pool.query(
        `
        SELECT
          cancha_id,
          COALESCE(hora_inicio, '00:00') AS hora_inicio,
          COALESCE(hora_fin,   '23:59') AS hora_fin
        FROM bloqueos_cancha
        WHERE fecha = $1
      `,
        [fecha]
      )
    ).rows;

    // 4) Día de la semana: 0=Dom, 1=Lun, ...
    const diaIdx = new Date(fecha + "T00:00:00").getDay();
    const diaKey = ["D", "L", "M", "X", "J", "V", "S"][diaIdx];

    // 5) Agrupamos reservas + bloqueos por cancha
    const byCancha = reservas.reduce((acc, r) => {
      (acc[r.cancha_id] ||= []).push([r.hora_inicio, r.hora_fin]);
      return acc;
    }, {});

    bloqueos.forEach((b) => {
      (acc => {
        (acc[b.cancha_id] ||= []).push([b.hora_inicio, b.hora_fin]);
        return acc;
      })(byCancha);
    });

    // Helpers para manejar horas en minutos
    const toMin = (t) => {
      const [h, m] = String(t).split(":").map(Number);
      return h * 60 + (m || 0);
    };
    const fromMin = (x) =>
      `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(
        x % 60
      ).padStart(2, "0")}`;
    const overlap = (aStart, aEnd, bStart, bEnd) =>
      aStart < bEnd && aEnd > bStart;

    // 6) Resultado por cancha
    const result = canchas.map((c) => {
      const disp = c.disponibilidad?.[diaKey];
      let horarios = [];

      if (disp?.habilitado) {
        const start = toMin(disp.inicio || "08:00");
        const end = toMin(disp.fin || "22:00");

        // Slots cada 60 minutos, con duración "step"
        for (let t = start; t + step <= end; t += 60) {
          const s = t;
          const e = t + step;

          const booked = (byCancha[c.id] || []).some(([hs, hf]) =>
            overlap(s, e, toMin(hs), toMin(hf))
          );

          if (!booked) {
            horarios.push(fromMin(s));
          }
        }
      }

      // Si viene una hora específica, filtramos
      if (hora) {
        horarios = horarios.filter((h) => h === hora);
      }

      return {
        id: c.id,
        nombre: c.nombre,
        direccion: c.ubicacion,
        ubicacion: c.ubicacion,
        tipo: c.tipo,
        precio: c.precio_base,
        precio_base: c.precio_base,
        img: c.foto,
        telefono: c.telefono,
        horarios,
      };
    });

    res.json(result);
  } catch (e) {
    console.error("DISPONIBILIDAD 500:", e);
    res.status(500).json({ error: "Error de servidor" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`API lista en http://localhost:${PORT}`)
);
