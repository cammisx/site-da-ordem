import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/* estilos globais (1º tema, 2º base)
   ordem importa: o tema define variáveis, o base usa as variáveis
*/
import "./styles/themes/classified.css";
import "./styles/base/base.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
