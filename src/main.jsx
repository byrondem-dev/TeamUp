import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css"; // si no tienes App.css puedes borrar esta línea

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
