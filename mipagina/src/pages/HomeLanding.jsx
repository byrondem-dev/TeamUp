import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function HomeLanding() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState(""); // "dueno" | "jugador" | ""
  const navigate = useNavigate();

  useEffect(() => {
    const auth =
      localStorage.getItem("isAuthenticated") === "true" ||
      !!localStorage.getItem("token");
    const emailLS = localStorage.getItem("userEmail") || "";
    let u = {};
    try { u = JSON.parse(localStorage.getItem("user") || "{}"); } catch {}
    const email = u?.email || emailLS;
    const r = u?.tipo || localStorage.getItem("userRole") || "";
    setIsAuthenticated(auth);
    setUserEmail(email);
    setRole(r);
  }, []);

  const userLabel = useMemo(
    () => (role === "dueno" ? "Dueño" : role === "jugador" ? "Jugador" : ""),
    [role]
  );

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setUserEmail("");
    setRole("");
    navigate("/");
  };

  // Barra
  const NAV_HEIGHT = 40;
  const RIGHT_SAFE = 32;
  const BTN_H = 36;

  return (
    <div style={{ scrollBehavior: "smooth", fontFamily: "'Poppins', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rubik+Wet+Paint&display=swap"
        rel="stylesheet"
      />

      {/* NAVBAR */}
      <header
        className="navbar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: NAV_HEIGHT,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 28,
          paddingRight: 28 + RIGHT_SAFE,
          background: "linear-gradient(180deg, rgba(0,0,0,.78), rgba(0,0,0,.58))",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          borderBottom: "1px solid rgba(255,105,180,.35)",
          boxShadow: "0 8px 22px rgba(0,0,0,.45), inset 0 -1px 0 rgba(255,255,255,.05)",
        }}
      >
        {/* Logo + marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="logo"
            style={{ width: 40, height: 40 }}
          />
          <span
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: "2rem",
              color: "#ff69b4",
              letterSpacing: "1px",
              lineHeight: 1,
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            TEAMUP
          </span>
        </div>

        {/* Acciones derecha */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
            paddingRight: RIGHT_SAFE,
          }}
        >
          {isAuthenticated ? (
            <>
              {/* Email pill */}
              <span
                title={userEmail}
                style={{
                  maxWidth: 340,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background:
                    "linear-gradient(180deg, rgba(255,105,180,.15), rgba(255,105,180,.08))",
                  color: "#f0dbe5",
                  border: "1.5px solid rgba(255,105,180,0.35)",
                  boxShadow: "0 0 0 3px rgba(255,105,180,0.08) inset",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 16, color: "#c9a0b5" }}>👤</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userEmail || "Sesión iniciada"}
                </span>
              </span>

              {/* Chip de rol */}
              {userLabel ? (
                <span
                  style={{
                    background: "linear-gradient(90deg, #ff69b4, #ff1493)",
                    color: "#000",
                    fontWeight: 900,
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.2)",
                    boxShadow: "0 2px 8px rgba(255,20,147,.35)",
                    textTransform: "capitalize",
                  }}
                >
                  {userLabel}
                </span>
              ) : null}

              {/* Ver Perfil */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/perfil"); }}
                className="btn-anim btn-rose"
                style={{
                  height: BTN_H,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: "2px solid #ff69b4",
                  color: "#ff69b4",
                  background: "transparent",
                  fontWeight: 700,
                  position: "relative",
                  overflow: "hidden",
                  lineHeight: 1,
                  boxSizing: "border-box",
                  cursor: "pointer"
                }}
              >
                Ver Perfil
              </button>

              {/* Cerrar Sesión */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); }}
                className="btn-anim btn-red"
                style={{
                  height: BTN_H,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: "2px solid #ff3b3b",
                  color: "#ff3b3b",
                  background: "transparent",
                  fontWeight: 700,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  lineHeight: 1,
                  boxSizing: "border-box",
                }}
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              {/* Iniciar Sesión */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/login"); }}
                className="btn-anim btn-rose"
                style={{
                  height: BTN_H,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: "2px solid #ff69b4",
                  color: "#ff69b4",
                  background: "transparent",
                  fontWeight: 700,
                  position: "relative",
                  overflow: "hidden",
                  lineHeight: 1,
                  boxSizing: "border-box",
                  cursor: "pointer",
                  marginTop: 8
                }}
              >
                Iniciar Sesión
              </button>

              {/* Registrarse */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/register"); }}
                className="btn-anim btn-green"
                style={{
                  height: BTN_H,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: "2px solid #30d158",
                  color: "#30d158",
                  background: "transparent",
                  fontWeight: 700,
                  position: "relative",
                  overflow: "hidden",
                  lineHeight: 1,
                  boxSizing: "border-box",
                  cursor: "pointer"
                }}
              >
                Registrarse
              </button>
            </>
          )}
        </nav>
      </header>

      {/* HERO */}
      <section
        style={{
          minHeight: "100vh",
          paddingTop: NAV_HEIGHT + 16,
          background:
            "url('https://assets.goal.com/images/v3/blt723cffa4086be61e/GOAL_-_Blank_WEB_-_Facebook_-_2024-02-26T070323.579.png?auto=webp&format=pjpg&width=3840&quality=60') no-repeat center center/cover",
          position: "relative",
          color: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,.55) 60%, rgba(0,0,0,.65) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1200,
            margin: "0 auto",
            padding: "40px 24px 80px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ maxWidth: 580 }}>
            <h1 style={{ fontSize: "3.4rem", marginBottom: 12, fontWeight: 700 }}>
              TeamUp.cl
            </h1>

            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontFamily:
                    "'Rubik Wet Paint','Knewave','Permanent Marker','Bebas Neue',cursive",
                  fontSize: "3.6rem",
                  color: "#ff2e93",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  lineHeight: 0.95,
                  transform: "skewX(-3deg)",
                  WebkitTextStroke: "1px rgba(255,255,255,0.06)",
                  textShadow:
                    "0 8px 24px rgba(255, 0, 128, .35), 0 1px 0 rgba(0,0,0,.35)",
                }}
              >
                EL MATCH
              </div>
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "2.6rem",
                  color: "#fff",
                  textTransform: "uppercase",
                  letterSpacing: "0.7rem",
                  marginTop: 6,
                  textShadow: "0 6px 18px rgba(0,0,0,.55)",
                }}
              >
                PERFECTO
              </div>
            </div>

            <p
              style={{
                marginBottom: 26,
                lineHeight: 1.6,
                fontSize: "1rem",
                maxWidth: 520,
              }}
            >
              Con <strong>TeamUp</strong> podrás reservar canchas de fútbol en los clubes que
              elijas, encontrar el mejor horario y sumarte al partido perfecto con tus amigos
              o nuevos equipos.
            </p>

            <div style={{ marginBottom: 22 }}>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/reservar"); }}
                className="btn-primary"
                style={{
                  display: "inline-block",
                  padding: "12px 18px",
                  borderRadius: 12,
                  background: "linear-gradient(90deg,#ff69b4,#ff1493)",
                  color: "#fff",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 6px 18px rgba(255,105,180,.35)",
                  cursor: "pointer"
                }}
              >
                Reserva tu cancha aquí
              </button>
            </div>

            <div>
              <p style={{ marginBottom: 10, fontWeight: 600 }}>Descarga nuestra app</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "8px 14px",
                    background: "#222",
                    color: "#fff",
                    fontSize: ".9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                   Apple Store
                </button>
                <button
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "8px 14px",
                    background: "#222",
                    color: "#fff",
                    fontSize: ".9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  ▶ Google Play
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN FUNCIONALIDADES */}
      <section
        style={{
          padding: "60px 20px 70px",
          background: "#111",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "2rem",
              marginBottom: 10,
              fontWeight: 700,
              color: "#ff69b4",
            }}
          >
            Lo que puedes hacer en TeamUp
          </h2>
          <p style={{ marginBottom: 34, color: "#ddd" }}>
            Reserva, busca partidos, revisa tus reservas y sigue tus partidos en un solo lugar.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {/* Reservar */}
            <div className="feature-card" style={{
              background: "#1a1a1a",
              borderRadius: 18,
              padding: "24px 20px 28px",
              boxShadow: "0 4px 18px rgba(255,105,180,0.35)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>🏟</div>
              <h3 style={{ marginBottom: 8 }}>Reservar cancha</h3>
              <p style={{ fontSize: ".95rem", marginBottom: 16, color: "#ddd", textAlign: "center" }}>
                Elige el club, la hora y el tipo de cancha que quieras. Reserva en segundos.
              </p>
              <div style={{ marginTop: "auto" }}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/reservar"); }}
                  className="btn-green card-cta"
                  style={{ cursor: "pointer", position: "relative", zIndex: 2 }}
                >
                  Reservar
                </button>
              </div>
            </div>

            {/* Buscar */}
            <div className="feature-card" style={{
              background: "#1a1a1a",
              borderRadius: 18,
              padding: "24px 20px 28px",
              boxShadow: "0 4px 18px rgba(255,105,180,0.35)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>⚽</div>
              <h3 style={{ marginBottom: 8 }}>Buscar partido</h3>
              <p style={{ fontSize: ".95rem", marginBottom: 16, color: "#ddd", textAlign: "center" }}>
                Encuentra partidos abiertos cerca de ti o arma el tuyo con tus amigos.
              </p>
              <div style={{ marginTop: "auto" }}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/buscar"); }}
                  className="btn-green card-cta"
                  style={{ cursor: "pointer", position: "relative", zIndex: 2 }}
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Publicar (bloqueo si no es dueño) */}
            <div className="feature-card" style={{
              background: "#1a1a1a",
              borderRadius: 18,
              padding: "24px 20px 28px",
              boxShadow: "0 4px 18px rgba(255,105,180,0.35)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>📢</div>
              <h3 style={{ marginBottom: 8 }}>Publicar tu cancha</h3>
              <p style={{ fontSize: ".95rem", marginBottom: 16, color: "#ddd", textAlign: "center" }}>
                Si administras un complejo, súmate a TeamUp y llena tus horarios vacíos.
              </p>
              <div style={{ marginTop: "auto" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (role !== "dueno") {
                      alert("Para publicar debes tener una cuenta de tipo DUEÑO.");
                      return;
                    }
                    navigate("/publicar");
                  }}
                  className="btn-green card-cta"
                  style={{
                    cursor: role !== "dueno" ? "not-allowed" : "pointer",
                    opacity: role !== "dueno" ? 0.95 : 1,
                    position: "relative",
                    zIndex: 2
                  }}
                >
                  Publicar
                </button>
              </div>
            </div>

            {/* ⭐ Mis reservas */}
            <div className="feature-card" style={{
              background: "#1a1a1a",
              borderRadius: 18,
              padding: "24px 20px 28px",
              boxShadow: "0 4px 18px rgba(255,105,180,0.35)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>🧾</div>
              <h3 style={{ marginBottom: 8 }}>Mis reservas</h3>
              <p style={{ fontSize: ".95rem", marginBottom: 16, color: "#ddd", textAlign: "center" }}>
                Revisa tus reservas, horarios y usa el botón “Me falta uno” para publicar partidos.
              </p>
              <div style={{ marginTop: "auto" }}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/mis-reservas"); }}
                  className="btn-green card-cta"
                  style={{ cursor: "pointer", position: "relative", zIndex: 2 }}
                >
                  Ver mis reservas
                </button>
              </div>
            </div>

            {/* ⭐ Mis partidos */}
            <div className="feature-card" style={{
              background: "#1a1a1a",
              borderRadius: 18,
              padding: "24px 20px 28px",
              boxShadow: "0 4px 18px rgba(255,105,180,0.35)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>🤝</div>
              <h3 style={{ marginBottom: 8 }}>Mis partidos</h3>
              <p style={{ fontSize: ".95rem", marginBottom: 16, color: "#ddd", textAlign: "center" }}>
                Mira los partidos que organizaste o donde estás inscrito y entra al chat del equipo.
              </p>
              <div style={{ marginTop: "auto" }}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/mis-partidos"); }}
                  className="btn-green card-cta"
                  style={{ cursor: "pointer", position: "relative", zIndex: 2 }}
                >
                  Ver mis partidos
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          padding: 20,
          background: "#111",
          color: "#fff",
        }}
      >
        © {new Date().getFullYear()} TeamUp.cl — Hecho con pasión por el deporte.
      </footer>

      {/* Animaciones / z-index */}
      <style>{`
        .btn-anim::before{
          content:"";
          position:absolute;
          top:-120%;
          left:-50%;
          width:160%;
          height:300%;
          background: linear-gradient(60deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.18) 45%, rgba(255,255,255,0) 60%);
          transform: rotate(12deg);
          transition: opacity .2s ease;
          opacity: 0;
          pointer-events:none;
        }
        .btn-anim:hover::before{ animation: shineSweep 1s ease forwards; opacity: 1; }
        @keyframes shineSweep{ 0%{transform:translateX(-40%) rotate(12deg);} 100%{transform:translateX(140%) rotate(12deg);} }
        .btn-anim:hover{ transform: translateY(-1px) scale(1.03); box-shadow: 0 8px 22px rgba(0,0,0,.28); }
        .btn-anim:active{ transform: translateY(0) scale(0.98); box-shadow: 0 4px 12px rgba(0,0,0,.35); }

        .btn-rose:hover{ background: rgba(255,105,180,.12) !important; box-shadow: 0 0 0 3px rgba(255,105,180,.18), 0 10px 24px rgba(255,105,180,.20); }
        .btn-red:hover{  background: rgba(255,59,59,.12)  !important; box-shadow: 0 0 0 3px rgba(255,59,59,.18),  0 10px 24px rgba(255,59,59,.20); }

        .btn-green{
          transition: filter .18s ease, box-shadow .18s ease, transform .18s ease, background .18s ease, border-color .18s ease, color .18s ease;
        }
        .btn-green.card-cta { position: relative; z-index: 2; pointer-events: auto; }
        .feature-card { position: relative; isolation: isolate; }

        .btn-green:hover{
          filter: brightness(1.12) saturate(1.06);
          background: rgba(48,209,88,.18) !important;
          box-shadow: 0 0 0 3px rgba(48,209,88,.28), 0 12px 28px rgba(48,209,88,.30);
          transform: translateY(-1px);
          border-color: rgba(48,209,88,.9) !important;
          color: #ffffff !important;
        }

        .btn-green.card-cta:hover{
          background: rgba(255, 107, 203, 0.89) !important;
          box-shadow: 0 0 0 3px rgba(255, 93, 174, 1), 0 14px 32px rgba(255, 89, 194, 1);
          border-color: #ff69b4 !important;
          color: #ffffff !important;
          filter: brightness(1.14) saturate(1.08);
        }
      `}</style>
    </div>
  );
}
