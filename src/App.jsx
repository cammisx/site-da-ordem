import { useEffect, useMemo, useRef, useState } from "react";
import "./styles/pages/login.css";

import {
  getSoundEnabled,
  setSoundEnabled,
  unlockAudio,
  playBeep,
  playClick,
  playError,
} from "./lib/uiSounds";

import { auth, authApi, googleProvider } from "./lib/firebase";

function clampIndex(i, len) {
  if (len <= 0) return 0;
  return (i + len) % len;
}

function useKeyDown(handler, deps) {
  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function BootSequence({ onDone, onNoise }) {
  const [step, setStep] = useState(0);
  const lines = useMemo(
    () => [
      "ORDEM BIOS v0.98 (c) 1998",
      "Detectando dispositivos... OK",
      "Memória: 65536K OK",
      "Iniciando ORDEM.EXE ...",
      "Carregando módulos: [AUTH] [ARQUIVOS] [LOG]",
      "Sincronizando...",
      "Pronto.",
    ],
    []
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= lines.length) {
          setTimeout(onDone, 450);
          return s;
        }
        // beep suave a cada linha
        onNoise(playBeep);
        return next;
      });
    }, step < 2 ? 520 : 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useKeyDown(
    (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        onNoise(playClick);
        onDone();
      }
    },
    [onDone]
  );

  return (
    <div className="boot">
      <div className="boot-inner">
        <div className="boot-title">C:\ORDEM\BOOT&gt;</div>
        <div className="boot-lines" aria-label="boot">
          {lines.slice(0, Math.min(step + 1, lines.length)).map((l, idx) => (
            <div key={idx} className="boot-line">
              {l}
            </div>
          ))}
          <div className="boot-hint">ENTER/ESC: pular</div>
        </div>
      </div>
    </div>
  );
}

function WindowFrame({ title, rightControls, children, onNoise }) {
  return (
    <div className="win95 glitch" role="dialog" aria-label={title}>
      <div className="win95-titlebar">
        <div className="title">
          <span aria-hidden="true">▣</span>
          <span>{title}</span>
        </div>

        <div className="win95-controls" aria-label="controles da janela">
          {rightControls}
          <button
            type="button"
            className="win95-btn"
            aria-label="minimizar"
            onClick={() => onNoise(playClick)}
          >
            _
          </button>
          <button
            type="button"
            className="win95-btn"
            aria-label="maximizar"
            onClick={() => onNoise(playClick)}
          >
            □
          </button>
          <button
            type="button"
            className="win95-btn"
            aria-label="fechar"
            onClick={() => onNoise(playError)}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="win95-body">{children}</div>

      <div className="statusbar" aria-label="barra de status">
        <span>STATUS: ONLINE</span>
        <span>BUILD 0.2 • ORDEM PARANORMAL</span>
      </div>
    </div>
  );
}

function LoginScreen({ onLoggedIn, onNoise }) {
  const [mode, setMode] = useState("login"); // login | signup | reset
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const unsub = authApi.onAuthStateChanged(auth, (user) => {
      if (user) onLoggedIn(user);
    });
    return () => unsub();
  }, [onLoggedIn]);

  const safe = async (fn) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setMsg(null);
    try {
      await fn();
      onNoise(playBeep);
    } catch (err) {
      onNoise(playError);
      setMsg(err?.message || "Falha desconhecida");
    } finally {
      busyRef.current = false;
    }
  };

  const submit = (e) => {
    e.preventDefault();
    onNoise(playClick);
    if (!email) return setMsg("Informe o e-mail.");
    if (mode !== "reset" && !pass) return setMsg("Informe a senha.");

    if (mode === "login") {
      return safe(() => authApi.signInWithEmailAndPassword(auth, email, pass));
    }
    if (mode === "signup") {
      return safe(() => authApi.createUserWithEmailAndPassword(auth, email, pass));
    }
    return safe(async () => {
      await authApi.sendPasswordResetEmail(auth, email);
      setMsg("E-mail de redefinição enviado.");
      setMode("login");
    });
  };

  const google = () => {
    onNoise(playClick);
    return safe(() => authApi.signInWithPopup(auth, googleProvider));
  };

  return (
    <div className="login-desktop" aria-label="tela de acesso">
      <WindowFrame
        title="ORDEM.EXE — TERMINAL DE ACESSO"
        onNoise={onNoise}
        rightControls={null}
      >
        <form className="terminal" onSubmit={submit}>
          <div className="terminal-header">
            <div className="terminal-title">C:\ORDEM\ACESSO&gt; {mode.toUpperCase()}</div>
            <div className="terminal-hint">Setas/ENTER: navegar • ESC: voltar</div>
          </div>

          <div className="prompt">
            {mode === "reset"
              ? "Informe seu e-mail e pressione ENTER para redefinir"
              : "Digite suas credenciais e pressione ENTER"}
            <span className="cursor" />
          </div>

          <div className="field-row">
            <label htmlFor="email">E-MAIL</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              spellCheck="false"
              placeholder="ex: chloe@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => onNoise(playBeep)}
            />
          </div>

          {mode !== "reset" && (
            <div className="field-row">
              <label htmlFor="password">SENHA</label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onFocus={() => onNoise(playBeep)}
              />
            </div>
          )}

          <div className="actions">
            <button type="submit" className="term-btn primary" onMouseDown={() => onNoise(playClick)}>
              {mode === "login" ? "ACESSAR" : mode === "signup" ? "CRIAR CONTA" : "ENVIAR LINK"}
            </button>

            <button
              type="button"
              className="term-btn"
              onMouseDown={() => onNoise(playClick)}
              onClick={google}
            >
              ENTRAR COM GOOGLE
            </button>

            <div className="links" aria-label="ações rápidas">
              {mode !== "signup" ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNoise(playClick);
                    setMode("signup");
                  }}
                >
                  CADASTRAR
                </a>
              ) : (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNoise(playClick);
                    setMode("login");
                  }}
                >
                  VOLTAR
                </a>
              )}

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNoise(playClick);
                  setMode((m) => (m === "reset" ? "login" : "reset"));
                }}
              >
                {mode === "reset" ? "CANCELAR" : "REDEFINIR SENHA"}
              </a>
            </div>
          </div>

          {msg && <div className="terminal-msg">{msg}</div>}
        </form>
      </WindowFrame>
    </div>
  );
}

function MainMenu({ user, onLogout, onNoise, soundEnabled, setSound }) {
  const MENU = useMemo(
    () => [
      { key: "origens", label: "ORIGENS" },
      { key: "classes", label: "CLASSES" },
      { key: "arquivos", label: "ARQUIVOS" },
      { key: "sair", label: "SAIR" },
    ],
    []
  );

  const ORIGENS = useMemo(
    () => [
      { key: "civil", label: "CIVIL" },
      { key: "agente", label: "AGENTE" },
      { key: "cultista", label: "CULTISTA" },
      { key: "sobrevivente", label: "SOBREVIVENTE" },
    ],
    []
  );

  const CLASSES = useMemo(
    () => [
      { key: "combatente", label: "COMBATENTE" },
      { key: "especialista", label: "ESPECIALISTA" },
      { key: "ocultista", label: "OCULTISTA" },
    ],
    []
  );

  const [focus, setFocus] = useState("menu"); // menu | list
  const [selectedMenu, setSelectedMenu] = useState(MENU[0].key);
  const [menuIndex, setMenuIndex] = useState(0);
  const [listIndex, setListIndex] = useState(0);

  const list = useMemo(() => {
    if (selectedMenu === "origens") return ORIGENS;
    if (selectedMenu === "classes") return CLASSES;
    if (selectedMenu === "arquivos") {
      return [
        { key: "casos", label: "CASOS" },
        { key: "entidades", label: "ENTIDADES" },
        { key: "relatorios", label: "RELATÓRIOS" },
      ];
    }
    return [];
  }, [selectedMenu, ORIGENS, CLASSES]);

  const activeItem = list[listIndex];

  useKeyDown(
    (e) => {
      const key = e.key;

      // navegação global
      if (key === "F8") {
        e.preventDefault();
        onNoise(playClick);
        setSound(!soundEnabled);
        return;
      }

      if (focus === "menu") {
        if (key === "ArrowDown") {
          e.preventDefault();
          onNoise(playClick);
          setMenuIndex((i) => clampIndex(i + 1, MENU.length));
        }
        if (key === "ArrowUp") {
          e.preventDefault();
          onNoise(playClick);
          setMenuIndex((i) => clampIndex(i - 1, MENU.length));
        }
        if (key === "Enter") {
          e.preventDefault();
          onNoise(playBeep);
          const m = MENU[menuIndex].key;
          setSelectedMenu(m);
          if (m === "sair") return onLogout();
          setFocus("list");
          setListIndex(0);
        }
        return;
      }

      if (focus === "list") {
        if (key === "Escape") {
          e.preventDefault();
          onNoise(playClick);
          setFocus("menu");
          return;
        }
        if (key === "ArrowDown") {
          e.preventDefault();
          onNoise(playClick);
          setListIndex((i) => clampIndex(i + 1, list.length));
        }
        if (key === "ArrowUp") {
          e.preventDefault();
          onNoise(playClick);
          setListIndex((i) => clampIndex(i - 1, list.length));
        }
        if (key === "Enter") {
          e.preventDefault();
          onNoise(playBeep);
        }
      }
    },
    [focus, menuIndex, listIndex, selectedMenu, soundEnabled, list]
  );

  const title = "ORDEM.EXE — TERMINAL DE ARQUIVOS";
  const userLabel = user?.displayName || user?.email || "AGENTE";

  return (
    <div className="login-desktop" aria-label="terminal">
      <WindowFrame
        title={title}
        onNoise={onNoise}
        rightControls={
          <button
            type="button"
            className="win95-btn"
            aria-label={soundEnabled ? "som ligado" : "som desligado"}
            title={soundEnabled ? "Som: ON (F8)" : "Som: OFF (F8)"}
            onClick={() => {
              onNoise(playClick);
              setSound(!soundEnabled);
            }}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        }
      >
        <div className="terminal terminal-app" role="application" aria-label="menu principal">
          <div className="terminal-header">
            <div className="terminal-title">C:\ORDEM\ARQUIVOS&gt; MENU</div>
            <div className="terminal-hint">
              {userLabel} • Setas/ENTER • ESC: voltar • F8: som
            </div>
          </div>

          <div className="menu-grid">
            <div className="menu-col">
              <div className="menu-title">DIRETÓRIOS</div>
              <ul className="menu-list" aria-label="menu" role="listbox">
                {MENU.map((m, idx) => {
                  const active = idx === menuIndex && focus === "menu";
                  const chosen = m.key === selectedMenu;
                  return (
                    <li
                      key={m.key}
                      className={`menu-item ${active ? "is-active" : ""} ${chosen ? "is-chosen" : ""}`}
                      onMouseEnter={() => {
                        setMenuIndex(idx);
                      }}
                      onMouseDown={() => onNoise(playClick)}
                      onClick={() => {
                        setSelectedMenu(m.key);
                        if (m.key === "sair") return onLogout();
                        setFocus("list");
                        setListIndex(0);
                        onNoise(playBeep);
                      }}
                      role="option"
                      aria-selected={chosen}
                    >
                      &gt; {m.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="menu-col">
              <div className="menu-title">ITENS</div>
              <ul className="menu-list" aria-label="itens" role="listbox">
                {list.length === 0 ? (
                  <li className="menu-item dim">Selecione um diretório…</li>
                ) : (
                  list.map((it, idx) => {
                    const active = idx === listIndex && focus === "list";
                    return (
                      <li
                        key={it.key}
                        className={`menu-item ${active ? "is-active" : ""}`}
                        onMouseEnter={() => setListIndex(idx)}
                        onMouseDown={() => onNoise(playClick)}
                        onClick={() => {
                          setFocus("list");
                          setListIndex(idx);
                          onNoise(playBeep);
                        }}
                        role="option"
                        aria-selected={active}
                      >
                        {active ? "▮" : " "} {it.label}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            <div className="menu-col panel">
              <div className="menu-title">PAINEL</div>
              <div className="panel-body">
                {!activeItem ? (
                  <div className="dim">Nenhum item selecionado.</div>
                ) : (
                  <>
                    <div className="panel-heading">{activeItem.label}</div>
                    <div className="panel-text">
                      Conteúdo temporário. Aqui entra a descrição, opções e links desse item.
                    </div>
                    <div className="panel-text dim">Dica: ENTER confirma • ESC fecha painel</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("boot"); // boot | login | app
  const [user, setUser] = useState(null);
  const [soundEnabled, setSound] = useState(getSoundEnabled());

  const onNoise = (fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.body.classList.add("theme-terminal95");
    return () => document.body.classList.remove("theme-terminal95");
  }, []);

  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // tenta desbloquear áudio no primeiro clique/tecla
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const logout = async () => {
    onNoise(playClick);
    try {
      await authApi.signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setPhase("login");
  };

  return (
    <div className="page">
      <div className="page-inner">
        {phase === "boot" && <BootSequence onDone={() => setPhase("login")} onNoise={onNoise} />}

        {phase === "login" && (
          <LoginScreen
            onLoggedIn={(u) => {
              setUser(u);
              setPhase("app");
            }}
            onNoise={onNoise}
          />
        )}

        {phase === "app" && (
          <MainMenu
            user={user}
            onLogout={logout}
            onNoise={onNoise}
            soundEnabled={soundEnabled}
            setSound={setSound}
          />
        )}
      </div>
    </div>
  );
}
