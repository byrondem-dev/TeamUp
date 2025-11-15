import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");
    if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Token requerido" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, tipo: payload.tipo };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function onlyDueno(req, res, next) {
  if (req.user?.tipo !== "dueno") return res.status(403).json({ error: "Solo dueños" });
  next();
}
