import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const HomeLanding     = lazy(() => import("./pages/HomeLanding.jsx"));
const LoginPage       = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage    = lazy(() => import("./pages/RegisterPage.jsx"));
const ReservarCancha  = lazy(() => import("./pages/ReservarCancha.jsx"));
const BuscarPartido   = lazy(() => import("./pages/BuscarPartido.jsx"));
const PublicarCancha  = lazy(() => import("./pages/PublicarCancha.jsx"));
const Perfil          = lazy(() => import("./pages/Perfil.jsx"));
const Resultados      = lazy(() => import("./pages/Resultados.jsx"));
const CanchaDetalle   = lazy(() => import("./pages/CanchaDetalle.jsx"));
const PagoReserva     = lazy(() => import("./pages/PagoReserva.jsx"));
// ✅ Mis reservas (jugador)
const MisReservas     = lazy(() => import("./pages/MisReservas.jsx"));
// ✅ Panel detalle de cancha para el dueño
const DetallesCanchaDueno = lazy(() =>
  import("./pages/DetallesCanchaDueno.jsx")
);
// ✅ Detalle de partido (jugador)
const DetallePartido  = lazy(() =>
  import("./pages/DetallePartido.jsx")  // Aquí corregimos el nombre a DetallePartido
);
// ✅ Mis partidos (organizador o jugador inscrito)
const MisPartidos     = lazy(() =>
  import("./pages/MisPartidos.jsx")
);
// ✅ NUEVO: perfil público de otro jugador
const PerfilJugador   = lazy(() =>
  import("./pages/PerfilJugador.jsx")
);

function Protected({ children }) {
  const authed =
    localStorage.getItem("isAuthenticated") === "true" ||
    !!localStorage.getItem("token");
  return authed ? children : <Navigate to="/login" replace />;
}

function OwnerOnly({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user?.tipo) return <Navigate to="/login" replace />;
  return user.tipo === "dueno" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#0b0b0b",
            color: "#fff",
          }}
        >
          Cargando…
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomeLanding />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/reservar"
          element={
            <Protected>
              <ReservarCancha />
            </Protected>
          }
        />
        <Route
          path="/buscar"
          element={
            <Protected>
              <BuscarPartido />
            </Protected>
          }
        />
        <Route
          path="/publicar"
          element={
            <OwnerOnly>
              <PublicarCancha />
            </OwnerOnly>
          }
        />
        <Route
          path="/perfil"
          element={
            <Protected>
              <Perfil />
            </Protected>
          }
        />
        <Route
          path="/resultados"
          element={
            <Protected>
              <Resultados />
            </Protected>
          }
        />

        {/* Detalle de cancha para jugadores */}
        <Route
          path="/cancha/:id"
          element={
            <Protected>
              <CanchaDetalle />
            </Protected>
          }
        />

        {/* Pago reserva */}
        <Route
          path="/pago-reserva"
          element={
            <Protected>
              <PagoReserva />
            </Protected>
          }
        />

        {/* ✅ Mis reservas (jugador) */}
        <Route
          path="/mis-reservas"
          element={
            <Protected>
              <MisReservas />
            </Protected>
          }
        />

        {/* ✅ Mis partidos (soy organizador o estoy inscrito) */}
        <Route
          path="/mis-partidos"
          element={
            <Protected>
              <MisPartidos />
            </Protected>
          }
        />

        {/* ✅ Panel del dueño para una cancha específica */}
        <Route
          path="/mis-canchas/:id"
          element={
            <OwnerOnly>
              <DetallesCanchaDueno />
            </OwnerOnly>
          }
        />

        {/* ✅ Detalle de partido (jugador) */}
        <Route
          path="/partido/:id"
          element={
            <Protected>
              <DetallePartido />  {/* Aquí se usa DetallePartido */}
            </Protected>
          }
        />

        {/* ✅ NUEVO: perfil público de un jugador por ID */}
        <Route
          path="/jugador/:id"
          element={
            <Protected>
              <PerfilJugador />
            </Protected>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
