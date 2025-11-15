import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db/pool.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/_ping", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ db: true, secret: !!process.env.JWT_SECRET }); }
  catch (e) { res.status(500).json({ db: false, secret: !!process.env.JWT_SECRET, msg: e.message }); }
});

router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password, tipo } = req.body || {};
    if (!nombre || !email || !password || !tipo) return res.status(400).json({ error: "Faltan campos" });
    const hash = await bcrypt.hash(password, 10);
    const q = `
      INSERT INTO usuarios (nombre, email, password, tipo)
      VALUES ($1,$2,$3,$4)
      RETURNING id, nombre, email, tipo, premium, fecha_registro
    `;
    const { rows } = await pool.query(q, [nombre, email, hash, tipo]);
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Email ya registrado" });
    console.error("REGISTER 500:", e);
    res.status(500).json({ error: "Error de servidor en registro" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Faltan campos" });
    const { rows } = await pool.query("SELECT id,email,password,tipo,nombre FROM usuarios WHERE email=$1", [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Credenciales inválidas" });
    const user = rows[0];
    if (!user.password || !String(user.password).startsWith("$2")) return res.status(401).json({ error: "Credenciales inválidas" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: "Falta JWT_SECRET" });

    const token = jwt.sign({ id: user.id, email: user.email, tipo: user.tipo }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, tipo: user.tipo } });
  } catch (e) {
    console.error("LOGIN 500:", e);
    res.status(500).json({ error: "Error de servidor en login" });
  }
});

router.get("/me", authRequired, (req, res) => res.json(req.user));

export default router;
  