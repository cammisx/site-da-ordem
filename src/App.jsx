import pastaImg from "./assets/pasta.png";
import etiquetaImg from "./assets/etiqueta.png";
import carimboImg from "./assets/carimbo.png";

import "./styles/pages/login.css";

function App() {
  return (
    <div className="page">
      <div className="page-inner">
        {/* palco do login (desktop) */}
        <div className="login-stage" aria-label="tela de acesso">
          {/* pasta (fundo) */}
          <img
            className="login-folder-img"
            src={pastaImg}
            alt=""
            aria-hidden="true"
          />

          {/* carimbo CONFIDENCIAL / TOP SECRET */}
          <img
            className="login-stamp"
            src={carimboImg}
            alt=""
            aria-hidden="true"
          />

          {/* post-it / etiqueta */}
          <div className="login-postit">
            <img
              className="login-postit-img"
              src={etiquetaImg}
              alt=""
              aria-hidden="true"
            />

            {/* conteúdo funcional por cima do post-it */}
            <form className="login-postit-content">
  {/* área útil recortada do post-it */}
  <div className="login-postit-safe">
    <div className="field">
      <label htmlFor="agent">Agente</label>
      <input
        id="agent"
        type="email"
        autoComplete="username"
        spellCheck="false"
      />
    </div>

    <div className="field">
      <label htmlFor="password">Senha</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
      />
    </div>

    <button type="button" className="login-primary">
      ACESSAR
    </button>

    {/* links inferiores */}
    <div className="login-links">
      <a href="#">Cadastrar novo agente</a>
      <a href="#">Redefinir senha</a>
    </div>

    {/* google */}
    <button
      type="button"
      className="login-google"
      aria-label="acessar com google"
    >
      G
    </button>
  </div>
</form>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
